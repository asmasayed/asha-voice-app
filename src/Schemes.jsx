// src/Schemes.jsx

import React from 'react';
import schemeData from './schemes.json'; // 🚨 Imports your 30-entry database

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

    schemeData.forEach(scheme => {
        let currentScore = 0;
        
        // Combine all search fields into one searchable pool
        const searchPool = [
            scheme.Keywords_Vernacular,
            scheme.Scheme_Name_Vernacular,
            scheme.Target_Group,
            scheme.Age_Criteria 
        ].join(' ').toLowerCase();

        // Score by direct word presence
        queryWords.forEach(qWord => {
            if (searchPool.includes(qWord)) {
                currentScore += 1;
            }
        });
        
        // Score boost for direct IDs/acronyms (e.g., 'JSY', 'PMMVY')
        if (searchPool.includes(normalizedQuery)) {
             currentScore += 5; 
        } else if (normalizedQuery.length > 2 && searchPool.includes(normalizedQuery.substring(0, 3))) {
             currentScore += 3; // Partial acronym match boost
        }


        if (currentScore > maxScore) {
            maxScore = currentScore;
            bestMatch = scheme;
        }
    });

    // Require at least 2 matching keywords for a confident answer
    return maxScore >= 2 ? bestMatch : null;
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
    setRecordingStatus
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

    const buttonText = isListening ? '🔴 Listening...' : '🎤 Ask Scheme Question';
    const buttonStyle = isListening 
        ? { backgroundColor: '#f39c12', color: 'white', animation: 'pulse-animation 1.5s infinite' } 
        : { backgroundColor: '#2ecc71', color: 'white' };


    return (
        <div className="page-content schemes-page card">
            <h2 className="text-xl font-bold text-green-700 mb-4">📚 सरकारी योजना प्रश्नोत्तर (Schemes Q&A)</h2>
            <p className="text-gray-600 mb-4">आवाज़ से पूछें: "PMMVY में कितना पैसा मिलता है?" या "टीबी रेफरल कैसे करें?"</p>

            {/* Mic Controls */}
            <div className="flex justify-center space-x-4 mb-6">
                <button
                    onClick={handleStartSchemeSearch}
                    disabled={isListening}
                    className={`btn ${isListening ? 'btn-pause' : 'btn-resume'}`}
                    style={{...buttonStyle, width: '200px' }}
                >
                    {buttonText}
                </button>
                <button
                    onClick={handleStopSearch}
                    disabled={!isListening}
                    className="btn btn-stop"
                    style={{ width: '150px' }}
                >
                    Stop & Search
                </button>
            </div>

            {/* Display ASHA's Question (Transcript) */}
            <div className="transcript-box" style={{ height: '70px', backgroundColor: '#e8f5e9' }}>
                <p className="text-sm font-semibold text-gray-600 mb-1">Detected Query:</p>
                <p className="text-lg text-gray-800 italic">"{schemeQuery || (isListening ? "Waiting for speech..." : "Press Ask Question to start")}"</p>
            </div>
            
            {/* Display Search Result / Answer */}
            {schemeResult && (
                <div className="card mt-6 p-4 border-2 border-green-500 shadow-xl" style={{textAlign: 'left'}}>
                    <h3 className="text-xl font-bold text-green-800 mb-2">✅ Matched Scheme: {schemeResult.Scheme_Name_Vernacular}</h3>
                    <p className="text-sm font-semibold text-gray-600 mb-3">ID: {schemeResult.Scheme_ID} | Target: {schemeResult.Target_Group}</p>
                    
                    <div className="border-t pt-3">
                        <p className="text-md font-bold text-gray-800">सारांश उत्तर (Summary Answer - Spoken Aloud):</p>
                        <p className="text-green-700 text-xl font-semibold mb-3">{schemeResult.Summary_Answer_Vernacular}</p>
                    </div>

                    <details className="mt-4 p-3 bg-gray-50 border rounded-md">
                        <summary className="font-semibold text-blue-600 cursor-pointer">
                            विस्तृत जानकारी (Eligibility & Full Details)
                        </summary>
                        <div className="mt-2 text-gray-700 space-y-1">
                            <p><strong>आयु/पात्रता मानदंड:</strong> {schemeResult.Age_Criteria}</p>
                            <p><strong>विवरण:</strong> {schemeResult.Eligibility_Details_Vernacular}</p>
                        </div>
                    </details>
                </div>
            )}

            {/* Handle No Match Case */}
            {!isListening && schemeQuery && !schemeResult && (
                <div className="card bg-yellow-100 p-3 mt-4 border border-yellow-400 text-yellow-800 font-semibold">
                    ⚠️ माफ़ करें, मुझे इस प्रश्न के लिए कोई सटीक योजना नहीं मिली। कृपया सरल शब्दों में फिर से कोशिश करें।
                </div>
            )}
        </div>
    );
};

export default Schemes;