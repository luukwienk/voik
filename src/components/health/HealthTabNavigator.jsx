// components/health/HealthTabNavigator.jsx
import React, { useState } from 'react';
import { PlusCircle, BarChart3 } from 'lucide-react';
import HealthEntryPage from './HealthEntryPage';
import HealthStatsPage from './HealthStatsPage';

const HealthTabNavigator = ({
  healthData,
  healthLoading,
  addHealthEntry,
  updateHealthEntry,
  deleteHealthEntry,
  getHealthDataByDateRange,
  getLatestEntry,
  calculateWeeklyAverage,
  calculateTrend
}) => {
  const [activeTab, setActiveTab] = useState('entry'); // 'entry' or 'stats'

  if (healthLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '400px',
        color: '#666'
      }}>
        <p>Gezondheidsgegevens laden...</p>
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Tab Navigation */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e0e0e0',
        padding: '0 20px',
        marginBottom: '20px'
      }}>
        <div style={{
          display: 'flex',
          gap: '32px',
          maxWidth: '500px',
          margin: '0 auto'
        }}>
          <button
            onClick={() => setActiveTab('entry')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '16px 0',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'entry' ? '2px solid #2196F3' : '2px solid transparent',
              color: activeTab === 'entry' ? '#2196F3' : '#666',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <PlusCircle style={{ width: 20, height: 20 }} />
            Invoer
          </button>
          
          <button
            onClick={() => setActiveTab('stats')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '16px 0',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'stats' ? '2px solid #2196F3' : '2px solid transparent',
              color: activeTab === 'stats' ? '#2196F3' : '#666',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <BarChart3 style={{ width: 20, height: 20 }} />
            Statistieken
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}>
        {activeTab === 'entry' ? (
          <HealthEntryPage
            healthData={healthData}
            addHealthEntry={addHealthEntry}
            updateHealthEntry={updateHealthEntry}
            deleteHealthEntry={deleteHealthEntry}
          />
        ) : (
          <HealthStatsPage
            healthData={healthData}
            calculateWeeklyAverage={calculateWeeklyAverage}
            calculateTrend={calculateTrend}
          />
        )}
      </div>
    </div>
  );
};

export default HealthTabNavigator;