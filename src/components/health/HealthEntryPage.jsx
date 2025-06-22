// components/health/HealthEntryPage.jsx
import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Save, Trash2, Copy, TrendingUp, Activity } from 'lucide-react';

const HealthEntryPage = ({ 
  healthData = [], 
  addHealthEntry,
  updateHealthEntry,
  deleteHealthEntry
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [formValues, setFormValues] = useState({
    weight: '',
    calories: '',
    waist: '',
    workout: ''
  });
  const [existingEntry, setExistingEntry] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if data exists for selected date
  useEffect(() => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    const existing = healthData.find(entry => {
      const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
      return entryDate.toISOString().split('T')[0] === dateStr;
    });
    
    if (existing) {
      setExistingEntry(existing);
      setFormValues({
        weight: existing.weight || '',
        calories: existing.calories || '',
        waist: existing.waist || '',
        workout: existing.workout || ''
      });
    } else {
      setExistingEntry(null);
      setFormValues({
        weight: '',
        calories: '',
        waist: '',
        workout: ''
      });
    }
  }, [selectedDate, healthData]);

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString('nl-NL', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  // Get week dates
  const getWeekDates = () => {
    const dates = [];
    const startOfWeek = new Date(selectedDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  // Check if date has data
  const hasData = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return healthData.some(entry => {
      const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
      return entryDate.toISOString().split('T')[0] === dateStr;
    });
  };

  // Handle date navigation
  const navigateDate = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + direction);
    setSelectedDate(newDate);
  };

  // Handle form input
  const handleInputChange = (field, value) => {
    setFormValues({
      ...formValues,
      [field]: value
    });
  };

  // Handle save
  const handleSave = async () => {
    // Validate that at least one metric has been entered
    if (!formValues.weight && !formValues.calories && !formValues.waist && !formValues.workout) {
      alert('Vul ten minste één meting in');
      return;
    }
    
    setIsLoading(true);
    try {
      const entry = {
        date: selectedDate,
        weight: formValues.weight ? parseFloat(formValues.weight) : null,
        calories: formValues.calories ? parseInt(formValues.calories) : null,
        waist: formValues.waist ? parseFloat(formValues.waist) : null,
        workout: formValues.workout ? parseInt(formValues.workout) : null
      };
      
      if (existingEntry) {
        await updateHealthEntry(existingEntry.id, entry);
      } else {
        await addHealthEntry(entry);
      }
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error('Error saving health entry:', error);
      alert('Kon gezondheidsgegevens niet opslaan. Probeer het opnieuw.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!existingEntry) return;
    
    if (window.confirm('Weet je zeker dat je deze invoer wilt verwijderen?')) {
      setIsLoading(true);
      try {
        await deleteHealthEntry(existingEntry.id);
        setFormValues({
          weight: '',
          calories: '',
          waist: '',
          workout: ''
        });
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      } catch (error) {
        console.error('Error deleting health entry:', error);
        alert('Kon gezondheidsgegevens niet verwijderen. Probeer het opnieuw.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Copy from previous day
  const copyFromPrevious = () => {
    const previousDate = new Date(selectedDate);
    previousDate.setDate(selectedDate.getDate() - 1);
    const dateStr = previousDate.toISOString().split('T')[0];
    const previousEntry = healthData.find(entry => {
      const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
      return entryDate.toISOString().split('T')[0] === dateStr;
    });
    
    if (previousEntry) {
      setFormValues({
        weight: previousEntry.weight || '',
        calories: previousEntry.calories || '',
        waist: previousEntry.waist || '',
        workout: previousEntry.workout || ''
      });
    } else {
      alert('Geen gegevens gevonden voor de vorige dag');
    }
  };

  // Check if today
  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Get recent entries for summary
  const getRecentEntries = () => {
    return healthData
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 3);
  };

  return (
    <div className="health-entry-page" style={{
      maxWidth: '500px',
      margin: '0 auto',
      padding: '20px',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px'
        }}>
          <h1 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#333',
            margin: 0
          }}>Gezondheid Invoeren</h1>
          <Calendar style={{ width: 20, height: 20, color: '#666' }} />
        </div>

        {/* Week view */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '8px',
          marginBottom: '20px'
        }}>
          {getWeekDates().map((date, idx) => {
            const isSelected = date.toDateString() === selectedDate.toDateString();
            const hasDataForDate = hasData(date);
            
            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(date)}
                style={{
                  position: 'relative',
                  padding: '12px 8px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  backgroundColor: isSelected ? '#2196F3' : '#f5f5f5',
                  color: isSelected ? 'white' : '#333',
                  transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                  boxShadow: isSelected ? '0 2px 8px rgba(33, 150, 243, 0.3)' : 'none',
                  outline: isToday(date) && !isSelected ? '2px solid #2196F3' : 'none',
                  outlineOffset: '2px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <div style={{
                  fontSize: '11px',
                  fontWeight: '500',
                  marginBottom: '4px',
                  opacity: 0.8
                }}>
                  {date.toLocaleDateString('nl-NL', { weekday: 'short' })}
                </div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '600'
                }}>
                  {date.getDate()}
                </div>
                {hasDataForDate && (
                  <div style={{
                    position: 'absolute',
                    bottom: '4px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: isSelected ? 'white' : '#10B981'
                  }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Date navigation */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          <button
            onClick={() => navigateDate(-1)}
            style={{
              padding: '8px',
              backgroundColor: '#f5f5f5',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ChevronLeft style={{ width: 16, height: 16, color: '#666' }} />
          </button>
          
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{
              fontSize: '14px',
              color: '#666',
              marginBottom: '4px'
            }}>
              {existingEntry ? 'Bewerken' : 'Nieuwe invoer'}
            </div>
            <div style={{
              fontSize: '16px',
              fontWeight: '500',
              color: '#333'
            }}>
              {formatDate(selectedDate)}
            </div>
          </div>
          
          <button
            onClick={() => navigateDate(1)}
            style={{
              padding: '8px',
              backgroundColor: '#f5f5f5',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ChevronRight style={{ width: 16, height: 16, color: '#666' }} />
          </button>
        </div>
      </div>

      {/* Entry form */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        padding: '20px',
        marginBottom: '20px'
      }}>
        {/* Status indicator */}
        {existingEntry && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            color: '#2196F3',
            backgroundColor: '#e3f2fd',
            padding: '8px 12px',
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            <Activity style={{ width: 16, height: 16 }} />
            <span>Data aanwezig - wijzig indien nodig</span>
          </div>
        )}

        {/* Form fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '14px',
              fontWeight: '500',
              color: '#555',
              marginBottom: '6px'
            }}>
              <span>Gewicht</span>
              <span style={{ fontSize: '12px', color: '#999' }}>kg</span>
            </label>
            <input
              type="number"
              step="0.1"
              value={formValues.weight}
              onChange={(e) => handleInputChange('weight', e.target.value)}
              placeholder="79.5"
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '16px',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '14px',
              fontWeight: '500',
              color: '#555',
              marginBottom: '6px'
            }}>
              <span>Calorieën</span>
              <span style={{ fontSize: '12px', color: '#999' }}>kcal</span>
            </label>
            <input
              type="number"
              value={formValues.calories}
              onChange={(e) => handleInputChange('calories', e.target.value)}
              placeholder="2000"
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '16px',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '14px',
              fontWeight: '500',
              color: '#555',
              marginBottom: '6px'
            }}>
              <span>Taille</span>
              <span style={{ fontSize: '12px', color: '#999' }}>cm</span>
            </label>
            <input
              type="number"
              step="0.1"
              value={formValues.waist}
              onChange={(e) => handleInputChange('waist', e.target.value)}
              placeholder="85"
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '16px',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '14px',
              fontWeight: '500',
              color: '#555',
              marginBottom: '6px'
            }}>
              <span>Training</span>
              <span style={{ fontSize: '12px', color: '#999' }}>minuten</span>
            </label>
            <input
              type="number"
              value={formValues.workout}
              onChange={(e) => handleInputChange('workout', e.target.value)}
              placeholder="45"
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '16px',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* Quick actions */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginTop: '16px'
        }}>
          <button
            onClick={copyFromPrevious}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              fontSize: '14px',
              backgroundColor: '#f5f5f5',
              color: '#555',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            <Copy style={{ width: 14, height: 14 }} />
            Kopieer vorige
          </button>
          <button
            onClick={() => setSelectedDate(new Date())}
            style={{
              padding: '8px 12px',
              fontSize: '14px',
              backgroundColor: '#f5f5f5',
              color: '#555',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            Vandaag
          </button>
        </div>

        {/* Action buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginTop: '20px'
        }}>
          <button
            onClick={handleSave}
            disabled={isLoading}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              transition: 'all 0.2s'
            }}
          >
            <Save style={{ width: 18, height: 18 }} />
            {isLoading ? 'Bezig...' : (existingEntry ? 'Bijwerken' : 'Opslaan')}
          </button>
          
          {existingEntry && (
            <button
              onClick={handleDelete}
              disabled={isLoading}
              style={{
                padding: '12px 16px',
                backgroundColor: '#ffebee',
                color: '#f44336',
                border: 'none',
                borderRadius: '8px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
                transition: 'all 0.2s'
              }}
            >
              <Trash2 style={{ width: 18, height: 18 }} />
            </button>
          )}
        </div>

        {/* Success message */}
        {showSuccess && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '16px',
            fontSize: '14px',
            color: '#10B981',
            backgroundColor: '#d1fae5',
            padding: '8px 12px',
            borderRadius: '8px',
            animation: 'pulse 1s ease-in-out'
          }}>
            <TrendingUp style={{ width: 16, height: 16 }} />
            <span>Opgeslagen!</span>
          </div>
        )}
      </div>

      {/* Recent entries summary */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        padding: '20px'
      }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '500',
          color: '#333',
          marginBottom: '16px'
        }}>Recent overzicht</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {getRecentEntries().map((entry, idx) => {
            const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
            return (
              <div 
                key={entry.id || idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              >
                <span style={{ color: '#666' }}>
                  {entryDate.toLocaleDateString('nl-NL', { 
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short'
                  })}
                </span>
                <div style={{
                  display: 'flex',
                  gap: '16px',
                  color: '#333'
                }}>
                  {entry.weight && <span>{entry.weight} kg</span>}
                  {entry.calories && <span>{entry.calories} kcal</span>}
                  {entry.workout > 0 && <span>{entry.workout} min</span>}
                </div>
              </div>
            );
          })}
          {getRecentEntries().length === 0 && (
            <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
              Nog geen recente invoeren
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default HealthEntryPage;