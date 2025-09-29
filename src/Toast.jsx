import React, { useEffect } from 'react';
import './App.css';

const Toast = ({ message, type = 'success', onClose }) => {
  // This effect will automatically call the onClose function after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000); // The toast will disappear after 3 seconds

    // Cleanup function to clear the timer if the component is unmounted early
    return () => {
      clearTimeout(timer);
    };
  }, [onClose]);

  // The main component render
  return (
    <div className={`toast ${type}`}>
      <span className="toast-message">{message}</span>
      <button className="toast-close-btn" onClick={onClose}>
        &times;
      </button>
    </div>
  );
};

export default Toast;