import React from 'react';
import './VisitsLog.css'
import FollowUps from './FollowUps';


// The component now accepts { visits } as a prop
const VisitsLog = ({ visits, onViewDetails, onDelete, user }) => {
  return (
    <div className="page-content">
        <FollowUps userId={user?.uid}/>
      <h2>Past Visits</h2>

      {/* A helpful message if there are no visits */}
      {visits.length === 0 ? (
        <p>No visits have been recorded yet.</p>
      ) : (
        // A container for our list of visit cards
        <div className="visits-list">
          {/* We use .map() to loop over the visits array */}
          {visits.map((visit) => (
            // Each card needs a unique key, we'll use the visit's Firestore ID
            <div key={visit.id} className="visit-card card">
              <div className="visit-card-header">
                {/* Display the patient's name and age */}
                <h3>{visit.basicInfo?.patientName || 'Unknown Patient'}</h3>
                <p>{visit.basicInfo?.age || 'N/A'} years old</p>
              </div>
              <div className="visit-card-body">
                {/* Display the visit type */}
                <p><strong>Visit Type:</strong> {visit.visitType || 'General'}</p>
              </div>
              <div className="visit-card-footer">
                {/* This button will be for our next feature */}
                <button className="btn btn-primary" onClick={() => onViewDetails(visit)}>View Details</button>
                <button 
                onClick={() => onDelete(visit.id)} 
                className="btn btn-danger" 
              >
                Delete
              </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VisitsLog;