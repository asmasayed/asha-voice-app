import React, { useState } from 'react';
import './VisitsLog.css'
import FollowUps from './FollowUps';

// The component now accepts { visits } as a prop
const VisitsLog = ({ visits, onViewDetails, onDelete, user }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredVisits = visits.filter(visit => {
    // Safely access the patient name, providing a fallback for any missing data
    const patientName = visit.basicInfo?.patientName || '';
    // Check if the name includes the search term (case-insensitive)
    return patientName.toLowerCase().includes(searchTerm.toLowerCase());
  });
  
  return (
    <div className="page-content">
        <FollowUps userId={user?.uid}/>
        
        {/* The Search Bar UI - no changes needed here */}
        <div className="search-bar-container">
            <input
                type="text"
                className="search-input"
                placeholder="Search by patient name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        
        <h2>Past Visits</h2>

        <div className="visits-list">
            {/* --- THIS IS THE FIX --- */}
            {/* We now check the length of filteredVisits and map over it */}
            {filteredVisits.length > 0 ? (
                filteredVisits.map((visit) => (
                    // Each card needs a unique key, we'll use the visit's Firestore ID
                    <div key={visit.id} className="visit-card card">
                        <div className="visit-card-header">
                            <h3>{visit.basicInfo?.patientName || 'Unknown Patient'}</h3>
                            <p>{visit.basicInfo?.age || 'N/A'} years old</p>
                        </div>
                        <div className="visit-card-body">
                            <p><strong>Visit Type:</strong> {visit.visitType || 'General'}</p>
                        </div>
                        <div className="visit-card-footer">
                            <button className="btn btn-primary" onClick={() => onViewDetails(visit)}>View Details</button>
                            <button 
                                onClick={() => onDelete(visit.id)} 
                                className="btn btn-danger" 
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))
            ) : (
                // This section now handles all "not found" cases intelligently
                <div>
                    {visits.length > 0 ? (
                        <p>No visits found matching your search.</p>
                    ) : (
                        <p>No visits have been recorded yet.</p>
                    )}
                </div>
            )}
            {/* --- END OF FIX --- */}
        </div>
    </div>
  );
};

export default VisitsLog;
