import React from 'react';
import './VisitsLog.css'

const VisitCardSkeleton = () => {
  return (
    // The outer div uses the same 'visit-card' and 'card' classes for consistency
    <div className="visit-card card">
      <div className="visit-card-header">
        {/* This div mimics the patient name (h3) */}
        <div className="skeleton skeleton-title"></div>
        {/* This div mimics the patient age (p) */}
        <div className="skeleton skeleton-text skeleton-text-short"></div>
      </div>
      <div className="visit-card-body">
        {/* This div mimics the "Visit Type" and "Phone" lines */}
        <div className="skeleton skeleton-text"></div>
        <div className="skeleton skeleton-text"></div>
      </div>
      {/* We omit the footer with buttons for a cleaner skeleton */}
    </div>
  );
};

export default VisitCardSkeleton;