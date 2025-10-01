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

  return { queue, addVisitToQueue, clearQueue };
};


