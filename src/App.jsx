import { useState, useRef, useEffect } from 'react';
import './App.css'
import parseHindiText from './parseHindiText'

// In App.jsx, add this entire component above `function App() { ... }`

// A reusable component for displaying and editing a single field.
const DetailRow = ({ label, value, fieldPath, editingField, onEdit, onSave, onCancel, inputType = 'text' }) => {
  const isEditing = editingField === fieldPath;

  return (
    <div className="detail-item">
      {isEditing ? (
        <form onSubmit={onSave} className="edit-form">
          <input type={inputType} name="editInput" defaultValue={value || ''} autoFocus />
          <button type="submit" className="btn-save-edit">Save</button>
          <button style={{ padding: "0px",fontSize:"18px" }} onClick={onCancel} className="btn-cancel-edit">❌</button>
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

function App() {
  const [transcribedText, setTranscribedText] = useState('');
  const [recordingStatus, setRecordingStatus] = useState('idle');
  const [parsedData, setParsedData] = useState(null);
  const [editingField, setEditingField] = useState(null);

  // useRef is used to hold a persistent reference to the SpeechRecognition object
  // across re-renders, without causing them.
  const recognitionRef = useRef(null);
  
  // This ref helps preserve the transcript during pause/resume cycles.
  const accumulatedTranscriptRef = useRef('');

  const transcriptBoxRef = useRef(null);

  useEffect(() => {
    if (transcriptBoxRef.current) {
      transcriptBoxRef.current.scrollTop = transcriptBoxRef.current.scrollHeight;
    }
  }, [transcribedText]);

  // Handles starting a new recording or resuming a paused one.
  const handleStartOrResume = () => {
    accumulatedTranscriptRef.current = transcribedText;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser doesn't support Speech Recognition. Please use Chrome.");
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;
    
    recognition.lang = 'hi-IN';
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        interimTranscript += event.results[i][0].transcript;
      }
      setTranscribedText(accumulatedTranscriptRef.current + interimTranscript);
    };

    recognition.onerror = (event) => console.error('Speech recognition error:', event.error);
    
    recognition.start();
    setRecordingStatus('recording');
  };
  
  // Pauses the recording.
  const handlePause = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setRecordingStatus('paused');

      console.log("--- PAUSED ---");
      console.log("Transcript so far:", transcribedText);
    }
  };

  // Stops the recording completely and processes the final text.
  const handleStop = () => {
    const finalTranscript = transcribedText;

    if (recordingStatus === 'recording' && recognitionRef.current) {
      recognitionRef.current.stop();
    }

    // Now, regardless of the previous state, parse the text we captured.
    const data = parseHindiText(finalTranscript);
    
    console.log("--- STOPPED & PARSED ---");
    console.log("Extracted Data:", data);
    
    setParsedData(data); // Show the confirmation card.
    setRecordingStatus('idle');
    accumulatedTranscriptRef.current = ''; // Clear the ref for the next session.
  };
  
  // Handles the confirmation of the parsed data.
  const handleConfirm = () => {
    console.log("--- CONFIRMED ---");
    console.log("Final data to be saved:", parsedData);
    setParsedData(null);
    setTranscribedText('');
  };

  // Handles retrying the recording.
  const handleRetry = () => {
    setParsedData(null);
    setTranscribedText('');
  };

  // 1. When the user clicks an "Edit" button
  const handleEdit = (fieldName) => {
    setEditingField(fieldName); // Set the field to be edited (e.g., 'name')
  };

  // 2. When the user saves the change from an input field
  const handleSaveEdit = (event) => {
    event.preventDefault();
    const updatedValue = event.target.elements.editInput.value;
    const fieldPath = editingField; // e.g., "basicInfo.patientName"

    setParsedData(prevData => {
      const newData = JSON.parse(JSON.stringify(prevData)); // Deep copy to avoid mutation
      const keys = fieldPath.split('.'); // ['basicInfo', 'patientName']
      
      let temp = newData;
      // Navigate down the object path
      for (let i = 0; i < keys.length - 1; i++) {
        temp = temp[keys[i]];
      }
      // Set the value on the final key
      temp[keys[keys.length - 1]] = updatedValue;
      
      return newData;
    });

    setEditingField(null); // Exit editing mode
  };

  // 3. When the user cancels an edit
  const handleCancelEdit = () => {
    setEditingField(null); // Exit editing mode without saving
  };

  return (
    <>
      <div className="container">
        <header>
          <h1>आशा सहायक</h1>
          <p>ASHA Voice Assistant</p>
        </header>
        
        <main>
          {parsedData ? (
            <div className="card confirmation-card">
              <h2>Confirm Visit Details</h2>
              
              {/* --- SECTION 1: BASIC INFO (Always shows) --- */}
              <div className="confirmation-section">
                <h3>Basic Information</h3>
                <DetailRow label="Patient Name" value={parsedData.basicInfo.patientName} fieldPath="basicInfo.patientName" {...{ editingField, onEdit: handleEdit, onSave: handleSaveEdit, onCancel: handleCancelEdit }} />
                <DetailRow label="Age" value={parsedData.basicInfo.age} fieldPath="basicInfo.age" inputType="number" {...{ editingField, onEdit: handleEdit, onSave: handleSaveEdit, onCancel: handleCancelEdit }} />
                <DetailRow label="Gender" value={parsedData.basicInfo.gender} fieldPath="basicInfo.gender" {...{ editingField, onEdit: handleEdit, onSave: handleSaveEdit, onCancel: handleCancelEdit }} />
                <DetailRow label="Visit Date" value={parsedData.basicInfo.visitDate} fieldPath="basicInfo.visitDate" inputType="date" {...{ editingField, onEdit: handleEdit, onSave: handleSaveEdit, onCancel: handleCancelEdit }} />
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
                  <DetailRow label="Child's Name" value={parsedData.childHealth.childName} fieldPath="childHealth.childName" {...{ editingField, onEdit: handleEdit, onSave: handleSaveEdit, onCancel: handleCancelEdit }} />
                  <DetailRow label="Weight" value={parsedData.childHealth.weight} fieldPath="childHealth.weight" {...{ editingField, onEdit: handleEdit, onSave: handleSaveEdit, onCancel: handleCancelEdit }} />
                </div>
              )}

              {/* --- SECTION 3: GENERAL HEALTH & TREATMENT (Always shows) --- */}
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
              {/* When Idle: Show a large, clickable mic button */}
              {recordingStatus === 'idle' && (
                <div className="mic-wrapper">
                  <div onClick={handleStartOrResume} className="mic-button">
                    <img src="/mic.png" alt="Microphone icon" />
                  </div>
                  <p className="mic-text">Press to Record</p>
                </div>
              )}

              {/* When Recording: Show the pulsing mic and the Pause/Stop buttons */}
              {recordingStatus === 'recording' && (
                <>
                  <div className="mic-button is-recording">
                    <img src="/mic.png" alt="Recording icon" />
                  </div>
                  <button onClick={handlePause} className="btn btn-pause">Pause</button>
                  <button onClick={handleStop} className="btn btn-stop">Stop & Finish</button>
                </>
              )}

              {/* When Paused: Show the static mic and the Resume/Stop buttons */}
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
        </main>
      </div>
    </>
  );
}

export default App;

