import { useState, useRef } from 'react';
import './App.css'

function parseHindiText(text) {
  // A set of common words to ignore when searching for names or other data.
  // Using a Set provides a very fast way to check for a word's existence.
  const stopWords = new Set(['और', 'था', 'है', 'की', 'का', 'तो', 'थी', 'उसका', 'उसकी', 'मेरा', 'हैं']);
  
  const data = {
    name: null,
    age: null,
    symptoms: [],
  };

  // Clean the text by removing punctuation and splitting it into an array of words.
  const words = text.replace(/[.,]/g, '').split(' ');

  // --- Logic to find the NAME ---
  // We look for keywords that typically precede or follow a name.
  const nameKeywords = ['उपनाम', 'नाम'];
  for (const keyword of nameKeywords) {
    const keywordIndex = words.indexOf(keyword);
    if (keywordIndex > -1) {
      const potentialNameAfter = words[keywordIndex + 1];
      
      // 1. Check the word immediately AFTER the keyword.
      if (potentialNameAfter && !stopWords.has(potentialNameAfter)) {
        data.name = potentialNameAfter;
        break; // Found the name, so we can stop searching.
      } 
      // 2. If the word after was a stop word (like 'है'), check the NEXT word.
      else if (potentialNameAfter && stopWords.has(potentialNameAfter)) {
        const nameFurtherAhead = words[keywordIndex + 2];
        if (nameFurtherAhead && !stopWords.has(nameFurtherAhead)) {
          data.name = nameFurtherAhead;
          break;
        }
      }

      // 3. As a fallback, check the word BEFORE the keyword.
      const potentialNameBefore = words[keywordIndex - 1];
      if (potentialNameBefore && !stopWords.has(potentialNameBefore)) {
        data.name = potentialNameBefore;
        break;
      }
    }
  }

  // --- Logic to find the AGE ---
  const ageKeywords = ['आयु', 'उम्र', 'साल'];
  let ageFound = false;
  for (const keyword of ageKeywords) {
    const keywordIndex = words.indexOf(keyword);
    if (keywordIndex > -1) {
      // 1. Check for a number AFTER the keyword (e.g., "उम्र 25").
      const potentialAgeAfter = parseInt(words[keywordIndex + 1]);
      if (!isNaN(potentialAgeAfter)) {
        data.age = potentialAgeAfter;
        ageFound = true;
        break;
      }
      // 2. Check for a number BEFORE the keyword (e.g., "25 साल").
      const potentialAgeBefore = parseInt(words[keywordIndex - 1]);
      if (!isNaN(potentialAgeBefore)) {
        data.age = potentialAgeBefore;
        ageFound = true;
        break;
      }
    }
  }

  // --- Logic to find SYMPTOMS ---
  const possibleSymptoms = {
    "बुखार": "fever", "खांसी": "cough", "दर्द": "pain", "कमजोरी": "weakness"
  };
  words.forEach(word => {
    // If a word matches a known symptom and isn't already in the list, add it.
    if (possibleSymptoms[word] && !data.symptoms.includes(possibleSymptoms[word])) {
      data.symptoms.push(possibleSymptoms[word]);
    }
  });

  return data;
}

function App() {
  // State for the live text transcript from the microphone.
  const [transcribedText, setTranscribedText] = useState('');
  // State to manage the recording status: 'idle', 'recording', 'paused'.
  const [recordingStatus, setRecordingStatus] = useState('idle');
  // State to hold the final parsed data, which triggers the confirmation view.
  const [parsedData, setParsedData] = useState(null);

  // useRef is used to hold a persistent reference to the SpeechRecognition object
  // across re-renders, without causing them.
  const recognitionRef = useRef(null);
  
  // This ref helps preserve the transcript during pause/resume cycles.
  const accumulatedTranscriptRef = useRef('');

  // Handles starting a new recording or resuming a paused one.
  const handleStartOrResume = () => {
    // Before starting, save the current transcript to the ref.
    accumulatedTranscriptRef.current = transcribedText;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser doesn't support Speech Recognition. Please use Chrome.");
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;
    
    recognition.lang = 'hi-IN'; // Set language to Hindi.
    recognition.interimResults = true; // Get live results as the user speaks.
    recognition.continuous = true; // Keep listening even during pauses.

    recognition.onresult = (event) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        interimTranscript += event.results[i][0].transcript;
      }
      // THE KEY FIX: Combine the old transcript (from before the pause) with the new part.
      setTranscribedText(accumulatedTranscriptRef.current + interimTranscript);
    };

    recognition.onerror = (event) => console.error('Speech recognition error:', event.error);
    
    recognition.start();
    setRecordingStatus('recording');
  };
  
  // Pauses the recording.
  const handlePause = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop(); // Temporarily stop listening.
      setRecordingStatus('paused');
    }
  };

  // Stops the recording completely and processes the final text.
  const handleStop = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      const finalTranscript = transcribedText;
      const data = parseHindiText(finalTranscript);
      setParsedData(data); // Show the confirmation card.
      setRecordingStatus('idle');
      accumulatedTranscriptRef.current = ''; // Clear the ref for the next session.
    }
  };
  
  // Handles the confirmation of the parsed data.
  const handleConfirm = () => {
    console.log('Visit confirmed:', parsedData);
    // In a real app, you would save this data to a list or send it to a server.
    setParsedData(null); // Go back to the main screen.
    setTranscribedText(''); // Clear the transcript.
  };

  // Handles retrying the recording.
  const handleRetry = () => {
    setParsedData(null); // Go back to the main screen.
    setTranscribedText(''); // Clear the transcript.
  };

  return (
    <>
      
      <div className="container">
        <header>
          <h1>आशा সহায়ক</h1>
          <p>ASHA Voice Assistant</p>
        </header>
        
        <main>
          {/* Conditional UI: Show confirmation card or recording view */}
          {parsedData ? (
            <div className="card confirmation-card">
              <h2>Please Confirm Visit Details</h2>
              <div className="details">
                <p><strong>Name:</strong> {parsedData.name || 'Not found'}</p>
                <p><strong>Age:</strong> {parsedData.age || 'Not found'}</p>
                <p><strong>Symptoms:</strong> {parsedData.symptoms.join(', ') || 'None'}</p>
              </div>
              <div className="button-group">
                <button onClick={handleConfirm} className="btn btn-confirm">Confirm & Save</button>
                <button onClick={handleRetry} className="btn btn-retry">Record Again</button>
              </div>
            </div>
          ) : (
            <div className="card recording-view">
              <div className="transcript-box">
                <p>{transcribedText || "Press 'Start Recording' and speak..."}</p>
              </div>
              <div className="button-group">
                {recordingStatus === 'idle' && (
                  <button onClick={handleStartOrResume} className="btn btn-start">Start Recording</button>
                )}
                {recordingStatus === 'recording' && (
                  <button onClick={handlePause} className="btn btn-pause">Pause</button>
                )}
                {recordingStatus === 'paused' && (
                  <button onClick={handleStartOrResume} className="btn btn-resume">Resume</button>
                )}
                {(recordingStatus === 'recording' || recordingStatus === 'paused') && (
                  <button onClick={handleStop} className="btn btn-stop">Stop & Finish</button>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

export default App;

