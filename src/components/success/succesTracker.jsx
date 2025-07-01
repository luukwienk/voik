import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import '../../styles/successTracker.css';

const SuccessTracker = ({ userId }) => {
  const [trackers, setTrackers] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingTracker, setEditingTracker] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  // Format date for display
  const formatDate = (date) => {
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('nl-NL', options);
  };

  // Format day of week for display
  const formatDayOfWeek = (date) => {
    const options = { weekday: 'long' };
    return date.toLocaleDateString('nl-NL', options);
  };

  // Format date for data storage (YYYY-MM-DD)
  const formatDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Check if a date is in the future
  const isFutureDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date > today;
  };

  // Navigate to previous day
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  // Navigate to next day
  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    if (!isFutureDate(newDate)) {
      setSelectedDate(newDate);
    }
  };

  // Check if selected date is today
  const isToday = () => {
    const today = new Date();
    return formatDateKey(selectedDate) === formatDateKey(today);
  };

  // Calculate streak for a tracker
  const calculateStreak = (history, fromDate = null) => {
    if (!history || Object.keys(history).length === 0) return 0;
    
    const sortedDates = Object.keys(history)
      .filter(date => history[date].checked)
      .sort((a, b) => new Date(b) - new Date(a));
    
    if (sortedDates.length === 0) return 0;
    
    let currentStreak = 0;
    const startDate = fromDate ? formatDateKey(fromDate) : formatDateKey(new Date());
    
    // Start from the most recent checked date or today
    let checkDate = new Date(sortedDates[0] <= startDate ? sortedDates[0] : startDate);
    
    // Count backwards to find current streak
    while (true) {
      const dateKey = formatDateKey(checkDate);
      
      if (history[dateKey]?.checked) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        // Check if yesterday was checked (for streak continuation)
        checkDate.setDate(checkDate.getDate() - 1);
        const yesterdayKey = formatDateKey(checkDate);
        if (history[yesterdayKey]?.checked) {
          checkDate.setDate(checkDate.getDate() + 1); // Go back to the gap day
          checkDate.setDate(checkDate.getDate() - 2); // Skip the gap and continue
          continue;
        }
        break;
      }
    }
    
    return currentStreak;
  };

  // Calculate longest streak
  const calculateLongestStreak = (history) => {
    if (!history || Object.keys(history).length === 0) return 0;
    
    const sortedDates = Object.keys(history)
      .filter(date => history[date].checked)
      .sort((a, b) => new Date(a) - new Date(b));
    
    if (sortedDates.length === 0) return 0;
    
    let longestStreak = 0;
    let currentStreak = 0;
    let lastDate = null;
    
    sortedDates.forEach(dateKey => {
      const currentDate = new Date(dateKey);
      
      if (!lastDate) {
        currentStreak = 1;
      } else {
        const daysDiff = Math.floor((currentDate - lastDate) / (1000 * 60 * 60 * 24));
        if (daysDiff === 1) {
          currentStreak++;
        } else {
          longestStreak = Math.max(longestStreak, currentStreak);
          currentStreak = 1;
        }
      }
      
      lastDate = currentDate;
    });
    
    return Math.max(longestStreak, currentStreak);
  };

  // Load trackers from Firebase
  useEffect(() => {
    if (!userId) return;
    loadTrackers();
  }, [userId]);

  const loadTrackers = async () => {
    try {
      const docRef = doc(db, 'users', userId, 'data', 'successTrackers');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const loadedTrackers = data.trackers || [];
        
        // Update streaks for all trackers
        const updatedTrackers = loadedTrackers.map(tracker => ({
          ...tracker,
          currentStreak: calculateStreak(tracker.history),
          longestStreak: calculateLongestStreak(tracker.history)
        }));
        
        setTrackers(updatedTrackers);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading trackers:', error);
      setLoading(false);
    }
  };

  const saveTrackers = async (updatedTrackers) => {
    try {
      const docRef = doc(db, 'users', userId, 'data', 'successTrackers');
      await setDoc(docRef, { trackers: updatedTrackers }, { merge: true });
      setTrackers(updatedTrackers);
    } catch (error) {
      console.error('Error saving trackers:', error);
    }
  };

  const toggleCheck = async (trackerId) => {
    const dateKey = formatDateKey(selectedDate);
    
    const updatedTrackers = trackers.map(tracker => {
      if (tracker.id === trackerId) {
        const history = tracker.history || {};
        const isChecked = !history[dateKey]?.checked;
        
        // Update history
        const newHistory = {
          ...history,
          [dateKey]: { checked: isChecked }
        };
        
        // Recalculate streaks
        const currentStreak = calculateStreak(newHistory);
        const longestStreak = calculateLongestStreak(newHistory);
        
        return {
          ...tracker,
          history: newHistory,
          currentStreak,
          longestStreak
        };
      }
      return tracker;
    });
    
    await saveTrackers(updatedTrackers);
  };

  const addTracker = async (title, goal) => {
    const newTracker = {
      id: Date.now().toString(),
      title,
      goal: parseInt(goal),
      currentStreak: 0,
      longestStreak: 0,
      history: {},
      createdAt: new Date().toISOString()
    };
    
    const updatedTrackers = [...trackers, newTracker];
    await saveTrackers(updatedTrackers);
    setIsEditModalOpen(false);
  };

  const updateTracker = async (id, title, goal) => {
    const updatedTrackers = trackers.map(tracker => 
      tracker.id === id 
        ? { ...tracker, title, goal: parseInt(goal) }
        : tracker
    );
    await saveTrackers(updatedTrackers);
    setIsEditModalOpen(false);
    setEditingTracker(null);
  };

  const deleteTracker = async (id) => {
    const updatedTrackers = trackers.filter(tracker => tracker.id !== id);
    await saveTrackers(updatedTrackers);
    setIsDeleteModalOpen(false);
    setIsEditModalOpen(false);
    setEditingTracker(null);
  };

  const openEditModal = (tracker = null) => {
    setEditingTracker(tracker);
    setIsEditModalOpen(true);
  };

  const getProgressPercentage = (current, goal) => {
    return Math.min(100, (current / goal) * 100);
  };

  // Get visual timeline for last 7 days
  const getTimelineData = (tracker) => {
    const timeline = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = formatDateKey(date);
      timeline.push({
        date: date,
        dateKey: dateKey,
        checked: tracker.history?.[dateKey]?.checked || false,
        isToday: i === 0,
        dayLabel: date.toLocaleDateString('nl-NL', { weekday: 'short' })[0].toUpperCase()
      });
    }
    
    return timeline;
  };

  if (loading) {
    return <div className="success-tracker-loading">Laden...</div>;
  }

  const dateKey = formatDateKey(selectedDate);
  const canGoNext = !isToday();

  return (
    <div className="success-tracker-container">
      <div className="success-tracker">
        <div className="date-navigation">
          <button 
            className="nav-arrow"
            onClick={goToPreviousDay}
            aria-label="Vorige dag"
          >
            ←
          </button>
          <div className="date-header">
            <div className="date-label">
              {isToday() ? 'Vandaag' : formatDateKey(selectedDate) === formatDateKey(new Date(new Date().setDate(new Date().getDate() - 1))) ? 'Gisteren' : ''}
            </div>
            <div className="date-value">{formatDate(selectedDate)}</div>
            <div className="day-of-week">{formatDayOfWeek(selectedDate)}</div>
          </div>
          <button 
            className="nav-arrow"
            onClick={goToNextDay}
            disabled={!canGoNext}
            aria-label="Volgende dag"
          >
            →
          </button>
        </div>

        <div className="trackers">
          {trackers.map(tracker => {
            const progress = getProgressPercentage(tracker.currentStreak, tracker.goal);
            const isCompleted = tracker.currentStreak >= tracker.goal;
            const isChecked = tracker.history?.[dateKey]?.checked || false;
            const timeline = getTimelineData(tracker);
            
            return (
              <div key={tracker.id} className={`tracker-item ${isCompleted ? 'completed' : ''}`}>
                <div 
                  className={`checkbox ${isChecked ? 'checked' : ''}`}
                  onClick={() => toggleCheck(tracker.id)}
                />
                <div className="tracker-info" onClick={() => openEditModal(tracker)}>
                  <div className="tracker-title">{tracker.title}</div>
                  
                  <div className="timeline">
                    {timeline.map((day, index) => (
                      <div 
                        key={day.dateKey}
                        className={`timeline-day ${day.checked ? 'checked' : ''} ${day.isToday ? 'today' : ''}`}
                        title={formatDate(day.date)}
                      >
                        <span className="day-label">{day.dayLabel}</span>
                        <div className="day-indicator" />
                      </div>
                    ))}
                  </div>
                  
                  <div className="tracker-progress">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="progress-text">
                      {tracker.currentStreak}/{tracker.goal} dagen
                      {isCompleted && ' ✨'}
                    </div>
                  </div>
                  
                  <div className="streak-info">
                    <div className="streak-count">
                      {isCompleted 
                        ? 'Doel bereikt!' 
                        : `Nog ${tracker.goal - tracker.currentStreak} dagen te gaan`}
                    </div>
                    {tracker.longestStreak > 0 && (
                      <div className="longest-streak">
                        Langste reeks: {tracker.longestStreak} dagen
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          {trackers.length < 3 && (
            <div className="add-tracker" onClick={() => openEditModal()}>
              <div className="add-icon">+</div>
              <div>Tracker toevoegen</div>
            </div>
          )}
        </div>

        {!isToday() && (
          <button className="back-button" onClick={() => setSelectedDate(new Date())}>
            Terug naar vandaag
          </button>
        )}
      </div>

      {/* Edit/Add Modal */}
      {isEditModalOpen && (
        <div className="edit-modal">
          <div className="edit-content">
            <label className="edit-label">Naam</label>
            <input
              type="text"
              className="edit-input"
              placeholder="bijv. Mediteren"
              defaultValue={editingTracker?.title || ''}
              id="tracker-title-input"
            />
            
            <label className="edit-label">Doel (dagen)</label>
            <select 
              className="goal-select" 
              defaultValue={editingTracker?.goal || 21}
              id="tracker-goal-select"
            >
              <option value="7">7 dagen</option>
              <option value="14">14 dagen</option>
              <option value="21">21 dagen</option>
              <option value="30">30 dagen</option>
              <option value="60">60 dagen</option>
              <option value="90">90 dagen</option>
              <option value="100">100 dagen</option>
            </select>
            
            <div className="edit-buttons">
              {editingTracker && (
                <button 
                  className="btn btn-delete" 
                  onClick={() => setIsDeleteModalOpen(true)}
                >
                  Verwijder
                </button>
              )}
              <button 
                className="btn btn-save" 
                onClick={() => {
                  const title = document.getElementById('tracker-title-input').value;
                  const goal = document.getElementById('tracker-goal-select').value;
                  if (title) {
                    if (editingTracker) {
                      updateTracker(editingTracker.id, title, goal);
                    } else {
                      addTracker(title, goal);
                    }
                  }
                }}
              >
                {editingTracker ? 'Opslaan' : 'Toevoegen'}
              </button>
            </div>
            <div style={{ marginTop: '8px' }}>
              <button 
                className="btn btn-cancel" 
                style={{ width: '100%' }}
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingTracker(null);
                }}
              >
                Annuleren
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="edit-modal">
          <div className="edit-content">
            <p style={{ marginBottom: '16px' }}>
              Tracker verwijderen? Je voortgang van <strong>{editingTracker?.currentStreak} dagen</strong> gaat verloren.
            </p>
            <div className="edit-buttons">
              <button 
                className="btn btn-cancel" 
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Annuleren
              </button>
              <button 
                className="btn btn-delete" 
                onClick={() => deleteTracker(editingTracker.id)}
              >
                Verwijderen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuccessTracker;