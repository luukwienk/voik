// components/health/HealthStatsPage.jsx
import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Area, AreaChart 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Minus, Calendar,
  Weight, Flame, Ruler, Dumbbell, Target, Award
} from 'lucide-react';

const HealthStatsPage = ({ 
  healthData = [],
  calculateWeeklyAverage,
  calculateTrend
}) => {
  const [selectedMetric, setSelectedMetric] = useState('weight');
  const [timeRange, setTimeRange] = useState('month');
  const [chartData, setChartData] = useState([]);

  // Process health data for charts
  useEffect(() => {
    if (!healthData || healthData.length === 0) {
      setChartData([]);
      return;
    }

    const now = new Date();
    let startDate = new Date();
    
    // Set start date based on time range
    switch (timeRange) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case '3months':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Filter and sort data
    const filteredData = healthData
      .filter(entry => {
        const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
        return entryDate >= startDate && entryDate <= now;
      })
      .sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : new Date(a.date);
        const dateB = b.date instanceof Date ? b.date : new Date(b.date);
        return dateA - dateB;
      });

    // Format for chart
    const formattedData = filteredData.map(entry => {
      const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
      return {
        date: entryDate.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }),
        weight: entry.weight || null,
        calories: entry.calories || null,
        waist: entry.waist || null,
        workout: entry.workout || null
      };
    });

    setChartData(formattedData);
  }, [healthData, timeRange]);

  // Calculate statistics for a metric
  const calculateStats = (metric) => {
    if (!healthData || healthData.length === 0) {
      return { current: 0, avg: 0, min: 0, max: 0, trend: 0, change: 0 };
    }

    const values = healthData
      .map(d => d[metric])
      .filter(v => v !== null && v !== undefined && v > 0);
    
    if (values.length === 0) {
      return { current: 0, avg: 0, min: 0, max: 0, trend: 0, change: 0 };
    }
    
    const sortedData = [...healthData]
      .filter(d => d[metric] !== null && d[metric] !== undefined)
      .sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : new Date(a.date);
        const dateB = b.date instanceof Date ? b.date : new Date(b.date);
        return dateA - dateB;
      });
    
    const current = sortedData[sortedData.length - 1]?.[metric] || 0;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Calculate trend
    let trend = 0;
    let change = 0;
    if (sortedData.length > 1) {
      const firstValue = sortedData[0][metric];
      trend = current - firstValue;
      change = firstValue !== 0 ? ((current - firstValue) / firstValue) * 100 : 0;
    }
    
    return { current, avg, min, max, trend, change };
  };

  // Metric configurations
  const metrics = {
    weight: { 
      label: 'Gewicht', 
      unit: 'kg', 
      icon: Weight, 
      color: '#10B981',
      format: (v) => v?.toFixed(1) || '0',
      goodDirection: 'down'
    },
    calories: { 
      label: 'Calorieën', 
      unit: 'kcal', 
      icon: Flame, 
      color: '#3B82F6',
      format: (v) => Math.round(v || 0),
      goodDirection: 'neutral'
    },
    waist: { 
      label: 'Taille', 
      unit: 'cm', 
      icon: Ruler, 
      color: '#8B5CF6',
      format: (v) => v?.toFixed(1) || '0',
      goodDirection: 'down'
    },
    workout: { 
      label: 'Training', 
      unit: 'min', 
      icon: Dumbbell, 
      color: '#F97316',
      format: (v) => Math.round(v || 0),
      goodDirection: 'up'
    }
  };

  const currentMetric = metrics[selectedMetric];
  const stats = calculateStats(selectedMetric);

  // Calculate streak
  const calculateStreak = () => {
    if (!healthData || healthData.length === 0) return 0;
    
    const sortedData = [...healthData].sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date : new Date(a.date);
      const dateB = b.date instanceof Date ? b.date : new Date(b.date);
      return dateB - dateA;
    });
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < sortedData.length; i++) {
      const entryDate = sortedData[i].date instanceof Date ? sortedData[i].date : new Date(sortedData[i].date);
      entryDate.setHours(0, 0, 0, 0);
      
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      
      if (entryDate.getTime() === expectedDate.getTime() && sortedData[i][selectedMetric] > 0) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  // Get trend icon
  const getTrendIcon = (trend, goodDirection) => {
    if (Math.abs(trend) < 0.1) return <Minus style={{ width: 16, height: 16 }} />;
    
    const isPositive = trend > 0;
    const isGood = (goodDirection === 'up' && isPositive) || 
                   (goodDirection === 'down' && !isPositive) ||
                   goodDirection === 'neutral';
    
    return isPositive ? 
      <TrendingUp style={{ width: 16, height: 16, color: isGood ? '#10B981' : '#ef4444' }} /> :
      <TrendingDown style={{ width: 16, height: 16, color: isGood ? '#10B981' : '#ef4444' }} />;
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'white',
          padding: '12px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          border: '1px solid #e0e0e0'
        }}>
          <p style={{
            fontSize: '12px',
            fontWeight: '500',
            color: '#666',
            margin: '0 0 4px 0'
          }}>{label}</p>
          <p style={{
            fontSize: '16px',
            fontWeight: '600',
            color: currentMetric.color,
            margin: 0
          }}>
            {currentMetric.format(payload[0].value)} {currentMetric.unit}
          </p>
        </div>
      );
    }
    return null;
  };

  // Get week comparison
  const getWeekComparison = () => {
    if (!healthData || healthData.length < 14) {
      return { current: 0, previous: 0, change: 0 };
    }
    
    const now = new Date();
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(now.getDate() - 14);
    
    const currentWeek = healthData.filter(entry => {
      const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
      return entryDate >= oneWeekAgo && entryDate <= now;
    });
    
    const previousWeek = healthData.filter(entry => {
      const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
      return entryDate >= twoWeeksAgo && entryDate < oneWeekAgo;
    });
    
    const currentAvg = currentWeek.length > 0 
      ? currentWeek.reduce((sum, d) => sum + (d[selectedMetric] || 0), 0) / currentWeek.length
      : 0;
    
    const previousAvg = previousWeek.length > 0
      ? previousWeek.reduce((sum, d) => sum + (d[selectedMetric] || 0), 0) / previousWeek.length
      : 0;
    
    const change = previousAvg !== 0 ? ((currentAvg - previousAvg) / previousAvg) * 100 : 0;
    
    return { current: currentAvg, previous: previousAvg, change };
  };

  const comparison = getWeekComparison();

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        padding: '20px'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '600',
            color: '#333',
            margin: '0 0 8px 0'
          }}>Gezondheidsanalyse</h1>
          <p style={{
            fontSize: '14px',
            color: '#666',
            margin: 0
          }}>Bekijk je voortgang en trends</p>
        </div>

        {/* Time range selector */}
        <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          {['week', 'month', '3months', 'year'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: timeRange === range ? '#2196F3' : '#f5f5f5',
                color: timeRange === range ? 'white' : '#666'
              }}
            >
              {range === 'week' ? 'Week' :
               range === 'month' ? 'Maand' :
               range === '3months' ? '3 Maanden' : 'Jaar'}
            </button>
          ))}
        </div>
      </div>

      {/* Metric selector cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px'
      }}>
        {Object.entries(metrics).map(([key, metric]) => {
          const metricStats = calculateStats(key);
          const Icon = metric.icon;
          const isSelected = selectedMetric === key;
          
          const trendIsUp = metricStats.change > 0;
          const trendIsDown = metricStats.change < 0;
          let changeColor = '#666'; // Grijs voor neutraal

          if ((metric.goodDirection === 'up' && trendIsUp) || (metric.goodDirection === 'down' && trendIsDown)) {
            changeColor = '#10B981'; // Groen voor goede trend
          } else if ((metric.goodDirection === 'up' && trendIsDown) || (metric.goodDirection === 'down' && trendIsUp)) {
            changeColor = '#ef4444'; // Rood voor slechte trend
          }
          
          return (
            <div
              key={key}
              role="button"
              tabIndex="0"
              onClick={() => setSelectedMetric(key)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setSelectedMetric(key);
                }
              }}
              style={{
                padding: '20px',
                borderRadius: '12px',
                border: isSelected ? '2px solid #2196F3' : '2px solid transparent',
                backgroundColor: isSelected ? '#e3f2fd' : 'white',
                boxShadow: isSelected ? '0 4px 12px rgba(33, 150, 243, 0.2)' : '0 2px 8px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                textAlign: 'left',
                outline: 'none' // Voorkom focus-ring op de div
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px'
              }}>
                <Icon style={{ 
                  width: 20, 
                  height: 20, 
                  color: isSelected ? '#2196F3' : '#666' 
                }} />
                {getTrendIcon(metricStats.trend, metric.goodDirection)}
              </div>
              <div style={{
                fontSize: '14px',
                color: '#666',
                marginBottom: '4px'
              }}>{metric.label}</div>
              <div style={{
                fontSize: '24px',
                fontWeight: '600',
                color: '#333'
              }}>
                {metric.format(metricStats.current)} {metric.unit}
              </div>
              <div style={{
                fontSize: '12px',
                color: changeColor,
                marginTop: '4px'
              }}>
                {metricStats.change !== 0 && (
                  <>
                    {metricStats.change > 0 ? '+' : ''}{metricStats.change.toFixed(1)}%
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main chart */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        padding: '24px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#333',
            margin: 0
          }}>
            {currentMetric.label} Verloop
          </h2>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            fontSize: '14px',
            color: '#666'
          }}>
            <span>Gemiddelde: <strong>{currentMetric.format(stats.avg)} {currentMetric.unit}</strong></span>
            <span>Min: <strong>{currentMetric.format(stats.min)}</strong></span>
            <span>Max: <strong>{currentMetric.format(stats.max)}</strong></span>
          </div>
        </div>
        
        <div style={{ height: '300px', width: '100%' }}>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              {selectedMetric === 'workout' ? (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#666' }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#666' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey={selectedMetric} 
                    fill={currentMetric.color}
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              ) : (
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id={`gradient-${selectedMetric}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={currentMetric.color} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={currentMetric.color} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#666' }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#666' }}
                    domain={['dataMin - 1', 'dataMax + 1']}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey={selectedMetric}
                    stroke={currentMetric.color}
                    strokeWidth={2}
                    fill={`url(#gradient-${selectedMetric})`}
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#999'
            }}>
              <p>Geen data beschikbaar voor deze periode</p>
            </div>
          )}
        </div>
        
        <div style={{
          marginTop: '24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '16px',
          fontSize: '14px',
          color: '#666'
        }}>
          <div>
            <span style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>
              {timeRange === 'week' ? 'Week' : timeRange === 'month' ? 'Maand' : timeRange === '3months' ? '3 Maanden' : 'Jaar'} Trend
            </span>
            <span style={{ fontWeight: '600', color: '#333' }}>
              {stats.trend > 0 ? '+' : ''}{currentMetric.format(stats.trend)} {currentMetric.unit}
            </span>
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Gemiddelde</span>
            <span style={{ fontWeight: '600', color: '#333' }}>
              {currentMetric.format(stats.avg)} {currentMetric.unit}
            </span>
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Huidige</span>
            <span style={{ fontWeight: '600', color: '#333' }}>
              {currentMetric.format(stats.current)} {currentMetric.unit}
            </span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '16px'
      }}>
        {/* Week comparison */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          padding: '20px'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '500',
            color: '#666',
            marginBottom: '16px'
          }}>Week Vergelijking</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '14px', color: '#666' }}>Deze week</span>
              <span style={{ fontSize: '16px', fontWeight: '600' }}>
                {currentMetric.format(comparison.current)} {currentMetric.unit}
              </span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '14px', color: '#666' }}>Vorige week</span>
              <span style={{ fontSize: '16px', fontWeight: '600' }}>
                {currentMetric.format(comparison.previous)} {currentMetric.unit}
              </span>
            </div>
            <div style={{
              paddingTop: '12px',
              borderTop: '1px solid #eee'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{ fontSize: '14px', fontWeight: '500' }}>Verschil</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {getTrendIcon(comparison.change, currentMetric.goodDirection)}
                  <span style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: Math.abs(comparison.change) < 1 ? '#666' :
                           comparison.change > 0 ? 
                           (currentMetric.goodDirection === 'up' ? '#10B981' : '#ef4444') :
                           (currentMetric.goodDirection === 'down' ? '#10B981' : '#ef4444')
                  }}>
                    {comparison.change > 0 ? '+' : ''}{comparison.change.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          padding: '20px'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '500',
            color: '#666',
            marginBottom: '16px'
          }}>Prestaties</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: '#fef3c7',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Award style={{ width: 20, height: 20, color: '#f59e0b' }} />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                  Consistentie
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {calculateStreak()} dagen op rij gemeten
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: '#d1fae5',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Target style={{ width: 20, height: 20, color: '#10B981' }} />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                  Beste week
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {currentMetric.format(stats.min)} {currentMetric.unit} bereikt
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Goals */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          padding: '20px'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '500',
            color: '#666',
            marginBottom: '16px'
          }}>Doelen</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '14px',
                marginBottom: '8px'
              }}>
                <span>Maand doel</span>
                <span style={{ fontWeight: '500' }}>75%</span>
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: '#e5e7eb',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div 
                  style={{
                    height: '100%',
                    width: '75%',
                    backgroundColor: '#2196F3',
                    transition: 'width 0.5s ease'
                  }}
                />
              </div>
            </div>
            <button style={{
              width: '100%',
              padding: '8px',
              fontSize: '14px',
              color: '#2196F3',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}>
              Doelen instellen
            </button>
          </div>
        </div>
      </div>

      {/* Data table preview */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        padding: '20px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '500',
            color: '#333',
            margin: 0
          }}>Recente Metingen</h3>
          <button style={{
            fontSize: '14px',
            color: '#2196F3',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer'
          }}>
            Bekijk alles →
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            fontSize: '14px',
            borderCollapse: 'collapse'
          }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee' }}>
                <th style={{
                  textAlign: 'left',
                  padding: '12px 8px',
                  fontWeight: '500',
                  color: '#666'
                }}>Datum</th>
                <th style={{
                  textAlign: 'right',
                  padding: '12px 8px',
                  fontWeight: '500',
                  color: '#666'
                }}>Gewicht</th>
                <th style={{
                  textAlign: 'right',
                  padding: '12px 8px',
                  fontWeight: '500',
                  color: '#666'
                }}>Calorieën</th>
                <th style={{
                  textAlign: 'right',
                  padding: '12px 8px',
                  fontWeight: '500',
                  color: '#666'
                }}>Taille</th>
                <th style={{
                  textAlign: 'right',
                  padding: '12px 8px',
                  fontWeight: '500',
                  color: '#666'
                }}>Training</th>
              </tr>
            </thead>
            <tbody>
              {healthData
                .slice()
                .sort((a, b) => {
                  const dateA = a.date instanceof Date ? a.date : new Date(a.date);
                  const dateB = b.date instanceof Date ? b.date : new Date(b.date);
                  return dateB - dateA;
                })
                .slice(0, 5)
                .map((entry, idx) => {
                  const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
                  return (
                    <tr key={entry.id || idx} style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: '12px 8px' }}>
                        {entryDate.toLocaleDateString('nl-NL', { 
                          day: 'numeric',
                          month: 'short'
                        })}
                      </td>
                      <td style={{ textAlign: 'right', padding: '12px 8px' }}>
                        {entry.weight ? `${entry.weight.toFixed(1)} kg` : '-'}
                      </td>
                      <td style={{ textAlign: 'right', padding: '12px 8px' }}>
                        {entry.calories || '-'}
                      </td>
                      <td style={{ textAlign: 'right', padding: '12px 8px' }}>
                        {entry.waist ? `${entry.waist.toFixed(1)} cm` : '-'}
                      </td>
                      <td style={{ textAlign: 'right', padding: '12px 8px' }}>
                        {entry.workout ? `${entry.workout} min` : '-'}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
          {healthData.length === 0 && (
            <p style={{
              textAlign: 'center',
              padding: '40px',
              color: '#999'
            }}>
              Nog geen gezondheidsgegevens beschikbaar
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default HealthStatsPage;