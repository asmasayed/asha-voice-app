import { useState} from  'react';
import './App.css'
import './HomePage.css';

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
  selectedVisitType,
  handleStartOrResume,
  handlePause,
  handleStop,
  handleConfirm,
  handleRetry,
  handleEdit,
  handleSaveEdit,
  handleCancelEdit,
  handleVisitTypeChange,
  onAddSpace,
  showToast,
  isOnline,
  activeTab,
  handleTabToggle 
}) => {
  const InfoTab = ({ title, content, isActive, onClick }) => (
  <div className={`info-tab ${isActive ? 'active' : ''}`} onClick={onClick}>
    <h3 className="info-tab-title">{title}</h3>
    {isActive && <div className="info-tab-content">{content}</div>}
  </div>
);
  const [selectionToolbar, setSelectionToolbar] = useState({
        visible: false,
        top: 0,
        left: 0,
    });
  const [manualText, setManualText] = useState('');

    const instructions = {
    howTo: (
      <ol>
        <li>Press the microphone button to start recording.</li>
        <li>Speak the patient's details clearly.</li>
        <li>Press "Pause" or "Finish" when done.</li>
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

    // Helper to hide the toolbar
    const hideToolbar = () => {
        setSelectionToolbar({ visible: false, top: 0, left: 0 });
    };

    // This function detects when text is selected and shows the toolbar
    const handleTextSelection = () => {
        // Only allow editing when the mic is paused or idle
        if (recordingStatus === 'listening') {
            hideToolbar();
            return;
        }

        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();

            // Show the toolbar above the selected text or cursor position
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
       <div
              className="selection-toolbar"
              style={{ top: selectionToolbar.top, left: selectionToolbar.left }}
          >
              <button
                  onClick={() => {
                      const selection = window.getSelection();
                      if (selection && selection.rangeCount > 0) {
                          // Get the exact cursor position from the selection
                          const cursorPosition = selection.getRangeAt(0).startOffset;
                          // Call the onAddSpace function passed from App.jsx
                          onAddSpace(cursorPosition);
                      }
                      // Hide the toolbar and clear the selection after use
                      hideToolbar();
                      selection.removeAllRanges();
                  }}
              >
                  Add Space
              </button>
          </div>
      )}
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
                <DetailRow label="LMP Date" value={parsedData.maternalHealth.lmpDate} fieldPath="maternalHealth.lmpDate" {...{ editingField, onEdit: handleEdit, onSave: handleSaveEdit, onCancel: handleCancelEdit }} />
                <DetailRow label="EDD" value={parsedData.maternalHealth.edd} fieldPath="maternalHealth.edd" {...{ editingField, onEdit: handleEdit, onSave: handleSaveEdit, onCancel: handleCancelEdit }} />
                <DetailRow label="Weight" value={parsedData.maternalHealth.weight} fieldPath="maternalHealth.weight" {...{ editingField, onEdit: handleEdit, onSave: handleSaveEdit, onCancel: handleCancelEdit }} />
                <p><strong>High Risk Factors:</strong> {parsedData.maternalHealth.highRiskFactors?.join(', ') || 'None'}</p>
                </div>
            )}

            {/* --- SECTION 2: CHILD HEALTH (Conditional) --- */}
            {parsedData.visitType === 'Child' && (
                <div className="confirmation-section">
                <h3>Child Health</h3>
                <DetailRow label="Child Name" value={parsedData.childHealth.childName} fieldPath="childHealth.childName" {...{ editingField, onEdit: handleEdit, onSave: handleSaveEdit, onCancel: handleCancelEdit }} />
                <DetailRow label="Weight" value={parsedData.childHealth.weight} fieldPath="childHealth.weight" {...{ editingField, onEdit: handleEdit, onSave: handleSaveEdit, onCancel: handleCancelEdit }} />
                <DetailRow label="Malnourished?" value={parsedData.childHealth.isMalnourished} fieldPath="childHealth.isMalnourished" {...{ editingField, onEdit: handleEdit, onSave: handleSaveEdit, onCancel: handleCancelEdit }} />
                <p><strong>Illness Symptoms:</strong> {parsedData.childHealth.illnessSymptoms?.join(', ') || 'None'}</p>
                <DetailRow label="Last Vaccine" value={parsedData.immunization.lastVaccine} fieldPath="immunization.lastVaccine" {...{ editingField, onEdit: handleEdit, onSave: handleSaveEdit, onCancel: handleCancelEdit }} />
                <DetailRow label="Next Vaccine Date" value={parsedData.immunization.nextVaccineDate} fieldPath="immunization.nextVaccineDate" {...{ editingField, onEdit: handleEdit, onSave: handleSaveEdit, onCancel: handleCancelEdit }} />
                </div>
            )}

            {/* --- SECTION 3: GENERAL HEALTH & TREATMENT --- */}
            <div className="confirmation-section">
                <h3>General Health & Treatment</h3>
                <p><strong>Symptoms:</strong> {parsedData.generalHealth.currentSymptoms?.join(', ') || 'None'}</p>
                <p><strong>Chronic Illness:</strong> {parsedData.generalHealth.chronicIllness?.join(', ') || 'None'}</p>
                <DetailRow label="Family Members" value={parsedData.generalHealth.familyMembers} fieldPath="generalHealth.familyMembers" inputType="number" {...{ editingField, onEdit: handleEdit, onSave: handleSaveEdit, onCancel: handleCancelEdit }} />
                <p><strong>Medicine Provided:</strong> {parsedData.treatment.medicineProvided?.join(', ') || 'None'}</p>
                <DetailRow label="Referred" value={parsedData.treatment.isReferred} fieldPath="treatment.isReferred" {...{ editingField, onEdit: handleEdit, onSave: handleSaveEdit, onCancel: handleCancelEdit }} />
                <DetailRow label="Next Follow-up" value={parsedData.treatment.nextFollowUp} fieldPath="treatment.nextFollowUp" {...{ editingField, onEdit: handleEdit, onSave: handleSaveEdit, onCancel: handleCancelEdit }} />
            </div>

            {/* --- SECTION 4: FAMILY PLANNING (Conditional) --- */}
            {(parsedData.visitType === 'Maternal' || parsedData.visitType === 'General') && (
                <div className="confirmation-section">
                <h3>Family Planning</h3>
                <DetailRow label="Contraception Method" value={parsedData.familyPlanning.contraceptionMethod} fieldPath="familyPlanning.contraceptionMethod" {...{ editingField, onEdit: handleEdit, onSave: handleSaveEdit, onCancel: handleCancelEdit }} />
                </div>
            )}

            {/* --- FINAL ACTION BUTTONS --- */}
            <div className="button-group-confirm">
                <button onClick={handleRetry} className="btn btn-retry">Record Again</button>
                <button onClick={() => handleConfirm(parsedData)} className="btn btn-confirm">Confirm & Save</button>
            </div>
        </div>
      ) : (
        // --- MAIN RECORDING & INSTRUCTIONS VIEW ---
        <>
          {/* Card 1: The Main Action Card */}
          <div className="card action-card">
            <h3>Record a New Visit</h3>
            {isOnline ? (
              <>
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
                      <div className="button-group-horizontal">
                        <button onClick={handlePause} className="btn btn-pause">Pause</button>
                        <button onClick={handleStop} className="btn btn-stop">Finish</button>
                      </div>
                    </>
                  )}
                  {recordingStatus === 'paused' && (
                    <>
                      <div className="mic-button is-paused">
                        <img src="/mic.png" alt="Paused icon" />
                      </div>
                      <div className="button-group-horizontal">
                        <button onClick={handleStartOrResume} className="btn btn-resume">Resume</button>
                        <button onClick={handleStop} className="btn btn-stop">Finish</button>
                      </div>
                    </>
                  )}
                </div>
                {recordingStatus !== 'idle' && (
                  <div ref={transcriptBoxRef} className="transcript-box" onMouseUp={handleTextSelection}>
                    {transcribedText ? (
                      <p>{transcribedText}</p>
                    ) : (
                      <p className="placeholder-text">Your recorded text will appear here...</p>
                    )}
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

          {/* Card 2: The Instructions Card */}
          <div className="card instructions-panel">
            <div className="info-tabs-container">
              <InfoTab
                title="How to Record"
                content={instructions.howTo}
                isActive={activeTab === 'howTo'}
                onClick={() => handleTabToggle('howTo')}
              />
              <InfoTab
                title="Sample Input"
                content={instructions.sample}
                isActive={activeTab === 'sample'}
                onClick={() => handleTabToggle('sample')}
              />
              <InfoTab
                title="Offline Mode"
                content={instructions.offline}
                isActive={activeTab === 'offline'}
                onClick={() => handleTabToggle('offline')}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default HomePage;

