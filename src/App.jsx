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
import './HomePage.css'

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
  const [activeTab, setActiveTab] = useState('howTo');
  

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

  const handleTabToggle = (tabName) => {
    // If the clicked tab is already the active one, close it.
    if (activeTab === tabName) {
      setActiveTab(null);
    } else {
      // Otherwise, open the clicked tab.
      setActiveTab(tabName);
    }
  };

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
  const handleStartSchemeSearch = () => {
  if (recordingStatus === 'listening_scheme') return;

  accumulatedTranscriptRef.current = '';
  setSchemeQuery(''); // Clear previous query
  setSchemeResult(null); // Clear previous result

  recognitionRef.current = setupRecognition();
  if (recognitionRef.current) {
    recognitionRef.current.onresult = (event) => {
      // This is a simplified handler for live feedback
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
      }
      setSchemeQuery(transcript);
    };

    recognitionRef.current.onend = () => {
      // Automatically trigger the search when the user stops talking
      handleStopSchemeSearch(schemeQuery); 
    };

    recognitionRef.current.start();
    setRecordingStatus('listening_scheme');
  }
};

const handleStopSchemeSearch = (query) => {
  if (recognitionRef.current) {
    recognitionRef.current.stop();
  }
  setRecordingStatus('idle');

  // Use the final query from state, or the direct argument if available
  const finalQuery = query || schemeQuery;
  if (finalQuery.trim()) {
    const result = findBestSchemeMatch(finalQuery); // Assuming this function is available or imported in App.jsx
    setSchemeResult(result);
  }
};

const findBestSchemeMatch = (query) => {
    if (!query) return null;

    const normalizedQuery = normalizeText(query);
    const queryWords = normalizedQuery.split(/\s+/).filter(word => word.length > 1);

    let bestMatch = null;
    let maxScore = 0;

    // High-priority keyword patterns that should override other matches
    const highPriorityPatterns = [
        { pattern: /आशा.*बीमा.*5.*लाख|आशा.*5.*लाख.*बीमा|आशा.*वर्कर्स.*5.*लाख|आशा.*कर्मियों.*5.*लाख/, schemeId: 'A4', score: 100 },
        { pattern: /आशा.*बीमा.*2.*लाख|आशा.*2.*लाख.*बीमा|आशा.*पेंशन|आशा.*रिटायर|रिटायर.*आशा|पेंशन.*आशा/, schemeId: 'A3', score: 90 },
        { pattern: /टीबी.*5.*लाख|टीबी.*5000|तपेदिक.*5.*लाख/, schemeId: 'D1', score: 80 },
        { pattern: /पीएमएमवीवाई|pmmvy.*5000|5000.*पीएमएमवीवाई|पाँच.*हजार.*रुपए|5000.*रुपए|पाँच.*हजार.*बेनिफिट|5000.*बेनिफिट|माँ.*बनने.*सहायता|माँ.*बनने.*पैसा|मातृत्व.*सहायता|मातृत्व.*पैसा/, schemeId: 'M2', score: 80 },
        { pattern: /जेएसवाई|jsy.*1400|1400.*जेएसवाई|संस्थागत.*प्रसव|डिलीवरी.*पैसा|प्रसव.*सहायता/, schemeId: 'M1', score: 75 },
        // Child malnutrition patterns (HIGHEST PRIORITY - urgent referral needed)
        { pattern: /बच्चा.*कमजोर|शिशु.*कमजोर|बच्चा.*कुपोषित|शिशु.*कुपोषित|बच्चा.*वजन.*कम|शिशु.*वजन.*कम|कमजोर.*बच्चा|कुपोषित.*बच्चा|बच्चा.*वीक|शिशु.*वीक|वीक.*बच्चा|वीक.*शिशु|पोषण.*पुर्नवास|पोषण.*पुनर्वास|एनआरसी|nrc|पोषण.*केंद्र/, schemeId: 'C4', score: 95 },
        // Child health checkup patterns (lower priority - general screening)
        { pattern: /बच्चा.*जांच.*कहाँ|बच्चा.*चेकअप.*कहाँ|शिशु.*जांच.*कहाँ|बच्चे.*की.*जांच/, schemeId: 'C3', score: 85 },
        { pattern: /बच्चा.*दस्त|बच्चा.*डायरिया|शिशु.*दस्त/, schemeId: 'C5', score: 85 },
        { pattern: /बच्चा.*टीका|बच्चा.*वैक्सीन|शिशु.*टीका/, schemeId: 'I1', score: 85 },
        // Newborn care patterns (HBNC - first 42 days)
        { pattern: /जन्म.*बाद.*देखभाल|जन्म.*बाद.*बच्चे|नवजात.*देखभाल|42.*दिन|जन्म.*के.*बाद/, schemeId: 'C1', score: 88 },
        // Family planning sterilization patterns
        { pattern: /दो.*बच्चों.*बाद.*नसबंदी|नसबंदी.*पैसा|स्थायी.*साधन.*पैसा|बंध्याकरण.*पैसा/, schemeId: 'F2', score: 88 },
        // ANC registration timing patterns
        { pattern: /प्रेग्नेंट.*रजिस्ट्रेशन|गर्भवती.*पंजीकरण|रजिस्ट्रेशन.*कब|पंजीकरण.*कब|12.*सप्ताह|3.*महीने.*पंजीकरण/, schemeId: 'M4', score: 88 },
    ];

    // Check high-priority patterns first
    for (const { pattern, schemeId, score } of highPriorityPatterns) {
        if (pattern.test(normalizedQuery)) {
            const matchingScheme = schemeData.find(scheme => scheme.Scheme_ID === schemeId);
            if (matchingScheme) {
                return matchingScheme;
            }
        }
    }

    // Create keyword variations for better matching
    const createKeywordVariations = (word) => {
        const variations = [word];
        
        // Add common Hindi variations
        const hindiVariations = {
            'पैसा': ['रुपया', 'रुपये', 'मनी', 'धन', 'राशि', 'बेनिफिट', 'लाभ', 'सहायता'],
            'मिलता': ['मिलता है', 'मिलती है', 'मिलते हैं', 'दिया जाता', 'दी जाती'],
            'कितना': ['कितनी', 'कितने', 'कितनों', 'कितना पैसा', 'कितनी राशि'],
            'योजना': ['स्कीम', 'प्रोग्राम', 'कार्यक्रम', 'अभियान'],
            'महिला': ['स्त्री', 'औरत', 'नारी', 'महिलाओं'],
            'माँ': ['माता', 'मदर', 'मातृत्व', 'माँ बनना'],
            'बच्चा': ['शिशु', 'बेबी', 'बच्चे', 'बच्चों', 'बालक'],
            'गर्भवती': ['प्रेगनेंट', 'गर्भावस्था', 'गर्भवती महिला'],
            'टीबी': ['तपेदिक', 'क्षय रोग', 'ट्यूबरकुलोसिस'],
            'एचआईवी': ['एड्स', 'एचआईवी एड्स', 'एचआईवी संक्रमण'],
            'मधुमेह': ['डायबिटीज', 'शुगर', 'मधुमेह रोग'],
            'उच्च रक्तचाप': ['हाई ब्लड प्रेशर', 'बीपी', 'रक्तचाप'],
            'एनीमिया': ['खून की कमी', 'रक्ताल्पता', 'हीमोग्लोबिन की कमी'],
            'आशा': ['आशा वर्कर', 'आशा कर्मी', 'आशा सहायिका', 'आशा कार्यकर्ता'],
            'पेंशन': ['रिटायरमेंट', 'रिटायर', 'सेवानिवृत्ति', 'पेंशन स्कीम'],
            'बीमा': ['इंश्योरेंस', 'कवर', 'सुरक्षा', 'बीमा कवर'],
            'लाख': ['500000', '5 लाख', 'पांच लाख', '500,000'],
            '5000': ['पाँच हजार', 'पांच हजार', '5000', 'पाँच हज़ार', 'पांच हज़ार'],
            'जांच': ['चेकअप', 'स्क्रीनिंग', 'टेस्ट', 'परीक्षा', 'मेडिकल चेकअप', 'स्वास्थ्य जांच'],
            'रेफर': ['भेजना', 'ले जाना', 'रिफरल', 'ट्रांसफर'],
            'दवा': ['दवाई', 'गोली', 'मेडिसिन', 'औषधि'],
            'टीका': ['वैक्सीन', 'इंजेक्शन', 'टिकाकरण', 'बूंद'],
            'कमजोर': ['कमजोरी', 'दुर्बल', 'कमजोर बच्चा', 'कमजोर शिशु', 'कुपोषित', 'कुपोषण', 'वजन कम', 'पतला', 'दुबला', 'वीक', 'वीक बच्चा', 'वीक शिशु'],
            'पोषण': ['पोषण पुर्नवास', 'पोषण पुनर्वास', 'पोषण केंद्र', 'एनआरसी', 'NRC', 'पोषण पुनर्वास केंद्र'],
            'कहाँ': ['कहां', 'कहा', 'कहा जाए', 'कहां जाना है'],
            'साल': ['वर्ष', 'उम्र', 'आयु', 'साल का', 'साल की', 'साल के'],
            'जन्म': ['जनम', 'बर्थ', 'डिलीवरी', 'प्रसव'],
            'देखभाल': ['केयर', 'सेवा', 'देखरेख', 'संभाल'],
            'नसबंदी': ['बंध्याकरण', 'स्थायी साधन', 'स्टेरिलाइजेशन'],
            'पोषण': ['न्यूट्रिशन', 'पोषण दिवस', 'पोषण कार्यक्रम'],
            'गांव': ['विलेज', 'ग्राम', 'ग्रामीण'],
            'रजिस्ट्रेशन': ['पंजीकरण', 'रजिस्टर', 'रजिस्ट्रेशन', 'पंजीकरण करना'],
            'सप्ताह': ['वीक', 'सप्ताह', 'हफ्ता', 'हफ्ते']
        };
        
        if (hindiVariations[word]) {
            variations.push(...hindiVariations[word]);
        }
        
        return variations;
    };

    schemeData.forEach(scheme => {
        let currentScore = 0;
        
        // Combine all search fields into one searchable pool
        const searchPool = [
            scheme.Keywords_Vernacular,
            scheme.Scheme_Name_Vernacular,
            scheme.Target_Group,
            scheme.Age_Criteria,
            scheme.Scheme_ID
        ].join(' ').toLowerCase();

        // Score by direct word presence and variations
        queryWords.forEach(qWord => {
            const variations = createKeywordVariations(qWord);
            variations.forEach(variation => {
                if (searchPool.includes(variation.toLowerCase())) {
                    currentScore += 1;
                }
            });
        });
        
        // Score boost for direct IDs/acronyms (e.g., 'JSY', 'PMMVY')
        if (searchPool.includes(normalizedQuery)) {
             currentScore += 5; 
        } else if (normalizedQuery.length > 2 && searchPool.includes(normalizedQuery.substring(0, 3))) {
             currentScore += 3; // Partial acronym match boost
        }

        // Boost score for exact phrase matches
        const exactPhrases = [
            'कितना पैसा मिलता',
            'कितनी राशि मिलती',
            'कैसे करें',
            'कैसे मिलेगा',
            'कहाँ जाना है',
            'कौन सी योजना',
            'कब तक मिलेगा',
            'आशा का बीमा',
            'आशा वर्कर्स का बीमा',
            '5 लाख का बीमा',
            'आशा पेंशन',
            'आशा रिटायर',
            'रिटायर आशा',
            'पेंशन आशा',
            'पाँच हजार रुपए',
            '5000 रुपए',
            'पाँच हजार बेनिफिट',
            '5000 बेनिफिट',
            'बच्चा कमजोर है',
            'शिशु कमजोर है',
            'बच्चा कुपोषित है',
            'शिशु कुपोषित है',
            'बच्चा वीक है',
            'शिशु वीक है',
            'कमजोर बच्चा',
            'कुपोषित बच्चा',
            'वीक बच्चा',
            'बच्चा वजन कम',
            'शिशु वजन कम',
            'पोषण पुर्नवास',
            'पोषण पुनर्वास',
            'एनआरसी',
            'पोषण केंद्र',
            'बच्चा जांच कहाँ',
            'शिशु जांच कहाँ',
            'बच्चे की जांच',
            'बच्चा बीमार है',
            'शिशु बीमार है',
            'जन्म के बाद देखभाल',
            'नवजात देखभाल',
            '42 दिन तक',
            'दो बच्चों के बाद नसबंदी',
            'नसबंदी का पैसा',
            'स्थायी साधन पैसा',
            'गांव में पोषण दिवस',
            'पोषण दिवस गांव',
            'गांव स्वास्थ्य दिवस',
            'माँ बनने पर सहायता',
            'माँ बनने पर पैसा',
            'मातृत्व सहायता',
            'मातृत्व पैसा',
            'सरकारी सहायता माँ',
            'प्रेग्नेंट रजिस्ट्रेशन',
            'गर्भवती पंजीकरण',
            'रजिस्ट्रेशन कब',
            'पंजीकरण कब',
            '12 सप्ताह',
            '3 महीने पंजीकरण'
        ];
        
        exactPhrases.forEach(phrase => {
            if (normalizedQuery.includes(phrase) && searchPool.includes(phrase)) {
                currentScore += 2;
            }
        });

        // Special boost for ASHA-related queries
        if (normalizedQuery.includes('आशा') && searchPool.includes('आशा')) {
            currentScore += 3;
        }

        // Special boost for ASHA pension queries
        if ((normalizedQuery.includes('आशा') && normalizedQuery.includes('पेंशन')) || 
            (normalizedQuery.includes('आशा') && normalizedQuery.includes('रिटायर'))) {
            currentScore += 4;
        }

        // Special boost for PMMVY-related queries (₹5000 benefit)
        if ((normalizedQuery.includes('5000') || normalizedQuery.includes('पाँच हजार') || normalizedQuery.includes('पांच हजार')) && 
            (normalizedQuery.includes('रुपए') || normalizedQuery.includes('बेनिफिट') || normalizedQuery.includes('लाभ'))) {
            currentScore += 4;
        }

        // Special boost for child health checkup queries
        if ((normalizedQuery.includes('बच्चा') || normalizedQuery.includes('शिशु')) && 
            (normalizedQuery.includes('जांच') || normalizedQuery.includes('चेकअप')) &&
            searchPool.includes('जांच')) {
            currentScore += 4;
        }

        // Special boost for malnutrition/weak child queries (HIGHEST PRIORITY)
        if ((normalizedQuery.includes('कमजोर') || normalizedQuery.includes('कुपोषित') || normalizedQuery.includes('वजन कम') || normalizedQuery.includes('वीक') || normalizedQuery.includes('पोषण पुर्नवास') || normalizedQuery.includes('एनआरसी')) && 
            (normalizedQuery.includes('बच्चा') || normalizedQuery.includes('शिशु'))) {
            currentScore += 5; // Higher boost for malnutrition cases
        }

        // Special boost for newborn care queries (HBNC)
        if ((normalizedQuery.includes('जन्म') || normalizedQuery.includes('नवजात')) && 
            (normalizedQuery.includes('देखभाल') || normalizedQuery.includes('42'))) {
            currentScore += 4;
        }

        // Special boost for sterilization queries (F2)
        if ((normalizedQuery.includes('नसबंदी') || normalizedQuery.includes('स्थायी साधन')) && 
            normalizedQuery.includes('पैसा')) {
            currentScore += 4;
        }

        // Special boost for maternal assistance queries (PMMVY gets priority for general queries)
        if ((normalizedQuery.includes('माँ') || normalizedQuery.includes('मातृत्व')) && 
            (normalizedQuery.includes('सहायता') || normalizedQuery.includes('पैसा') || normalizedQuery.includes('बेनिफिट'))) {
            // PMMVY gets higher boost for general motherhood queries
            if (searchPool.includes('5000') || searchPool.includes('पाँच हजार')) {
                currentScore += 5; // Higher boost for PMMVY
            } else {
                currentScore += 3; // Lower boost for JSY
            }
        }

        // Special boost for registration timing queries (ANC M4)
        if ((normalizedQuery.includes('रजिस्ट्रेशन') || normalizedQuery.includes('पंजीकरण')) && 
            (normalizedQuery.includes('कब') || normalizedQuery.includes('12') || normalizedQuery.includes('3 महीने'))) {
            currentScore += 4;
        }

        if (currentScore > maxScore) {
            maxScore = currentScore;
            bestMatch = scheme;
        }
    });

    // Require at least 1 matching keyword for a confident answer
    return maxScore >= 1 ? bestMatch : null;
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
      {/* 1. The header is now a top-level, full-width element, outside the container. */}
      <header className="app-header">
        {/* --- Left side with Logo and Title --- */}
        <div className="header-left">
          <img src="/logo.jpg" alt="ASHA Voice Assistant Logo" className="header-logo" />
          <div className="header-title-group">
            <h1 className="app-name">ASHA Voice Assistant</h1>
            <p className="welcome-message">
              Welcome, {currentUser?.displayName || 'User'}!
            </p>
          </div>
        </div>

        {/* --- Right side with Profile Dropdown --- */}
        <ProfileDropdown
          user={currentUser}
          onLogout={handleLogout}
          isOpen={isDropdownOpen}
          onToggle={() => setIsDropdownOpen(!isDropdownOpen)}
          dropdownRef={dropdownRef}
        />
      </header>

      {/* 2. The container now ONLY wraps the main page content. */}
      {/* This div is what provides the centering and side margins. */}
      <div className="container">
        <main>
          {toast.show && (
            <Toast message={toast.message} type={toast.type} onClose={hideToast} />
          )}
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
              activeTab={activeTab}
              handleTabToggle={handleTabToggle}
            />
          )}
          {activePage === 'visits' && <VisitsLog visits={visits} onViewDetails={handleViewDetails} onDelete={handleDeleteVisit} user={currentUser} handleSync={handleSync} queue={queue} isOnline={isOnline}/>}
          {activePage === 'schemes' && (
            <Schemes 
              schemeQuery={schemeQuery}
              setSchemeQuery={setSchemeQuery}
              schemeResult={schemeResult}
              setSchemeResult={setSchemeResult}
              recognitionRef={recognitionRef}
              accumulatedTranscriptRef={accumulatedTranscriptRef}
              recordingStatus={recordingStatus}
              setRecordingStatus={setRecordingStatus}
              isOnline={isOnline}
              handleStartSchemeSearch={handleStartSchemeSearch}
              handleStopSchemeSearch={handleStopSchemeSearch}
            />
          )}
        </main>
      </div>

      {/* The Navbar and Modal remain at the bottom, outside the main container. */}
      <Navbar activePage={activePage} onNavigate={handleNavigate} />
      <VisitDetailModal visit={selectedVisit} onClose={handleCloseModal} />
    </>
  );
}

export default App;

