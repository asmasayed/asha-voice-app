// src/Schemes.jsx
import React from 'react';
import schemeData from './schemes.json';
import './Schemes.css'; // Import the new stylesheet

// === 1. OFFLINE NLU LOGIC (No changes here) ===
// ... (Your entire findBestSchemeMatch function remains unchanged)
const normalizeText = (text) => {
    if (!text) return '';
    return text.toLowerCase()
               .replace(/[^\w\s\u0900-\u097F]/g, '') // Remove punctuation but keep Hindi/Devanagari
               .replace(/है|हैं|और|की|का|के|में|को|पर|एक|होता|होती|हैं|क्या|कब|कितना|चाहिए|क्यों|से/g, '') // Remove filler words
               .trim();
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
    isOnline,
    handleStartSchemeSearch, // Add this
    handleStopSchemeSearch
}) => {
    
    const isListening = recordingStatus === 'listening_scheme'; 

    const buttonText = isListening ? '🔴 Listening...' : '🎤 Ask Scheme Question';

    return (
        <div className="page-content schemes-page card">
            <h2 className="schemes-header">सरकारी योजना प्रश्नोत्तर (Schemes Q&A)</h2>
            
            {isOnline ? (
                <>
                    <p className="schemes-description">
                        आवाज़ से पूछें: "PMMVY में कितना पैसा मिलता है?" या "टीबी रेफरल कैसे करें?"
                    </p>

                    <div className="schemes-controls">
                        <button
                            onClick={handleStartSchemeSearch}
                            disabled={isListening}
                            className={`btn ${isListening ? 'btn-listening' : 'btn-ask'}`}
                        >
                            {buttonText}
                        </button>
                        <button
                            onClick={handleStopSchemeSearch}
                            disabled={!isListening}
                            className="btn btn-stop"
                        >
                            Stop & Search
                        </button>
                    </div>

                    <div className="transcript-box transcript-box-schemes">
                        <p className="query-text">
                            "{schemeQuery || (isListening ? "Waiting for your question..." : "Press the button to ask")}"
                        </p>
                    </div>
                </>
            ) : (
                <>
                    <p className="schemes-description">📶 You are offline. Type your scheme question below:</p>
                    
                    <div className="offline-container">
                        <textarea
                            className="schemes-offline-textarea"
                            rows="4"
                            value={schemeQuery}
                            onChange={(e) => setSchemeQuery(e.target.value)}
                            placeholder="e.g., PMMVY में कितना पैसा मिलता है?"
                        />
                        <button 
                            className="btn btn-primary" 
                            onClick={() => handleOfflineTextSearch(schemeQuery)}
                        >
                            Search Schemes
                        </button>
                    </div>
                </>
            )}
            
            {schemeResult && (
                <div className="card result-card">
                    <h3 className="result-header">✅ Matched Scheme: {schemeResult.Scheme_Name_Vernacular}</h3>
                    <p className="result-meta">ID: {schemeResult.Scheme_ID} | Target: {schemeResult.Target_Group}</p>
                    
                    <div className="result-summary">
                        <p className="summary-label">Summary Answer (Spoken Aloud):</p>
                        <p className="summary-answer">{schemeResult.Summary_Answer_Vernacular}</p>
                    </div>

                    <details className="result-details">
                        <summary>Detailed Information (Eligibility & Benefits)</summary>
                        <div className="details-content">
                            <p><strong>Eligibility:</strong> {schemeResult.Age_Criteria}</p>
                            <p><strong>Full Details:</strong> {schemeResult.Eligibility_Details_Vernacular}</p>
                        </div>
                    </details>
                </div>
            )}

            {!isListening && schemeQuery && !schemeResult && (
                <div className="card no-match-card">
                    ⚠️ Sorry, no exact scheme found for this query. Please try rephrasing with simpler words.
                </div>
            )}
        </div>
    );
};

export default Schemes;