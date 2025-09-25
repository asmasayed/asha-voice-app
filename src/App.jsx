import { useState, useRef, useEffect } from 'react';
import './App.css'
import parseHindiText from './parseHindiText'
import getNewVisitDataTemplate from './dataTemplate'
import Navbar from './Navbar';
import VisitsLog from './VisitsLog';
import Schemes from './Schemes';  
import HomePage from './homepage';

function App() {
  const [activePage, setActivePage] = useState('home');
  const [transcribedText, setTranscribedText] = useState('');
  const [recordingStatus, setRecordingStatus] = useState('idle');
  const [parsedData, setParsedData] = useState(null);
  const [editingField, setEditingField] = useState(null);

  // Refs
  const recognitionRef = useRef(null);
  const accumulatedTranscriptRef = useRef('');
  const transcriptBoxRef = useRef(null);

  // Auto-scrolling for transcript box
  useEffect(() => {
    if (transcriptBoxRef.current) {
      transcriptBoxRef.current.scrollTop = transcriptBoxRef.current.scrollHeight;
    }
  }, [transcribedText]);

  // --- Handler Functions ---

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
  
  const handlePause = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setRecordingStatus('paused');
      console.log("--- PAUSED --- Transcript so far:", transcribedText);
    }
  };

  const handleStop = () => {
    const finalTranscript = transcribedText;
    if (recordingStatus === 'recording' && recognitionRef.current) {
      recognitionRef.current.stop();
    }
    const data = parseHindiText(finalTranscript);
    console.log("--- STOPPED & PARSED --- Extracted Data:", data);
    setParsedData(data);
    setRecordingStatus('idle');
    accumulatedTranscriptRef.current = '';
  };
  
  const handleConfirm = () => {
    console.log("--- CONFIRMED --- Final data to be saved:", parsedData);
    setParsedData(null);
    setTranscribedText('');
  };

  const handleRetry = () => {
    setParsedData(null);
    setTranscribedText('');
  };

  const handleEdit = (fieldName) => {
    setEditingField(fieldName);
  };

  const handleSaveEdit = (event) => {
    event.preventDefault();
    const updatedValue = event.target.elements.editInput.value;
    const fieldPath = editingField;
    setParsedData(prevData => {
      const newData = JSON.parse(JSON.stringify(prevData));
      const keys = fieldPath.split('.');
      let temp = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        temp = temp[keys[i]];
      }
      temp[keys[keys.length - 1]] = updatedValue;
      return newData;
    });
    setEditingField(null);
  };

  const handleCancelEdit = () => {
    setEditingField(null);
  };

  const handleNavigate = (page) => {
    setActivePage(page);
  };

  // --- Render Logic ---
  return (
    <>
      <div className="container">
        <header>
          <h1>आशा सहायक</h1>
          <p>ASHA Voice Assistant</p>
        </header>
        
        <main className="container">
          {activePage === 'home' && (
            <HomePage
              parsedData={parsedData}
              recordingStatus={recordingStatus}
              transcribedText={transcribedText}
              editingField={editingField}
              transcriptBoxRef={transcriptBoxRef}
              handleStartOrResume={handleStartOrResume}
              handlePause={handlePause}
              handleStop={handleStop}
              handleConfirm={handleConfirm}
              handleRetry={handleRetry}
              handleEdit={handleEdit}
              handleSaveEdit={handleSaveEdit}
              handleCancelEdit={handleCancelEdit}
            />
          )}
          {activePage === 'visits' && <VisitsLog />}
          {activePage === 'schemes' && <Schemes />}
        </main>
      </div>
      
      <Navbar activePage={activePage} onNavigate={handleNavigate} />
    </>
  );
}

export default App;
