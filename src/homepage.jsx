import React from 'react';

// A reusable component for displaying and editing a single field.
// It's kept here because it is only used by the HomePage.
const DetailRow = ({ label, value, fieldPath, editingField, onEdit, onSave, onCancel, inputType = 'text' }) => {
  const isEditing = editingField === fieldPath;

  return (
    <div className="detail-item">
      {isEditing ? (
        <form onSubmit={onSave} className="edit-form">
          <input type={inputType} name="editInput" defaultValue={value || ''} autoFocus />
          <button type="submit" style={{padding:"5px 10px",fontSize:"15px"}} className="btn-save-edit">Save</button>
          <button style={{padding:"5px",fontSize:"15px"}} onClick={onCancel} className="btn-cancel-edit">❌</button>
        </form>
      ) : (
        <>
          <p><strong>{label}:</strong> {value || <span className="not-found">Not found</span>}</p>
          <button onClick={() => onEdit(fieldPath)} className="btn-edit">Edit</button>
        </>
      )}
    </div>
  );
};


// The HomePage component receives all necessary state and functions as props from App.jsx
const HomePage = ({
  parsedData,
  recordingStatus,
  transcribedText,
  editingField,
  transcriptBoxRef,
  handleStartOrResume,
  handlePause,
  handleStop,
  handleConfirm,
  handleRetry,
  handleEdit,
  handleSaveEdit,
  handleCancelEdit
}) => {
  return (
    <>
      {parsedData ? (
        <div className="card confirmation-card">
            <h2>Confirm Visit Details</h2>
            
            {/* --- SECTION 1: BASIC INFO --- */}
            <div className="confirmation-section">
                <h3>Basic Information</h3>
                <DetailRow label="Patient Name" value={parsedData.basicInfo.patientName} fieldPath="basicInfo.patientName" {...{ editingField, onEdit: handleEdit, onSave: handleSaveEdit, onCancel: handleCancelEdit }} />
                <DetailRow label="Age" value={parsedData.basicInfo.age} fieldPath="basicInfo.age" inputType="number" {...{ editingField, onEdit: handleEdit, onSave: handleSaveEdit, onCancel: handleCancelEdit }} />
                <DetailRow label="Gender" value={parsedData.basicInfo.gender} fieldPath="basicInfo.gender" {...{ editingField, onEdit: handleEdit, onSave: handleSaveEdit, onCancel: handleCancelEdit }} />
                <DetailRow label="Visit Date" value={parsedData.basicInfo.visitDate} fieldPath="basicInfo.visitDate" inputType="date" {...{ editingField, onEdit: handleEdit, onSave: handleSaveEdit, onCancel: handleCancelEdit }} />
                <DetailRow label="Mobile Number"
                value={parsedData.basicInfo.mobile}
                fieldPath="basicInfo.mobile"
                inputType="tel"
                {...{ editingField, onEdit: handleEdit, onSave: handleSaveEdit, onCancel: handleCancelEdit }}
              />
              <DetailRow label="Address"
                value={parsedData.basicInfo.address}
                fieldPath="basicInfo.address"
                inputType="text"
                {...{ editingField, onEdit: handleEdit, onSave: handleSaveEdit, onCancel: handleCancelEdit }}
              />
            </div>

            {/* --- SECTION 2: MATERNAL HEALTH (Conditional) --- */}
            {parsedData.visitType === 'Maternal' && (
                <div className="confirmation-section">
                <h3>Maternal Health</h3>
                <DetailRow label="Pregnant?" value={parsedData.maternalHealth.isPregnant} fieldPath="maternalHealth.isPregnant" {...{ editingField, onEdit: handleEdit, onSave: handleSaveEdit, onCancel: handleCancelEdit }} />
                <DetailRow label="ANC Visits" value={parsedData.maternalHealth.ancVisits} fieldPath="maternalHealth.ancVisits" inputType="number" {...{ editingField, onEdit: handleEdit, onSave: handleSaveEdit, onCancel: handleCancelEdit }} />
                </div>
            )}

            {/* --- SECTION 2: CHILD HEALTH (Conditional) --- */}
            {parsedData.visitType === 'Child' && (
                <div className="confirmation-section">
                <h3>Child Health</h3>
                <DetailRow label="Weight" value={parsedData.childHealth.weight} fieldPath="childHealth.weight" {...{ editingField, onEdit: handleEdit, onSave: handleSaveEdit, onCancel: handleCancelEdit }} />
                </div>
            )}

            {/* --- SECTION 3: GENERAL HEALTH & TREATMENT --- */}
            <div className="confirmation-section">
                <h3>General Health & Treatment</h3>
                <p><strong>Symptoms:</strong> {parsedData.generalHealth.currentSymptoms.join(', ') || 'None'}</p>
                <p><strong>Medicine Provided:</strong> {parsedData.treatment.medicineProvided.join(', ') || 'None'}</p>
                <p><strong>Referred:</strong> {parsedData.treatment.isReferred || 'No'}</p>
            </div>

            {/* --- FINAL ACTION BUTTONS --- */}
            <div className="button-group-confirm">
                <button onClick={handleRetry} className="btn btn-retry">Record Again</button>
                <button onClick={handleConfirm} className="btn btn-confirm">Confirm & Save</button>
            </div>
        </div>
      ) : (
        <div className="card recording-view">
            <div className="button-group">
                {recordingStatus === 'idle' && (
                <div className="mic-wrapper">
                    <div onClick={handleStartOrResume} className="mic-button">
                    <img src="/mic.png" alt="Microphone icon" />
                    </div>
                    <p className="mic-text">Press to Record</p>
                </div>
                )}
                {recordingStatus === 'recording' && (
                <>
                    <div className="mic-button is-recording">
                    <img src="/mic.png" alt="Recording icon" />
                    </div>
                    <button onClick={handlePause} className="btn btn-pause">Pause</button>
                    <button onClick={handleStop} className="btn btn-stop">Stop & Finish</button>
                </>
                )}
                {recordingStatus === 'paused' && (
                <>
                    <div className="mic-button is-paused">
                    <img src="/mic.png" alt="Paused icon" />
                    </div>
                    <button onClick={handleStartOrResume} className="btn btn-resume">Resume</button>
                    <button onClick={handleStop} className="btn btn-stop">Stop & Finish</button>
                </>
                )}
            </div>
            {recordingStatus !== 'idle' && (
                <div ref={transcriptBoxRef} className="transcript-box">
                <p>{transcribedText}</p>
                </div>
            )}
        </div>
      )}
    </>
  );
};

export default HomePage;

