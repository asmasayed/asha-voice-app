import './FollowUps.css'
import React, { useState, useEffect } from 'react';
// Import the necessary functions from your firebase config file
import { db } from './firebase'; 
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';


// src/FollowUps.jsx

const formatFollowUpDate = (dateInput) => {
  let followUpDate;

  // NEW: Handle both Firebase Timestamp objects and date strings
  if (typeof dateInput === 'object' && dateInput !== null && typeof dateInput.toDate === 'function') {
    // If it's a Timestamp, convert it directly to a JavaScript Date object
    followUpDate = dateInput.toDate();
  } else if (typeof dateInput === 'string') {
    // If it's a string, parse it. This handles "DD-MM-YYYY" and "YYYY-MM-DD".
    const parts = dateInput.split('-');
    if (parts.length === 3) {
      // Check if the format is DD-MM-YYYY by looking at the length of the last part
      if (parts[2].length === 4) {
        // Rearrange DD-MM-YYYY to YYYY-MM-DD for reliable parsing
        followUpDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      } else {
        // Assume it's already YYYY-MM-DD
        followUpDate = new Date(dateInput);
      }
    }
  }

  // If we couldn't create a valid date, return 'Invalid Date'
  if (!followUpDate || isNaN(followUpDate.getTime())) {
    return 'Invalid Date';
  }

  const today = new Date();
  
  // The rest of the logic remains the same
  followUpDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffTime = followUpDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
  
  const day = String(followUpDate.getDate()).padStart(2, '0');
  const month = String(followUpDate.getMonth() + 1).padStart(2, '0');
  const year = followUpDate.getFullYear();
  return `${day}-${month}-${year}`;
};


const FollowUps = ({ userId }) => {
  // State to hold our follow-up data
  const [followUps, setFollowUps] = useState([]);
  // State to handle the loading screen
  const [loading, setLoading] = useState(true);

  // useEffect hook runs once when the component is first rendered
  useEffect(() => {
    const fetchFollowUps = async () => {
      if (!userId) {
        setLoading(false);
        return; // Don't fetch if we don't have a userId
      }

      try {
        // Get today's date in YYYY-MM-DD format for the query
        const today = new Date().toISOString().split('T')[0];

        // 1. Create a reference to the user's specific 'visits' sub-collection
        const visitsRef = collection(db, 'users', userId, 'visits');

        // 2. Create the query
        const q = query(
          visitsRef,
          where('treatment.nextFollowUp', '>=', today), // Find visits where the follow-up date is today or later
          orderBy('treatment.nextFollowUp'),            // Sort them by the soonest date first
          limit(5)                             // Limit to a maximum of 5 results
        );

        // 3. Execute the query
        const querySnapshot = await getDocs(q);

        // 4. Process the results
        const followUpsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          patientName: doc.data().basicInfo?.patientName || 'Unknown Patient', // Safely access patient name
          followUpDate: doc.data().treatment.nextFollowUp
        }));

         followUpsData.sort((a, b) => {
        // A small helper to convert any of our date formats into a true Date object
        const toDate = (dateInput) => {
          if (typeof dateInput === 'object' && dateInput !== null && typeof dateInput.toDate === 'function') {
            return dateInput.toDate(); // Handles Firebase Timestamps
          }
          if (typeof dateInput === 'string') {
            const parts = dateInput.split('-');
            if (parts.length === 3 && parts[2].length === 4) {
              return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`); // Handles DD-MM-YYYY
            }
            return new Date(dateInput); // Handles YYYY-MM-DD
          }
          return new Date('9999-12-31'); // Fallback for invalid data to sort it last
        };
        
        const dateA = toDate(a.followUpDate);
        const dateB = toDate(b.followUpDate);

        return dateA - dateB; // Subtracting dates sorts them chronologically (earliest first)
      });

        setFollowUps(followUpsData);

      } catch (error) {
        console.error("Error fetching follow-ups: ", error);
      } finally {
        setLoading(false); // Stop loading, whether we succeeded or failed
      }
    };

    fetchFollowUps();
  }, [userId]); // The hook will re-run if the userId prop ever changes

  if (loading) {
    return (
      <div className="follow-ups-container">
        <p>Loading upcoming follow-ups...</p>
      </div>
    );
  }

  return (
    <div className="follow-ups-container">
      <h3>Upcoming Follow-ups</h3>
      {followUps.length > 0 ? (
        <ul className="follow-ups-list">
          {/* We now map over the 'followUps' state which contains live data */}
          {followUps.map(followUp => (
            <li key={followUp.id} className="follow-up-item">
              <span className="patient-name">{followUp.patientName}</span>
              <span className="follow-up-date">{formatFollowUpDate(followUp.followUpDate)}</span>
            </li>
          ))}
        </ul>
      ) : (
        // This message will show if the query returns no upcoming follow-ups
        <p>No upcoming follow-ups scheduled.</p>
      )}
    </div>
  );
};

export default FollowUps;