import { useState, useRef, useEffect } from 'react';
import './App.css';
import Toast from './Toast';
import LoadingSpinner from './LoadingSpinner';
import parseHindiText from './parseHindiText';
import Navbar from './Navbar';
import VisitsLog from './VisitsLog';
import Schemes from './Schemes';
import HomePage from './homepage';
import AuthPage from './AuthPage';
import { auth, db } from './firebase';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { useOfflineQueue } from './hooks/useOfflineQueue';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, query, onSnapshot, doc, deleteDoc, getDoc } from "firebase/firestore";
import VisitDetailModal from './VisitDetailModal';
import ProfileDropdown from './ProfileDropdown';
import './ProfileDropdown.css'

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [visits, setVisits] = useState([]);
  const [activePage, setActivePage] = useState('home');
  const [transcribedText, setTranscribedText] = useState('');
  const [recordingStatus, setRecordingStatus] = useState('idle');
  const [parsedData, setParsedData] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [selectedVisitType, setSelectedVisitType] = useState('General');
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'success', show: false });
  const [schemeQuery, setSchemeQuery] = useState('');
  const [schemeResult, setSchemeResult] = useState(null);
  const { queue, addVisitToQueue, clearQueue, removeVisitFromQueue } = useOfflineQueue();
  const isOnline = useOnlineStatus();
  const recognitionRef = useRef(null);
  const accumulatedTranscriptRef = useRef('');
  const transcriptBoxRef = useRef(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  

  useEffect(() => {
    let unsubscribeFromVisits = () => {};

    if (!isOnline && auth.currentUser) {
      // If we are offline but Firebase already knows who the user is from a previous session,
      // we can proceed immediately.
      setCurrentUser(auth.currentUser);
      setIsLoading(false);
      // We don't try to fetch visits, as we know we are offline.
      return;
    }

    const unsubscribeFromAuth = onAuthStateChanged(auth, async(user) => {
      setCurrentUser(user);
      if (user) {
        const authUserInfo = {
                uid: user.uid,
                email: user.email,
                photoURL: user.photoURL,
                displayName: user.displayName, 
            };

           const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);

            let customUserInfo = {};
            if (userDocSnap.exists()) {
                customUserInfo = userDocSnap.data();
            }

            setCurrentUser({ ...authUserInfo, ...customUserInfo });


        const visitsQuery = query(collection(db, "users", user.uid, "visits"));
        unsubscribeFromVisits = onSnapshot(visitsQuery, (querySnapshot) => {
          const visitsData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
          setVisits(visitsData);
        });
      } else {
        setCurrentUser(null);
        unsubscribeFromVisits();
        setVisits([]);
      }
      setIsLoading(false);
    });
    return () => {
      unsubscribeFromAuth();
      unsubscribeFromVisits();
    };
  }, [isOnline]);

  useEffect(() => {
  setIsDropdownOpen(false);
  }, []);

  useEffect(()=>{
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        // If the click was outside, close the dropdown.
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      // Remove the event listener when the dropdown is closed or the page changes.
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const setupRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser doesn't support Speech Recognition.");
      return null;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN';
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscriptChunk = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscriptChunk += event.results[i][0].transcript + ' ';
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscriptChunk) {
        accumulatedTranscriptRef.current += finalTranscriptChunk;
      }
      setTranscribedText(accumulatedTranscriptRef.current + interimTranscript);
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
    };
    
    return recognition;
  };

  const handleStartOrResume = () => {
    if (recordingStatus === 'recording') return;

    if (recordingStatus === 'idle') {
      accumulatedTranscriptRef.current = '';
      setTranscribedText('');
    }

    recognitionRef.current = setupRecognition();
    if (recognitionRef.current) {
      recognitionRef.current.start();
      setRecordingStatus('recording');
    }
  };

  const handlePause = () => {
    if (recognitionRef.current && recordingStatus === 'recording') {
      recognitionRef.current.stop();
      setRecordingStatus('paused');
    }
  };

  // --- START: DEFINITIVELY FIXED handleStop FUNCTION ---
  const handleStop = (arg) => {
    if (recognitionRef.current && recordingStatus === 'recording') {
      recognitionRef.current.stop();
    }

    // This is the new, robust logic. It checks if the argument is a string.
    // If it's not (i.e., it's a click event), it uses the voice transcript.
    const finalTranscript = typeof arg === 'string'
      ? arg
      : (accumulatedTranscriptRef.current || '');

    if (finalTranscript.trim() === '') {
      console.log("No text to parse. Resetting.");
      setRecordingStatus('idle');
      setTranscribedText('');
      accumulatedTranscriptRef.current = '';
      return;
    }

    console.log("Final text being sent to parser:", finalTranscript);
    const data = parseHindiText(finalTranscript, selectedVisitType);
    console.log("Parsed data received:", data);

    setParsedData(data);
    setRecordingStatus('idle');
  };
  // --- END: DEFINITIVELY FIXED handleStop FUNCTION ---

  const handleConfirm = (dataToSave) => {
    addVisitToQueue(dataToSave);
    setParsedData(null);
    setTranscribedText('');
    accumulatedTranscriptRef.current = '';
    showToast('Visit saved locally!', 'success');
    setActivePage('visits');
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleRetry = () => {
    setParsedData(null);
    setTranscribedText('');
    accumulatedTranscriptRef.current = '';
    setRecordingStatus('idle');
  };

  const handleEdit = (fieldName) => setEditingField(fieldName);
  const handleCancelEdit = () => setEditingField(null);

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

  const handleVisitTypeChange = (event) => setSelectedVisitType(event.target.value);
  const handleNavigate = (page) => setActivePage(page);
  const handleViewDetails = (visit) => setSelectedVisit(visit);
  const handleCloseModal = () => setSelectedVisit(null);

  const handleDeleteVisit = async (visitIdToDelete) => {
    if (!window.confirm("Are you sure you want to delete this visit record?")) {
      return;
    }
    const isLocalVisit = queue.some(visit => visit.id === visitIdToDelete);
    if (isLocalVisit) {
      try {
        removeVisitFromQueue(visitIdToDelete);
        showToast('Local visit deleted!', 'success');
      } catch (error) {
        showToast('Failed to delete local visit.', 'error');
      }
    } else {
      try {
        const visitDocRef = doc(db, 'users', currentUser.uid, 'visits', visitIdToDelete);
        await deleteDoc(visitDocRef);
        showToast('Visit deleted from cloud!', 'success');
      } catch (error) {
        showToast('Failed to delete visit.', 'error');
      }
    }
  };

  const handleAddSpace = (cursorPosition) => {
    if (typeof cursorPosition !== 'number') return;
    const newTranscript = transcribedText.slice(0, cursorPosition) + ' ' + transcribedText.slice(cursorPosition);
    setTranscribedText(newTranscript);
  };

  const showToast = (message, type = 'success') => setToast({ message, type, show: true });
  const hideToast = () => setToast((prev) => ({ ...prev, show: false }));

  const handleSync = async () => {
    if (queue.length === 0) return;
    showToast(`Syncing ${queue.length} visit(s)...`, 'success');
    try {
      for (const visit of queue) {
        const { isLocal, id, ...visitToSave } = visit;
        await addDoc(collection(db, "users", currentUser.uid, "visits"), {
          ...visitToSave,
          createdAt: serverTimestamp(),
        });
      }
      clearQueue();
      showToast('Sync successful!', 'success');
    } catch (error) {
      console.error("Sync failed:", error);
      showToast('Sync failed.', 'error');
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!currentUser) {
    return <AuthPage />;
  }

  return (
    <>
      <div className="container">
        <header>
          <div className="welcome-header">
        <h2>Welcome, ASHA Worker!</h2>
        <p>Ready to log a new patient visit?</p>
      </div>
          <ProfileDropdown
            user={currentUser}
            onLogout={handleLogout}
            isOpen={isDropdownOpen}
            onToggle={() => setIsDropdownOpen(!isDropdownOpen)}
            dropdownRef={dropdownRef}
          />
        </header>
        {toast.show && (
          <Toast message={toast.message} type={toast.type} onClose={hideToast} />
        )}
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
              showToast={showToast}
              isOnline={isOnline}
            />
          )}
          {activePage === 'visits' && <VisitsLog visits={visits} onViewDetails={handleViewDetails} onDelete={handleDeleteVisit} user={currentUser} handleSync={handleSync} queue={queue} isOnline={isOnline}/>}
          {activePage === 'schemes' && (
            <Schemes 
              schemeQuery={schemeQuery}
              setSchemeQuery={setSchemeQuery}
              schemeResult={schemeResult}
              setSchemeResult={setSchemeResult}
            />
          )}
        </main>
      </div>
      <Navbar activePage={activePage} onNavigate={handleNavigate} />
      <VisitDetailModal visit={selectedVisit} onClose={handleCloseModal} />
    </>
  );
}

export default App;

