// health/MinimalistHealthTracker.jsx
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartLine, 
  faChevronLeft, 
  faChevronRight, 
  faPlus, 
  faCalendarAlt, 
  faRunning, 
  faWeight, 
  faSpinner
} from '@fortawesome/free-solid-svg-icons';

const MinimalistHealthTracker = ({ 
  healthData = [], 
  healthLoading,
  addHealthEntry,
  updateHealthEntry,
  deleteHealthEntry,
  getHealthDataByDateRange,
  getLatestEntry,
  calculateWeeklyAverage,
  calculateTrend
}) => {
  const [activeMetric, setActiveMetric] = useState('weight');
  const [isQuickEntryOpen, setIsQuickEntryOpen] = useState(false);
  const [entryValues, setEntryValues] = useState({
    date: new Date().toISOString().split('T')[0],
    calories: '',
    weight: '',
    waist: '',
    workout: ''
  });
  const [chartData, setChartData] = useState([]);
  const [timeRange, setTimeRange] = useState('week'); // 'week', 'month', 'year'

  // Get current date and format it
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short', 
    day: 'numeric'
  });

  // Process health data for the chart when it changes
  useEffect(() => {
    if (healthData && healthData.length > 0) {
      prepareChartData();
    } else {
      // Use sample data if no actual data exists
      setChartData(getSampleData());
    }
  }, [healthData, timeRange]);

  // Format health data for the chart based on time range
  const prepareChartData = () => {
    let startDate;
    const endDate = new Date();
    
    if (timeRange === 'week') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
    } else if (timeRange === 'month') {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (timeRange === 'year') {
      startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);
    }
    
    const filteredData = healthData
      .filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= startDate && entryDate <= endDate;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    if (filteredData.length > 0) {
      const formattedData = filteredData.map(entry => ({
        date: new Date(entry.date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
        weight: parseFloat(entry.weight) || 0,
        calories: parseInt(entry.calories) || 0,
        waist: parseFloat(entry.waist) || 0,
        workout: parseInt(entry.workout) || 0
      }));
      
      setChartData(formattedData);
    } else {
      // If no data in range, use sample data
      setChartData(getSampleData());
    }
  };

  // Generate sample data if no real data exists
  const getSampleData = () => {
    return [
      { date: '04/21', calories: 2100, weight: 80.5, waist: 86, workout: 45 },
      { date: '04/22', calories: 2200, weight: 80.3, waist: 86, workout: 30 },
      { date: '04/23', calories: 1900, weight: 80.1, waist: 85.5, workout: 0 },
      { date: '04/24', calories: 2300, weight: 80.2, waist: 85.5, workout: 60 },
      { date: '04/25', calories: 2050, weight: 79.8, waist: 85, workout: 45 },
      { date: '04/26', calories: 2150, weight: 79.6, waist: 85, workout: 30 },
      { date: '04/27', calories: 1950, weight: 79.4, waist: 84.5, workout: 0 },
    ];
  };

  // Get latest values
  const getLatestValue = (metric) => {
    if (healthData && healthData.length > 0) {
      const latest = healthData.sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      )[0];
      return latest[metric] || 0;
    }
    
    // Return sample data if no real data
    const sampleData = getSampleData();
    return sampleData[sampleData.length - 1][metric];
  };

  // Get weekly average (using hook function if data exists)
  const getWeeklyAverage = (metric) => {
    if (healthData && healthData.length > 0) {
      if (typeof calculateWeeklyAverage === 'function') {
        return calculateWeeklyAverage(metric);
      }
      // Fallback implementation if calculateWeeklyAverage is not provided
      const lastWeekData = healthData
        .filter(entry => {
          const entryDate = new Date(entry.date);
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          return entryDate >= oneWeekAgo;
        })
        .map(entry => entry[metric])
        .filter(value => value !== null && value !== undefined);
      
      if (lastWeekData.length > 0) {
        const sum = lastWeekData.reduce((acc, curr) => acc + curr, 0);
        return (sum / lastWeekData.length).toFixed(1);
      }
    }
    
    // Calculate from sample data if no real data
    const sampleData = getSampleData();
    const sum = sampleData.reduce((acc, curr) => acc + curr[metric], 0);
    return (sum / sampleData.length).toFixed(1);
  };

  // Get trend (using hook function if data exists)
  const getTrend = (metric) => {
    if (healthData && healthData.length > 0) {
      if (typeof calculateTrend === 'function') {
        const trendValue = calculateTrend(metric);
        
        if (metric === 'weight' || metric === 'waist') {
          return trendValue + (metric === 'weight' ? ' kg' : ' cm');
        } else if (metric === 'calories') {
          return trendValue + ' kcal';
        } else {
          return trendValue + ' min';
        }
      }
      
      // Fallback implementation if calculateTrend is not provided
      const sortedData = [...healthData].sort((a, b) => new Date(a.date) - new Date(b.date));
      const firstValue = sortedData[0][metric];
      const lastValue = sortedData[sortedData.length - 1][metric];
      const difference = lastValue - firstValue;
      
      if (metric === 'weight' || metric === 'waist') {
        return difference.toFixed(1) + (metric === 'weight' ? ' kg' : ' cm');
      } else if (metric === 'calories') {
        return difference.toFixed(0) + ' kcal';
      } else {
        return difference.toFixed(0) + ' min';
      }
    }
    
    // Calculate from sample data if no real data
    const sampleData = getSampleData();
    const firstValue = sampleData[0][metric];
    const lastValue = sampleData[sampleData.length - 1][metric];
    const difference = lastValue - firstValue;
    
    if (metric === 'weight' || metric === 'waist') {
      return difference.toFixed(1) + (metric === 'weight' ? ' kg' : ' cm');
    } else if (metric === 'calories') {
      return difference.toFixed(0) + ' kcal';
    } else {
      return difference.toFixed(0) + ' min';
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEntryValues({
      ...entryValues,
      [name]: value
    });
  };

  // Handle quick entry submission
  const handleQuickSubmit = async (e) => {
    e.preventDefault();
    
    // Validate that at least one metric has been entered
    if (!entryValues.weight && !entryValues.calories && !entryValues.waist && !entryValues.workout) {
      alert('Please enter at least one measurement');
      return;
    }
    
    try {
      // Format entry for database
      const newEntry = {
        date: new Date(entryValues.date),
        weight: entryValues.weight ? parseFloat(entryValues.weight) : null,
        calories: entryValues.calories ? parseInt(entryValues.calories) : null,
        waist: entryValues.waist ? parseFloat(entryValues.waist) : null,
        workout: entryValues.workout ? parseInt(entryValues.workout) : null
      };
      
      // Add entry to database
      await addHealthEntry(newEntry);
      
      // Reset form
      setEntryValues({
        date: new Date().toISOString().split('T')[0],
        calories: '',
        weight: '',
        waist: '',
        workout: ''
      });
      
      setIsQuickEntryOpen(false);
      
      // Refresh chart data
      prepareChartData();
    } catch (error) {
      console.error('Error adding health entry:', error);
      alert('Failed to save health entry. Please try again.');
    }
  };

  // Change time range
  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
  };

  // Get the color for a specific metric
  const getMetricColor = (metric) => {
    switch(metric) {
      case 'weight': return '#10B981';
      case 'calories': return '#3B82F6';
      case 'waist': return '#8B5CF6';
      case 'workout': return '#F97316';
      default: return '#888888';
    }
  };

  // Format time range label
  const getTimeRangeLabel = () => {
    if (timeRange === 'week') return 'This Week';
    if (timeRange === 'month') return 'This Month';
    if (timeRange === 'year') return 'This Year';
    return 'Custom Range';
  };

  // If health data is loading, show loading state
  if (healthLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '16px'
      }}>
        <FontAwesomeIcon icon={faSpinner} spin style={{ fontSize: '48px', color: '#2196F3', marginBottom: '16px' }} />
        <p>Loading health data...</p>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '16px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      {/* Date header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#333',
            margin: 0
          }}>{formattedDate}</h2>
          <p style={{
            fontSize: '14px',
            color: '#666',
            margin: '4px 0 0 0'
          }}>Health Tracker</p>
        </div>
        <button 
          onClick={() => setIsQuickEntryOpen(!isQuickEntryOpen)}
          style={{
            backgroundColor: '#2196F3',
            color: 'white',
            borderRadius: '50%',
            height: '40px',
            width: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(33, 150, 243, 0.3)'
          }}
        >
          <FontAwesomeIcon icon={faPlus} />
        </button>
      </div>

      {/* Quick entry form */}
      {isQuickEntryOpen && (
        <div style={{
          backgroundColor: '#f9f9f9',
          padding: '24px',
          borderRadius: '8px',
          marginBottom: '24px',
          border: '1px solid #eee'
        }}>
          <form onSubmit={handleQuickSubmit}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '24px',
              marginBottom: '24px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#333',
                  marginBottom: '8px'
                }}>Date</label>
                <input
                  type="date"
                  name="date"
                  value={entryValues.date}
                  onChange={handleInputChange}
                  style={{
                    width: '80%',
                    padding: '10px',
                    border: '2px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#333',
                  marginBottom: '8px'
                }}>Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  name="weight"
                  value={entryValues.weight}
                  onChange={handleInputChange}
                  placeholder="75.5"
                  style={{
                    width: '  80%',
                    padding: '10px',
                    border: '2px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#333',
                  marginBottom: '8px'
                }}>Calories</label>
                <input
                  type="number"
                  name="calories"
                  value={entryValues.calories}
                  onChange={handleInputChange}
                  placeholder="2000"
                  style={{
                    width: '80%',
                    padding: '10px',
                    border: '2px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#333',
                  marginBottom: '8px'
                }}>Waist (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  name="waist"
                  value={entryValues.waist}
                  onChange={handleInputChange}
                  placeholder="85"
                  style={{
                    width: '80%',
                    padding: '10px',
                    border: '2px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#333',
                  marginBottom: '8px'
                }}>Workout (min)</label>
                <input
                  type="number"
                  name="workout"
                  value={entryValues.workout}
                  onChange={handleInputChange}
                  placeholder="45"
                  style={{
                    width: '80%',
                    padding: '10px',
                    border: '2px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                type="button"
                onClick={() => setIsQuickEntryOpen(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f0f0f0',
                  color: '#333',
                  border: '2px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Metric cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <div 
          style={{
            padding: '12px',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            backgroundColor: activeMetric === 'weight' ? '#e6f7ef' : '#f9f9f9',
            border: activeMetric === 'weight' ? '2px solid #10B981' : '1px solid #eee'
          }}
          onClick={() => setActiveMetric('weight')}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '4px'
          }}>
            <FontAwesomeIcon icon={faWeight} style={{ color: '#10B981', marginRight: '8px', fontSize: '14px' }} />
            <span style={{ fontSize: '14px', fontWeight: '500' }}>Weight</span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
            {getLatestValue('weight')} kg
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            Avg: {getWeeklyAverage('weight')} kg
          </div>
        </div>
        
        <div 
          style={{
            padding: '12px',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            backgroundColor: activeMetric === 'calories' ? '#ebf5ff' : '#f9f9f9',
            border: activeMetric === 'calories' ? '2px solid #3B82F6' : '1px solid #eee'
          }}
          onClick={() => setActiveMetric('calories')}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '4px'
          }}>
            <FontAwesomeIcon icon={faCalendarAlt} style={{ color: '#3B82F6', marginRight: '8px', fontSize: '14px' }} />
            <span style={{ fontSize: '14px', fontWeight: '500' }}>Calories</span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
            {getLatestValue('calories')}
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            Avg: {getWeeklyAverage('calories')} kcal
          </div>
        </div>
        
        <div 
          style={{
            padding: '12px',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            backgroundColor: activeMetric === 'waist' ? '#f5f3ff' : '#f9f9f9',
            border: activeMetric === 'waist' ? '2px solid #8B5CF6' : '1px solid #eee'
          }}
          onClick={() => setActiveMetric('waist')}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '4px'
          }}>
            <span style={{ color: '#8B5CF6', marginRight: '8px', fontSize: '16px' }}>⊖</span>
            <span style={{ fontSize: '14px', fontWeight: '500' }}>Waist</span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
            {getLatestValue('waist')} cm
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            Avg: {getWeeklyAverage('waist')} cm
          </div>
        </div>
        
        <div 
          style={{
            padding: '12px',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            backgroundColor: activeMetric === 'workout' ? '#fff7ed' : '#f9f9f9',
            border: activeMetric === 'workout' ? '2px solid #F97316' : '1px solid #eee'
          }}
          onClick={() => setActiveMetric('workout')}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '4px'
          }}>
            <FontAwesomeIcon icon={faRunning} style={{ color: '#F97316', marginRight: '8px', fontSize: '14px' }} />
            <span style={{ fontSize: '14px', fontWeight: '500' }}>Workout</span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
            {getLatestValue('workout')} min
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            Avg: {getWeeklyAverage('workout')} min
          </div>
        </div>
      </div>

      {/* Progress chart */}
      <div style={{
        backgroundColor: '#f9f9f9',
        padding: '16px',
        borderRadius: '8px',
        border: '1px solid #eee',
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center'
          }}>
            <FontAwesomeIcon 
              icon={faChartLine} 
              style={{ 
                marginRight: '8px', 
                fontSize: '16px',
                color: getMetricColor(activeMetric)
              }} 
            />
            <h3 style={{ 
              fontWeight: '600',
              fontSize: '16px',
              margin: 0
            }}>
              {activeMetric.charAt(0).toUpperCase() + activeMetric.slice(1)} Progress
            </h3>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: '14px'
          }}>
            <button 
              onClick={() => handleTimeRangeChange('week')}
              style={{
                padding: '4px 8px',
                backgroundColor: timeRange === 'week' ? '#e3f2fd' : 'transparent',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '8px',
                fontSize: '12px',
                color: timeRange === 'week' ? '#2196F3' : '#666'
              }}
            >
              Week
            </button>
            <button 
              onClick={() => handleTimeRangeChange('month')}
              style={{
                padding: '4px 8px',
                backgroundColor: timeRange === 'month' ? '#e3f2fd' : 'transparent',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '8px',
                fontSize: '12px',
                color: timeRange === 'month' ? '#2196F3' : '#666'
              }}
            >
              Month
            </button>
            <button 
              onClick={() => handleTimeRangeChange('year')}
              style={{
                padding: '4px 8px',
                backgroundColor: timeRange === 'year' ? '#e3f2fd' : 'transparent',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                color: timeRange === 'year' ? '#2196F3' : '#666'
              }}
            >
              Year
            </button>
          </div>
        </div>
        
        <div style={{ height: '250px', flexGrow: 1 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} />
              <YAxis 
                domain={['auto', 'auto']} 
                axisLine={false} 
                tickLine={false} 
                width={30}
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #ddd',
                  borderRadius: '4px', 
                  fontSize: '12px' 
                }} 
              />
              <Line 
                type="monotone" 
                dataKey={activeMetric} 
                stroke={getMetricColor(activeMetric)}
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 0, fill: getMetricColor(activeMetric) }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div style={{
          marginTop: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '14px',
          color: '#666'
        }}>
          <div>
            <span style={{ display: 'block', fontSize: '12px' }}>
              {timeRange.charAt(0).toUpperCase() + timeRange.slice(1)} Trend
            </span>
            <span style={{ fontWeight: '500', color: '#333' }}>{getTrend(activeMetric)}</span>
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '12px' }}>Average</span>
            <span style={{ fontWeight: '500', color: '#333' }}>
              {getWeeklyAverage(activeMetric)} {activeMetric === 'weight' ? 'kg' : activeMetric === 'waist' ? 'cm' : activeMetric === 'calories' ? 'kcal' : 'min'}
            </span>
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '12px' }}>Current</span>
            <span style={{ fontWeight: '500', color: '#333' }}>
              {getLatestValue(activeMetric)} {activeMetric === 'weight' ? 'kg' : activeMetric === 'waist' ? 'cm' : activeMetric === 'calories' ? 'kcal' : 'min'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MinimalistHealthTracker;
