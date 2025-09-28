import React from 'react';
import './VisitDetailModal.css'

// A helper component to render each detail row, avoiding repetition.
const DetailRow = ({ label, value }) => {
  // null Otherwise, convert the value to a string (handles numbers, booleans, etc.).
  const displayValue = (value === null || value === '' || value === undefined) 
    ? '-' 
    : String(value);

  // We won't render rows for objects, as they are handled by their own sections.
  if (typeof value === 'object' && value !== null) return null;

  return (
    <div className="detail-row">
      <strong>{label}:</strong>
      <span>{displayValue}</span>
    </div>
  );
};
const DetailSection = ({ title, data }) => {
  // First, get all the keys from the data object (e.g., 'name', 'age').
  const entries = Object.entries(data);

  // If there are no entries, don't render the section at all.
  if (entries.length === 0) {
    return null;
  }

  // A helper function to make keys like 'guardianName' look like 'Guardian Name'
  const formatLabel = (key) => {
    const result = key.replace(/([A-Z])/g, ' $1');
    return result.charAt(0).toUpperCase() + result.slice(1);
  };

  return (
    <div className="detail-section">
      <h3>{title}</h3>
      {entries.map(([key, value]) => {
        // We'll skip rendering certain internal keys we don't need to show.
        if (['id', 'userId', 'createdAt'].includes(key)) return null;

        // Render a row for every single key-value pair.
        return <DetailRow key={key} label={formatLabel(key)} value={value} />;
      })}
    </div>
  );
};


// The main modal component
const VisitDetailModal = ({ visit, onClose }) => {
  // If no visit is selected, don't render anything.
  if (!visit) return null;

  // Destructure data for easier access, with fallbacks for safety.
  const {
  visitType = visit.visitType || 'General',
  basicInfo = visit.basicInfo || visit,
  maternalHealth = visit.maternalHealth || visit,
  childHealth = visit.childHealth || visit,
  symptoms = visit.symptoms || visit,
  vitals = visit.vitals || visit,
  medicines = visit.medicines || visit,
  followUp = visit.followUp || visit,
} = visit;

  return (
    // The modal-overlay is the dark background that covers the page.
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Visit Details</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
            {/* Show visit type */}
            <div className="detail-section">
                <h3>Visit Information</h3>
                <DetailRow label="Visit Type" value={visitType} />
            </div>
            
            {/* Basic Information - Always show */}
            <DetailSection title="Basic Information" data={basicInfo} />
            
            {/* Conditional sections based on visit type */}
            {visitType === 'Maternal' && (
                <>
                    <DetailSection title="Maternal Health" data={maternalHealth} />
                    <DetailSection title="Family Planning" data={visit.familyPlanning || {}} />
                </>
            )}
            
            {visitType === 'Child' && (
                <>
                    <DetailSection title="Child Health" data={childHealth} />
                    <DetailSection title="Immunization" data={visit.immunization || {}} />
                </>
            )}
            
            {/* General Health - Show for all visit types */}
            <DetailSection title="General Health" data={visit.generalHealth || {}} />
            
            {/* Treatment - Always show */}
            <DetailSection title="Treatment" data={visit.treatment || {}} />
            </div>
      </div>
    </div>
  );
};

export default VisitDetailModal;