import './FollowUps.css'
import React, { useState, useEffect } from 'react';
import { db } from './firebase'; 
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

// This function now assumes a clean "YYYY-MM-DD" input format and has the typo fixed.
const formatFollowUpDate = (dateString) => {
    if (!dateString || typeof dateString !== 'string') {
        return 'Invalid Date';
    }

    // This works directly with the "YYYY-MM-DD" format from our database
    const followUpDate = new Date(dateString);

    // This is the line with the corrected typo.
    if (isNaN(followUpDate.getTime())) {
        return 'Invalid Date';
    }

    const today = new Date();
    followUpDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffTime = followUpDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
    
    // Display in DD-MM-YYYY format as you requested
    const parts = dateString.split('-');
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
};


const FollowUps = ({ userId }) => {
    const [followUps, setFollowUps] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFollowUps = async () => {
            if (!userId) {
                setLoading(false);
                return;
            }
            try {
                const today = new Date().toISOString().split('T')[0];
                const visitsRef = collection(db, 'users', userId, 'visits');

                // This query now works perfectly and sorts correctly because all dates are stored as YYYY-MM-DD
                const q = query(
                    visitsRef,
                    where('treatment.nextFollowUp', '>=', today),
                    orderBy('treatment.nextFollowUp'),
                    limit(5)
                );

                const querySnapshot = await getDocs(q);

                const followUpsData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    patientName: doc.data().basicInfo?.patientName || 'Unknown Patient',
                    followUpDate: doc.data().treatment.nextFollowUp
                }));
                
                // Because the database now sorts for us reliably, the extra client-side sort is no longer needed!
                setFollowUps(followUpsData);

            } catch (error) {
                console.error("Error fetching follow-ups: ", error);
            } finally {
                setLoading(false);
            }
        };
        fetchFollowUps();
    }, [userId]);

    if (loading) {
        return <div className="follow-ups-container"><p>Loading upcoming follow-ups...</p></div>;
    }

    return (
        <div className="follow-ups-container">
            <h3>Upcoming Follow-ups</h3>
            {followUps.length > 0 ? (
                <ul className="follow-ups-list">
                    {followUps.map(followUp => (
                        <li key={followUp.id} className="follow-up-item">
                            <span className="patient-name">{followUp.patientName}</span>
                            <span className="follow-up-date">{formatFollowUpDate(followUp.followUpDate)}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No upcoming follow-ups scheduled.</p>
            )}
        </div>
    );
};

export default FollowUps;

