import React, { useState,useEffect } from 'react';
import './VisitsLog.css'
import FollowUps from './FollowUps';
import VisitCardSkeleton from './VisitCardSkeleton';

// The component now accepts { visits } as a prop
const VisitsLog = ({ visits, onViewDetails, onDelete, user, isLoading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedInfo, setCopiedInfo] = useState(null);

  const filteredVisits = visits.filter(visit => {
    // Safely access the patient name, providing a fallback for any missing data
    const patientName = visit.basicInfo?.patientName || '';
    // Check if the name includes the search term (case-insensitive)
    return patientName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  useEffect(() => {
    if (copiedInfo) {
      const timer = setTimeout(() => {
        setCopiedInfo(null);
      }, 2000);
      // Clean up the timer if the component unmounts or copiedInfo changes again
      return () => clearTimeout(timer);
    }
  }, [copiedInfo]);
  
   const handleCopyToClipboard = async (textToCopy, visitId, field) => {
    // Make sure there's text to copy
    if (!textToCopy) return; 
    
    try {
      // Use the modern async clipboard API
      await navigator.clipboard.writeText(textToCopy);
      // Set state to show feedback on the correct item
      setCopiedInfo({ id: visitId, field: field });
    } catch (err) {
      console.error('Failed to copy text: ', err);
      // add an error alert here if needed
    }
  };

  return (
    <div className="page-content">
        <FollowUps userId={user?.uid}/>
        
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
            {isLoading ? (
                // If loading, show a few skeleton cards as placeholders
                <>
                    <VisitCardSkeleton />
                    <VisitCardSkeleton />
                    <VisitCardSkeleton />
                </>
            ) : (
            <>
                {filteredVisits.length > 0 ? (
                filteredVisits.map((visit) => (
                    // Each card needs a unique key, we'll use the visit's Firestore ID
                    <div key={visit.id} className="visit-card card">
                        <div className="visit-card-header">
                                <h3>{visit.basicInfo?.patientName || 'Unknown Patient'}</h3>
                                <p>{visit.basicInfo?.age || 'N/A'} years old</p>
                                {visit.basicInfo?.mobile && (
                                <div className="info-with-copy">
                                    <p><strong>Contact:</strong> {visit.basicInfo.mobile}</p>
                                    <button 
                                        className="copy-btn"
                                        title="Copy phone number"
                                        onClick={() => handleCopyToClipboard(visit.basicInfo.mobile, visit.id, 'mobile')}
                                    >
                                        {copiedInfo?.id === visit.id && copiedInfo?.field === 'mobile' ? '✅' : '📋'}
                                    </button>
                                </div>
                                )}

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
                <div>
                    {visits.length > 0 ? (
                        <p>No visits found matching your search.</p>
                    ) : (
                        <p>No visits have been recorded yet.</p>
                    )}
                </div>
            )}
            </>
            )}
        </div>
    </div>
  );
};

export default VisitsLog;
