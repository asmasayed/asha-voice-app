import './FollowUps.css'
import React, { useState, useEffect } from 'react';
// Import the necessary functions from your firebase config file
import { db } from './firebase'; 
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

// Placeholder data to simulate what we'll get from Firestore
const placeholderFollowUps = [
  { id: 1, patientName: 'Priya Sharma', followUpDate: 'Tomorrow' },
  { id: 2, patientName: 'Geeta Singh', followUpDate: 'In 3 days' },
  { id: 3, patientName: 'Meena Kumari', followUpDate: 'In 5 days' },
];

const formatFollowUpDate = (dateString) => {
  // Firestore will give us a date string like "YYYY-MM-DD"
  const followUpDate = new Date(dateString);
  const today = new Date();
  
  // Normalize dates to the beginning of the day for accurate comparison
  followUpDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffTime = followUpDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
  
  // Fallback for dates further than a week away
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
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
          where('followUp.date', '>=', today), // Find visits where the follow-up date is today or later
          orderBy('followUp.date'),            // Sort them by the soonest date first
          limit(5)                             // Limit to a maximum of 5 results
        );

        // 3. Execute the query
        const querySnapshot = await getDocs(q);

        // 4. Process the results
        const followUpsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          patientName: doc.data().patient?.name || 'Unknown Patient', // Safely access patient name
          followUpDate: doc.data().followUp.date
        }));

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
      <h3>🗓️ Upcoming Follow-ups</h3>
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