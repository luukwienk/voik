// hooks/useHealthTracking.js
import { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase';

export const useHealthTracking = (user) => {
  const [healthData, setHealthData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHealthData = async () => {
      if (!user) {
        setHealthData([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Get all health entries for this user
        const healthQuery = query(
          collection(db, 'users', user.uid, 'healthEntries'),
          orderBy('date', 'desc')
        );
        const querySnapshot = await getDocs(healthQuery);
        
        const healthEntries = [];
        querySnapshot.forEach((doc) => {
          healthEntries.push({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date.toDate() // Convert Firestore timestamp to JS Date
          });
        });

        setHealthData(healthEntries);
      } catch (err) {
        console.error('Error fetching health data:', err);
        setError('Failed to load health data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHealthData();
  }, [user]);

  const addHealthEntry = async (entryData) => {
    if (!user) return;
    
    try {
      // Create a new document with auto-generated ID
      const newEntryRef = doc(collection(db, 'users', user.uid, 'healthEntries'));
      
      // Format the entry with ID and timestamp
      const formattedEntry = {
        ...entryData,
        id: newEntryRef.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: user.uid
      };
      
      // Save to Firestore
      await setDoc(newEntryRef, formattedEntry);
      
      // Update local state
      setHealthData(prev => [formattedEntry, ...prev]);
      
      return formattedEntry;
    } catch (err) {
      console.error('Error adding health entry:', err);
      setError('Failed to add health entry. Please try again.');
      throw err;
    }
  };

  const updateHealthEntry = async (entryId, updatedData) => {
    if (!user) return;
    
    try {
      const entryRef = doc(db, 'users', user.uid, 'healthEntries', entryId);
      
      // Update with new data and timestamp
      const dataToUpdate = {
        ...updatedData,
        updatedAt: new Date()
      };
      
      await updateDoc(entryRef, dataToUpdate);
      
      // Update local state
      setHealthData(prev => 
        prev.map(entry => 
          entry.id === entryId 
            ? { ...entry, ...updatedData, updatedAt: new Date() } 
            : entry
        )
      );
      
      return true;
    } catch (err) {
      console.error('Error updating health entry:', err);
      setError('Failed to update health entry. Please try again.');
      throw err;
    }
  };

  const deleteHealthEntry = async (entryId) => {
    if (!user) return;
    
    try {
      const entryRef = doc(db, 'users', user.uid, 'healthEntries', entryId);
      await deleteDoc(entryRef);
      
      // Update local state
      setHealthData(prev => prev.filter(entry => entry.id !== entryId));
      
      return true;
    } catch (err) {
      console.error('Error deleting health entry:', err);
      setError('Failed to delete health entry. Please try again.');
      throw err;
    }
  };

  // Get health data for a specific date range
  const getHealthDataByDateRange = (startDate, endDate) => {
    return healthData.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= startDate && entryDate <= endDate;
    });
  };

  // Get the latest entry
  const getLatestEntry = () => {
    if (healthData.length === 0) return null;
    return healthData[0]; // Assuming data is sorted by date desc
  };

  // Calculate weekly averages
  const calculateWeeklyAverage = (metric) => {
    if (healthData.length === 0) return 0;
    
    // Get entries from the last 7 days
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weeklyData = healthData.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= weekAgo && entryDate <= today;
    });
    
    if (weeklyData.length === 0) return 0;
    
    // Calculate average
    const sum = weeklyData.reduce((acc, entry) => acc + (entry[metric] || 0), 0);
    return (sum / weeklyData.length).toFixed(1);
  };

  // Calculate trend (difference between oldest and newest in range)
  const calculateTrend = (metric, days = 7) => {
    if (healthData.length < 2) return 0;
    
    // Get entries from the specified days
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - days);
    
    const filteredData = healthData.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= startDate && entryDate <= today;
    });
    
    if (filteredData.length < 2) return 0;
    
    // Sort by date (oldest first)
    filteredData.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Calculate difference between first and last
    const firstValue = filteredData[0][metric] || 0;
    const lastValue = filteredData[filteredData.length - 1][metric] || 0;
    
    return (lastValue - firstValue).toFixed(1);
  };

  return {
    healthData,
    isLoading,
    error,
    addHealthEntry,
    updateHealthEntry,
    deleteHealthEntry,
    getHealthDataByDateRange,
    getLatestEntry,
    calculateWeeklyAverage,
    calculateTrend
  };
};