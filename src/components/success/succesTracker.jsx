import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import '../../styles/successTracker.css';

const SuccessTracker = ({ userId }) => {
  const [trackers, setTrackers] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingTracker, setEditingTracker] = useState(null);
  const [yesterdayMode, setYesterdayMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // Get today's date
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const formatDate = (date) => {
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('nl-NL', options);
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
        setTrackers(data.trackers || []);
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

  const toggleCheck = async (trackerId, isYesterday = false) => {
    const updatedTrackers = trackers.map(tracker => {
      if (tracker.id === trackerId) {
        const dateKey = isYesterday ? 'checkedYesterday' : 'checkedToday';
        const isChecked = !tracker[dateKey];
        
        // Update streak
        let newStreak = tracker.currentStreak;
        if (!isYesterday) {
          // Today's check
          if (isChecked && !tracker.checkedToday) {
            newStreak = tracker.currentStreak + 1;
          } else if (!isChecked && tracker.checkedToday) {
            newStreak = Math.max(0, tracker.currentStreak - 1);
          }
        } else {
          // Yesterday's check - can restore streak
          if (isChecked && !tracker.checkedYesterday && !tracker.checkedToday) {
            newStreak = tracker.previousStreak || 0;
          }
        }
        
        return {
          ...tracker,
          [dateKey]: isChecked,
          currentStreak: newStreak,
          previousStreak: tracker.currentStreak
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
      checkedToday: false,
      checkedYesterday: false,
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

  if (loading) {
    return <div className="success-tracker-loading">Laden...</div>;
  }

  return (
    <div className="success-tracker-container">
      <div className={`success-tracker ${yesterdayMode ? 'yesterday-mode' : ''}`}>
        <div className="date-header" onClick={() => setYesterdayMode(!yesterdayMode)}>
          <div className="date-label">{yesterdayMode ? 'Gisteren' : 'Vandaag'}</div>
          <div className="date-value">{formatDate(yesterdayMode ? yesterday : today)}</div>
        </div>

        <div className="trackers">
          {trackers.map(tracker => {
            const progress = getProgressPercentage(tracker.currentStreak, tracker.goal);
            const isCompleted = tracker.currentStreak >= tracker.goal;
            
            return (
              <div key={tracker.id} className={`tracker-item ${isCompleted ? 'completed' : ''}`}>
                <div 
                  className={`checkbox ${yesterdayMode ? (tracker.checkedYesterday ? 'checked' : '') : (tracker.checkedToday ? 'checked' : '')}`}
                  onClick={() => toggleCheck(tracker.id, yesterdayMode)}
                />
                <div className="tracker-info" onClick={() => openEditModal(tracker)}>
                  <div className="tracker-title">{tracker.title}</div>
                  <div className="tracker-progress">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="progress-text">
                      {tracker.currentStreak}/{tracker.goal} dagen
                      {isCompleted && ' ✨'}
                    </div>
                  </div>
                  <div className="streak-count">
                    {isCompleted 
                      ? 'Doel bereikt!' 
                      : `Nog ${tracker.goal - tracker.currentStreak} dagen te gaan`}
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

        {yesterdayMode && (
          <button className="back-button" onClick={() => setYesterdayMode(false)}>
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