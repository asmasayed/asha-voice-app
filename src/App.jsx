import { useState, useRef, useEffect } from 'react';
import './App.css';

// --- UPDATED IMPORTS (REMOVED .jsx/.js extensions) ---
// Some build tools prefer imports without file extensions.
import parseHindiText from './parseHindiText';
import Navbar from './Navbar';
import VisitsLog from './VisitsLog';
import Schemes from './Schemes';
import HomePage from './homepage';
import AuthPage from './AuthPage';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, query, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import VisitDetailModal from './VisitDetailModal';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [visits, setVisits] = useState([]);

  // --- All other state remains the same ---
  const [activePage, setActivePage] = useState('home');
  const [transcribedText, setTranscribedText] = useState('');
  const [recordingStatus, setRecordingStatus] = useState('idle');
  const [parsedData, setParsedData] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [selectedVisitType, setSelectedVisitType] = useState('General');
  const recognitionRef = useRef(null);
  const accumulatedTranscriptRef = useRef('');
  const transcriptBoxRef = useRef(null);
  const lastProcessedIndexRef = useRef(0);
  const [selectedVisit, setSelectedVisit] = useState(null);

  // This single hook handles both checking the user's login status
  // and fetching their data in the correct order.
  useEffect(() => {
    // This variable will hold the function to unsubscribe from the visits listener
    let unsubscribeFromVisits = () => {};

    // First, set up the listener for authentication changes
    const unsubscribeFromAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user); // Set the current user (or null if logged out)

      if (user) {
        // --- IF A USER IS LOGGED IN ---
        // 1. Create a query to get their specific visits collection
        const visitsQuery = query(collection(db, "users", user.uid, "visits"));
        
        // 2. Set up the real-time listener for their visits
        unsubscribeFromVisits = onSnapshot(visitsQuery, (querySnapshot) => {
          const visitsData = [];
          querySnapshot.forEach((doc) => {
            visitsData.push({ ...doc.data(), id: doc.id });
          });
          setVisits(visitsData); // Update the state with the new data
        });

      } else {
        // --- IF NO USER IS LOGGED IN ---
        setVisits([]); // Ensure the visits list is empty
      }

      // Finally, set loading to false. This happens after the auth check is complete.
      setIsLoading(false);
    });

    // This is the main cleanup function for the hook.
    // It will be called when the component is unmounted.
    return () => {
      unsubscribeFromAuth(); // Unsubscribe from the authentication listener
      unsubscribeFromVisits(); // Unsubscribe from the visits listener
    };
  }, []); // The empty array [] ensures this effect runs only once when the app starts.
  

  const handleConfirm = async () => {
    if (!currentUser) {
      console.error("No user logged in to save visit.");
      return;
    }
    try {
      const visitsCollectionRef = collection(db, "users", currentUser.uid, "visits");
      await addDoc(visitsCollectionRef, {
        ...parsedData,
        createdAt: serverTimestamp(),
        userId: currentUser.uid
      });
      setParsedData(null);
      setTranscribedText('');
      setActivePage('visits');
    } catch (error) {
      console.error("Error saving visit to Firestore:", error);
    }
  };
  
  // --- All other handler functions and render logic below this line are unchanged ---

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleStartOrResume = () => {
    // Always preserve the current transcribed text
    accumulatedTranscriptRef.current = transcribedText;
    // Reset the processed index for new session
    lastProcessedIndexRef.current = 0;
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
      let newFinalText = '';
      
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          // Only process results we haven't seen before
          if (i >= lastProcessedIndexRef.current) {
            newFinalText += event.results[i][0].transcript;
            lastProcessedIndexRef.current = i + 1;
          }
        } else {
          // Interim result - show as temporary
          interimTranscript += event.results[i][0].transcript;
        }
      }
      
      // Add new final text to accumulated text
      if (newFinalText) {
        accumulatedTranscriptRef.current += newFinalText;
      }
      
      setTranscribedText(accumulatedTranscriptRef.current + interimTranscript);
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      // On error, preserve accumulated text and try to restart
      if (event.error === 'no-speech' || event.error === 'audio-capture') {
        // These errors are common and we should try to restart
        setTimeout(() => {
          if (recordingStatus === 'recording') {
            try {
              recognition.start();
            } catch (e) {
              console.log('Recognition restart failed:', e);
            }
          }
        }, 1000);
      }
    };
    
    recognition.onend = () => {
      // When recognition ends naturally, preserve the accumulated text
      if (recordingStatus === 'recording') {
        // Try to restart recognition automatically
        setTimeout(() => {
          if (recordingStatus === 'recording') {
            try {
              recognition.start();
            } catch (e) {
              console.log('Auto-restart failed:', e);
            }
          }
        }, 100);
      }
    };
    
    recognition.start();
    setRecordingStatus('recording');
  };

  const handlePause = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setRecordingStatus('paused');
    }
    // Don't modify accumulated text on pause - it's already preserved
  };

  const handleStop = () => {
    // Ensure we have the most up-to-date accumulated text
    const finalTranscript = accumulatedTranscriptRef.current || transcribedText;
    if (recordingStatus === 'recording' && recognitionRef.current) {
      recognitionRef.current.stop();
    }
    const data = parseHindiText(finalTranscript, selectedVisitType);
    setParsedData(data);
    setRecordingStatus('idle');
    // Don't clear accumulated text here - let it persist for potential retry
  };

  const handleRetry = () => {
    setParsedData(null);
    setTranscribedText('');
    accumulatedTranscriptRef.current = '';
    lastProcessedIndexRef.current = 0;
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

  const handleVisitTypeChange = (event) => {
    setSelectedVisitType(event.target.value);
  };

  const handleNavigate = (page) => {
    setActivePage(page);
  };

  const handleViewDetails = (visit) => {
  console.log("Viewing details for visit:", visit);
  setSelectedVisit(visit);
  };  

  const handleCloseModal = () => {
    setSelectedVisit(null);
  };

  const handleDeleteVisit = async (visitIdToDelete) => {
    // Use a simple confirmation dialog before deleting
    if (!window.confirm("Are you sure you want to delete this visit record? This action cannot be undone.")) {
      return; // If the user clicks "Cancel", stop the function
    }

    try {
      // Create a reference to the specific document to be deleted
      // The path must match exactly: users/{userId}/visits/{visitId}
      const visitDocRef = doc(db, 'users', currentUser.uid, 'visits', visitIdToDelete);

      // Delete the document from Firestore
      await deleteDoc(visitDocRef);

      // Update the local state to remove the visit from the UI instantly
      setVisits(currentVisits => currentVisits.filter(visit => visit.id !== visitIdToDelete));
      
      console.log("Visit deleted successfully!");

    } catch (error) {
      console.error("Error deleting visit: ", error);
      alert("There was an error deleting the visit. Please try again.");
    }
  };  

  const handleAddSpace = (cursorPosition) => {
    // We receive cursorPosition as an argument, so we don't declare it again.
    
    if (typeof cursorPosition !== 'number') return;

    const newTranscript = 
        transcribedText.slice(0, cursorPosition) +
        ' ' +
        transcribedText.slice(cursorPosition);
    
    // Update the state with the corrected text
    setTranscribedText(newTranscript);
};

  if (isLoading) {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: '50px' }}>
        <p>Loading Application...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthPage />;
  }

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
              selectedVisitType={selectedVisitType}
              handleStartOrResume={handleStartOrResume}
              handlePause={handlePause}
              handleStop={handleStop}
              handleConfirm={handleConfirm}
              handleRetry={handleRetry}
              handleEdit={handleEdit}
              handleSaveEdit={handleSaveEdit}
              handleCancelEdit={handleCancelEdit}
              handleVisitTypeChange={handleVisitTypeChange}
              onAddSpace={handleAddSpace}
            />
          )}
          {activePage === 'visits' && <VisitsLog visits={visits} onViewDetails={handleViewDetails} onDelete={handleDeleteVisit} user={currentUser}/>}
          {activePage === 'schemes' && <Schemes />}
        </main>
      </div>
      <Navbar activePage={activePage} onNavigate={handleNavigate} />
      {/* --- Render the Modal if a visit is selected --- */}
      <VisitDetailModal visit={selectedVisit} onClose={handleCloseModal} />

    </>
  );
}

export default App;

