import React from 'react';

// We pass `activePage` to know which button to highlight,
// and `onNavigate` to tell the App component which page to switch to.
const Navbar = ({ activePage, onNavigate }) => {
  return (
    <nav className="navbar">
      <button 
        className={activePage === 'home' ? 'active' : ''} 
        onClick={() => onNavigate('home')}
      >
        🏠 Home
      </button>
      <button 
        className={activePage === 'visits' ? 'active' : ''} 
        onClick={() => onNavigate('visits')}
      >
        📋 Visits Log
      </button>
      <button 
        className={activePage === 'schemes' ? 'active' : ''} 
        onClick={() => onNavigate('schemes')}
      >
        💡 Schemes
      </button>
    </nav>
  );
};

export default Navbar;