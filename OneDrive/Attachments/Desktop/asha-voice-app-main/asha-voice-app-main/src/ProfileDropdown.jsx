import React from 'react';

const ProfileDropdown = ({ user, onLogout, isOpen, onToggle, dropdownRef }) => {
  // If there's no user, don't render anything.
  if (!user) {
    return null;
  }

  return (
    <div ref={dropdownRef}className="profile-dropdown-container">
      <button onClick={onToggle} className="profile-picture-button">
        {/* Use the user's Google profile picture, or a fallback initial */}
        {user.photoURL ? (
          <img src={user.photoURL} alt="Profile" />
        ) : (
          <span>{user.email ? user.email.charAt(0).toUpperCase() : 'A'}</span>
        )}
      </button>

      {/* Conditionally render the dropdown menu */}
      {isOpen && (
        <div className="profile-dropdown-menu">
          <div className="dropdown-user-info">
            <strong>{user.name || user.displayName || 'ASHA Worker'}</strong>
            <p>{user.email}</p>
            {/* We can add the ASHA ID here later if it's available */}
          </div>
          <button onClick={onLogout} className="dropdown-logout-button">
            Log Out
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;