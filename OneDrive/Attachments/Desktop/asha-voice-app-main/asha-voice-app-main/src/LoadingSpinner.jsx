import React from 'react';
import './App.css';
const LoadingSpinner = ({ fullScreen = true }) => {
    // We use a container to help center the spinner on the screen
    return (
      <div className={fullScreen ? "spinner-container-fullscreen" : "spinner-container-inline"}>
        <div className="loading-spinner"></div>
      </div>
    );
  };
  export default LoadingSpinner;