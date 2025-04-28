# Health Tracking Components

This directory contains components for the health tracking feature of the personal assistant app. The health tracker allows users to monitor their weight, calorie intake, waist measurements, and workout duration over time.

## Components

### MinimalistHealthTracker

The main component that provides a clean, minimalist interface for tracking health metrics.

#### Features:
- Quick entry form for adding daily health measurements
- Interactive metric cards showing the latest values and averages
- Progress chart for visualizing trends over time (weekly, monthly, yearly)
- Responsive design that works well on both desktop and mobile

#### Props:
- `healthData`: Array of health entry objects from the database
- `healthLoading`: Boolean indicating if health data is being loaded
- `addHealthEntry`: Function to add a new health entry
- `updateHealthEntry`: Function to update an existing health entry
- `deleteHealthEntry`: Function to delete a health entry
- `getHealthDataByDateRange`: Function to filter health data by date range
- `getLatestEntry`: Function to get the most recent health entry
- `calculateWeeklyAverage`: Function to calculate average for a metric
- `calculateTrend`: Function to calculate the trend for a metric

## Data Structure

Each health entry object follows this structure:

```javascript
{
  id: string,           // Unique identifier
  date: Date,           // Date of the entry
  weight: number,       // Weight in kg (optional)
  calories: number,     // Calorie intake for the day (optional)
  waist: number,        // Waist measurement in cm (optional)
  workout: number,      // Workout duration in minutes (optional)
  createdAt: Date,      // Creation timestamp
  updatedAt: Date,      // Last update timestamp
  userId: string        // ID of the user who created the entry
}
```

## Usage

```jsx
import MinimalistHealthTracker from './components/health/MinimalistHealthTracker';
import { useHealthTracking } from './hooks/useHealthTracking';

function HealthTrackingPage({ user }) {
  const { 
    healthData,
    healthLoading,
    addHealthEntry,
    updateHealthEntry,
    deleteHealthEntry,
    getHealthDataByDateRange,
    getLatestEntry,
    calculateWeeklyAverage,
    calculateTrend
  } = useHealthTracking(user);

  return (
    <MinimalistHealthTracker
      healthData={healthData}
      healthLoading={healthLoading}
      addHealthEntry={addHealthEntry}
      updateHealthEntry={updateHealthEntry}
      deleteHealthEntry={deleteHealthEntry}
      getHealthDataByDateRange={getHealthDataByDateRange}
      getLatestEntry={getLatestEntry}
      calculateWeeklyAverage={calculateWeeklyAverage}
      calculateTrend={calculateTrend}
    />
  );
}
```

## Future Enhancements

Potential improvements for the health tracking feature:

1. Add more detailed analysis and insights (BMI calculation, calorie targets, etc.)
2. Implement goal setting and progress tracking
3. Add additional metrics (body fat percentage, blood pressure, etc.)
4. Create a detailed view for each metric with more comprehensive charts
5. Add export functionality for health data
6. Implement integration with fitness tracking devices/apps

## Dependencies

The health tracking components rely on:
- React for the UI
- Recharts for data visualization
- Firebase/Firestore for data storage
- FontAwesomeIcon for icons