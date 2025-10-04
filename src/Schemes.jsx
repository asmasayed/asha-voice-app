// src/Schemes.jsx

import React from 'react';
import schemeData from './schemes.json'; // 🚨 Imports your 30-entry database
import './Schemes.css'; // Import the beautiful CSS styles

// === 1. OFFLINE NLU LOGIC (Keyword Scoring Engine) ===

const normalizeText = (text) => {
    if (!text) return '';
    return text.toLowerCase()
               .replace(/[^\w\s\u0900-\u097F]/g, '') // Remove punctuation but keep Hindi/Devanagari
               .replace(/है|हैं|और|की|का|के|में|को|पर|एक|होता|होती|हैं|क्या|कब|कितना|चाहिए|क्यों|से/g, '') // Remove filler words
               .trim();
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

// === 2. SCHEMES COMPONENT (UI and Voice Control) ===

const Schemes = ({
    schemeQuery,
    setSchemeQuery,
    schemeResult,
    setSchemeResult,
    recognitionRef,
    accumulatedTranscriptRef,
    recordingStatus,
    setRecordingStatus,
    isOnline
}) => {
    
    // Status flag specifically for scheme listening
    const isListening = recordingStatus === 'listening_scheme'; 

    const handleStartSchemeSearch = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        recognitionRef.current = new SpeechRecognition();
        const recognition = recognitionRef.current;
        
        setSchemeResult(null); 
        setSchemeQuery('');
        accumulatedTranscriptRef.current = '';

        recognition.lang = 'hi-IN';
        recognition.interimResults = true;
        recognition.continuous = false; // Set to false so it stops after a pause in speech

        recognition.onstart = () => {
            setRecordingStatus('listening_scheme');
        };

        recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }
            
            setSchemeQuery(accumulatedTranscriptRef.current + interimTranscript);
            
            if (finalTranscript) {
                accumulatedTranscriptRef.current += finalTranscript;
            }
        };

        recognition.onerror = (event) => {
            console.error('Scheme Recognition Error:', event.error);
            setRecordingStatus('idle');
        };
        
        recognition.onend = () => {
            // Trigger the search logic when recognition ends
            if (isListening) {
                handleStopSearch();
            }
        };

        recognition.start();
    };

    const handleStopSearch = () => {
        if (recognitionRef.current) {
            window.speechSynthesis.cancel(); 
            recognitionRef.current.stop(); 
        }
        
        const finalTranscript = accumulatedTranscriptRef.current.trim();
        setRecordingStatus('idle');
        setSchemeQuery(finalTranscript);

        if (finalTranscript.length > 0) {
            const match = findBestSchemeMatch(finalTranscript); // Perform offline NLU search
            setSchemeResult(match);

            // Text-to-Speech (TTS) for the answer
            if (match && 'speechSynthesis' in window) {
                const answer = match.Summary_Answer_Vernacular;
                const utterance = new SpeechSynthesisUtterance(answer);
                utterance.lang = 'hi-IN'; // Ensure Hindi pronunciation
                window.speechSynthesis.speak(utterance);
            }
        } else {
            setSchemeResult(null);
        }
    };

    const buttonText = isListening ? 'Listening...' : ' Ask Scheme Question';
    const buttonStyle = isListening 
        ? { backgroundColor: '#f39c12', color: 'white', animation: 'pulse-animation 1.5s infinite' } 
        : { backgroundColor: '#2ecc71', color: 'white' };

    // Handle offline text input
    const handleOfflineTextSearch = (text) => {
        if (text.trim().length > 0) {
            setSchemeQuery(text);
            const match = findBestSchemeMatch(text);
            setSchemeResult(match);
            
            // Text-to-Speech (TTS) for the answer
            if (match && 'speechSynthesis' in window) {
                const answer = match.Summary_Answer_Vernacular;
                const utterance = new SpeechSynthesisUtterance(answer);
                utterance.lang = 'hi-IN';
                window.speechSynthesis.speak(utterance);
            }
        } else {
            setSchemeResult(null);
        }
    };

    return (
        <div className="schemes-page">
            <h2>सरकारी योजना प्रश्नोत्तर (Schemes Q&A)</h2>
            
            {isOnline ? (
                <>
                    <p>आवाज़ से पूछें: "PMMVY में कितना पैसा मिलता है?" या "टीबी रेफरल कैसे करें?"</p>

                    {/* Mic Controls */}
                    <div className="schemes-mic-controls">
                        <button
                            onClick={handleStartSchemeSearch}
                            disabled={isListening}
                            className={`btn ${isListening ? 'btn-danger' : 'btn-primary'}`}
                        >
                            {buttonText}
                        </button>
                        <button
                            onClick={handleStopSearch}
                            disabled={!isListening}
                            className="btn btn-danger"
                        >
                            Stop & Search
                        </button>
                    </div>

                    {/* Display ASHA's Question (Transcript) */}
                    <div className="transcript-display-container">
                        <div className="transcript-box">
                            <p>Detected Query:</p>
                            <p>"{schemeQuery || (isListening ? "Waiting for speech..." : "Press Ask Question to start")}"</p>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <p>You are offline. Type your scheme question below:</p>
                    
                    {/* Offline Text Input */}
                    <div className="offline-container">
                        <textarea
                            className="offline-textarea"
                            rows="4"
                            value={schemeQuery}
                            onChange={(e) => setSchemeQuery(e.target.value)}
                            placeholder="PMMVY में कितना पैसा मिलता है? या टीबी रेफरल कैसे करें?"
                        />
                        <button 
                            className="offline-search-btn" 
                            onClick={() => handleOfflineTextSearch(schemeQuery)}
                        >
                            Search Schemes
                        </button>
                    </div>
                </>
            )}
            
            {/* Display Search Result / Answer */}
            {schemeResult && (
                <div className="result-card">
                    <h3>Matched Scheme: {schemeResult.Scheme_Name_Vernacular}</h3>
                    <div className="scheme-meta">
                        <span>ID:</span> {schemeResult.Scheme_ID} | <span>Target:</span> {schemeResult.Target_Group}
                    </div>
                    
                    <div className="summary-section">
                        <p>सारांश उत्तर (Summary Answer - Spoken Aloud):</p>
                        <div className="summary-answer">{schemeResult.Summary_Answer_Vernacular}</div>
                    </div>

                    <details className="details-section">
                        <summary>
                            विस्तृत जानकारी (Eligibility & Full Details)
                        </summary>
                        <div className="details-content">
                            <p><strong>आयु/पात्रता मानदंड:</strong> {schemeResult.Age_Criteria}</p>
                            <p><strong>विवरण:</strong> {schemeResult.Eligibility_Details_Vernacular}</p>
                        </div>
                    </details>
                </div>
            )}

            {/* Handle No Match Case */}
            {!isListening && schemeQuery && !schemeResult && (
                <div className="no-match-card">
                    <p>माफ़ करें, मुझे इस प्रश्न के लिए कोई सटीक योजना नहीं मिली। कृपया सरल शब्दों में फिर से कोशिश करें।</p>
                </div>
            )}
        </div>
    );
};

export default Schemes;

