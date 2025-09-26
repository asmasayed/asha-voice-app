import { useState, useRef, useEffect } from 'react';
import './App.css';

// --- UPDATED IMPORTS WITH FILE EXTENSIONS ---
import parseHindiText from './parseHindiText.jsx';
import Navbar from './Navbar.jsx';
import VisitsLog from './VisitsLog.jsx';
import Schemes from './Schemes.jsx';
import HomePage from './homepage.jsx';
import AuthPage from './AuthPage.jsx';
import { auth } from './firebase.js';
import { onAuthStateChanged, signOut } from 'firebase/auth';

function App() {
  // State for Authentication
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // State for Application Logic
  const [activePage, setActivePage] = useState('home');
  const [transcribedText, setTranscribedText] = useState('');
  const [recordingStatus, setRecordingStatus] = useState('idle');
  const [parsedData, setParsedData] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [visits, setVisits] = useState([]);

  // Refs
  const recognitionRef = useRef(null);
  const accumulatedTranscriptRef = useRef('');
  const transcriptBoxRef = useRef(null);

  // --- THIS IS THE CRITICAL AUTHENTICATION LISTENER ---
  // This hook now includes console logs so we can see it work.
  useEffect(() => {
    console.log("Setting up Firebase auth listener...");
    
    // onAuthStateChanged returns an "unsubscribe" function.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // This code will run whenever a user logs in or logs out.
      console.log("Firebase Auth state changed! Current user is:", user ? user.email : 'null');
      
      setCurrentUser(user); // Update the state with the user object or null
      setIsLoading(false); // We're done checking, so stop showing the loading screen
    });

    // This is the cleanup function. It runs when the component is removed.
    return () => {
      console.log("Cleaning up Firebase auth listener.");
      unsubscribe();
    };
  }, []); // The empty array [] means this effect runs only ONCE when the app starts.

  // Effect for auto-scrolling the transcript box
  useEffect(() => {
    if (transcriptBoxRef.current) {
      transcriptBoxRef.current.scrollTop = transcriptBoxRef.current.scrollHeight;
    }
  }, [transcribedText]);

  // --- Handler Functions ---

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // The listener above will automatically set currentUser to null, showing the login page.
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };
  
  // All your other handler functions (handleStartOrResume, handleConfirm, etc.)
  // do not need any changes. They are copied below as-is.

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
    }
  };

  const handleStop = () => {
    const finalTranscript = transcribedText;
    if (recordingStatus === 'recording' && recognitionRef.current) {
      recognitionRef.current.stop();
    }
    const data = parseHindiText(finalTranscript);
    setParsedData(data);
    setRecordingStatus('idle');
    accumulatedTranscriptRef.current = '';
  };

  const handleConfirm = () => {
    setVisits(prevVisits => [...prevVisits, parsedData]);
    setParsedData(null);
    setTranscribedText('');
    setActivePage('visits');
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

  if (isLoading) {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: '50px' }}>
        <p>Loading Application...</p>
      </div>
    );
  }

  // If the listener has run and confirmed there is no user, show the AuthPage
  if (!currentUser) {
    return <AuthPage />;
  }

  // Otherwise, if there IS a user, show the main application
  return (
    <>
      <div className="container">
        <header>
          <h1>आशा सहायक</h1>
          <p>ASHA Voice Assistant</p>
          <button onClick={handleLogout} className="btn btn-retry" style={{maxWidth: '150px', margin: '10px auto'}}>Log Out</button>
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
          {activePage === 'visits' && <VisitsLog visits={visits} />}
          {activePage === 'schemes' && <Schemes />}
        </main>
      </div>
      <Navbar activePage={activePage} onNavigate={handleNavigate} />
    </>
  );
}

export default App;

