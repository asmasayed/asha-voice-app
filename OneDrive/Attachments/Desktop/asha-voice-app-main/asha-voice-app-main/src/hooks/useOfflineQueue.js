import { useState, useEffect } from 'react';

const QUEUE_STORAGE_KEY = 'offlineVisitQueue';

export const useOfflineQueue = () => {
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    const storedQueue = window.localStorage.getItem(QUEUE_STORAGE_KEY);
    if (storedQueue) setQueue(JSON.parse(storedQueue));
  }, []);

  const addVisitToQueue = (visitData) => {
    const newQueue = [...queue, { ...visitData, id: `local-${Date.now()}`, isLocal: true }];
    setQueue(newQueue);
    window.localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(newQueue));
  };

  const clearQueue = () => {
    setQueue([]);
    window.localStorage.removeItem(QUEUE_STORAGE_KEY);
  };
  
  const removeVisitFromQueue = (visitId) => {
    // Create a new array that excludes the visit with the matching ID
    const newQueue = queue.filter(visit => visit.id !== visitId);
    
    // Update the state
    setQueue(newQueue);
    
    // Update localStorage with the new, smaller queue
    window.localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(newQueue));
  };

  return { queue, addVisitToQueue, clearQueue, removeVisitFromQueue }; 
};


