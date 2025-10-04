import { useState } from 'react';
import './App.css';
import './HomePage.css';

// A reusable component for displaying and editing a single field.
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

// A reusable component for the instruction tabs
const InfoTab = ({ title, content, isActive, onClick }) => (
  <div className={`info-tab ${isActive ? 'active' : ''}`} onClick={onClick}>
    <h3 className="info-tab-title">{title}</h3>
    {isActive && <div className="info-tab-content">{content}</div>}
  </div>
);

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
  handleCancelEdit,
  onAddSpace,
  isOnline,
  activeTab,
  handleTabToggle
}) => {
  const [selectionToolbar, setSelectionToolbar] = useState({ visible: false, top: 0, left: 0 });
  const [manualText, setManualText] = useState('');

  const instructions = {
    howTo: (
      <ol>
        <li>Press the microphone button to start recording.</li>
        <li>Speak the patient's details clearly.</li>
        <li>Press "Pause" or "Stop & Finish" when done.</li>
        <li>Once Paused, you can correct the Text by adding spaces.</li>
        <li>After Recording, Correct any errors on the confirmation screen.</li>
      </ol>
    ),
    sample: (
      <blockquote>
        "रोगी का नाम शीला है, उम्र 40 साल, उनको बुखार और खांसी है। दवाई में पैरासिटामोल दिया है। अगला फॉलो-अप अगले हफ्ते होगा।"
      </blockquote>
    ),
    offline: (
      <p>
        When you are offline, the microphone will be replaced with a text box. Type the visit details and press "Parse Text" to proceed.
      </p>
    )
  };

  const hideToolbar = () => setSelectionToolbar({ visible: false, top: 0, left: 0 });

  const handleTextSelection = () => {
    if (recordingStatus === 'recording') {
      hideToolbar();
      return;
    }
    const selection = window.getSelection();
    if (selection.rangeCount > 0 && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectionToolbar({
        visible: true,
        top: rect.top - 45 + window.scrollY,
        left: rect.left + (rect.width / 2) + window.scrollX,
      });
    } else {
      hideToolbar();
    }
  };

  return (
    <>
      {selectionToolbar.visible && (
        <div className="selection-toolbar" style={{ top: selectionToolbar.top, left: selectionToolbar.left }}>
          <button onClick={() => {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              const cursorPosition = selection.getRangeAt(0).startOffset;
              onAddSpace(cursorPosition);
            }
            hideToolbar();
            selection.removeAllRanges();
          }}>
            Add Space
          </button>
        </div>
      )}

      {parsedData ? (
        <div className="card confirmation-card">
          <h2>Confirm Visit Details</h2>
          <div className="confirmation-section">
            <h3>Basic Information</h3>
            <DetailRow label="Patient Name" value={parsedData.basicInfo.patientName} fieldPath="basicInfo.patientName" {...{ editingField, onEdit: handleEdit, onSave: handleSaveEdit, onCancel: handleCancelEdit }} />
            <DetailRow label="Age" value={parsedData.basicInfo.age} fieldPath="basicInfo.age" inputType="number" {...{ editingField, onEdit: handleEdit, onSave: handleSaveEdit, onCancel: handleCancelEdit }} />
            <DetailRow label="Gender" value={parsedData.basicInfo.gender} fieldPath="basicInfo.gender" {...{ editingField, onEdit: handleEdit, onSave: handleSaveEdit, onCancel: handleCancelEdit }} />
          </div>
          <div className="button-group-confirm">
            <button onClick={handleRetry} className="btn btn-retry">Record Again</button>
            <button onClick={() => handleConfirm(parsedData)} className="btn btn-confirm">Confirm & Save</button>
          </div>
        </div>
      ) : (
        <div className="homepage-container">
          <div className="card action-card">
            <h2 className="card-header">Record a New Visit</h2>
            {isOnline ? (
              <>
                {recordingStatus === 'idle' && (
                  <div className="mic-wrapper">
                    <div onClick={handleStartOrResume} className="mic-button">
                      <img src="/mic.png" alt="Microphone icon" />
                    </div>
                    <p className="mic-text">Press to Record</p>
                  </div>
                )}
                {recordingStatus === 'recording' && (
                  <div className="recording-controls">
                    <div className="mic-button is-recording">
                      <img src="/mic.png" alt="Recording icon" />
                    </div>
                    <div className="button-group">
                      <button onClick={handlePause} className="btn btn-pause">Pause</button>
                      <button onClick={handleStop} className="btn btn-stop">Stop & Finish</button>
                    </div>
                  </div>
                )}
                {recordingStatus === 'paused' && (
                  <div className="recording-controls">
                    <div className="mic-button is-paused">
                      <img src="/mic.png" alt="Paused icon" />
                    </div>
                    <div className="button-group">
                      <button onClick={handleStartOrResume} className="btn btn-resume">Resume</button>
                      <button onClick={handleStop} className="btn btn-stop">Stop & Finish</button>
                    </div>
                  </div>
                )}
                {recordingStatus !== 'idle' && (
                  <div ref={transcriptBoxRef} className="transcript-box" onMouseUp={handleTextSelection}>
                    <p>{transcribedText || "Your recorded text will appear here..."}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="offline-container">
                <h3>📶 You are offline.</h3>
                <p>Please type the visit details below.</p>
                <textarea
                  className="offline-textarea"
                  rows="6"
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="रोगी का नाम है शीला, उम्र 40 साल..."
                ></textarea>
                <button className="btn btn-primary" onClick={() => handleStop(manualText)}>
                  Parse Text
                </button>
              </div>
            )}
          </div>

          <div className="card instructions-card">
            <h2 className="card-header">How to Use This App</h2>
            <div className="info-tabs-container">
              <InfoTab title="How to Record" content={instructions.howTo} isActive={activeTab === 'howTo'} onClick={() => handleTabToggle('howTo')} />
              <InfoTab title="Sample Input" content={instructions.sample} isActive={activeTab === 'sample'} onClick={() => handleTabToggle('sample')} />
              <InfoTab title="Offline Mode" content={instructions.offline} isActive={activeTab === 'offline'} onClick={() => handleTabToggle('offline')} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HomePage;
