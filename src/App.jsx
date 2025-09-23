import { useState } from 'react';
import './App.css'; // You can remove the default styles later

function App() {
  const [transcribedText, setTranscribedText] = useState('');
  const [isListening, setIsListening] = useState(false);

  const startListening = () => {
    // Check if the browser supports Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser doesn't support Speech Recognition. Try Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN'; 
    recognition.interimResults = true; // We only want the final result

    recognition.onstart = () => {
      setIsListening(true);
      console.log('Listening started...');
    };

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');

      // Update the state to show the live transcript on the screen
      setTranscribedText(transcript);

      // Check if the final result has been recognized
      if (event.results[0].isFinal) {
        console.log('Final recognized text:', transcript);
        // parse data to hindi
        const parsedData = parseHindiText(transcript);
        console.log('Parsed Data:', parsedData);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
    };

    recognition.onend = () => {
      setIsListening(false);
      console.log('Listening stopped.');
    };

    recognition.start();
  };

  return (
    <div className="App">
      <h1>ASHA Voice Assistant</h1>
      <button onClick={startListening} disabled={isListening}>
        {isListening ? 'Listening...' : 'Start Recording'}
      </button>
      {transcribedText && <p>You said: {transcribedText}</p>}
    </div>
  );
}

function parseHindiText(text) {
  console.log("Parsing text:", text); // For debugging

  const stopWords = new Set(['और', 'था', 'है', 'की', 'का', 'तो', 'थी']);
  
  const data = {
    name: null,
    age: null,
    symptoms: [],
  };

  // logic:
  const words = text.replace(/[.,]/g, '').split(' ');
 

  // --- Logic to find the NAME ---
  const nameKeywords = ['उपनाम ', 'नाम'];
  for (const keyword of nameKeywords) {
    const keywordIndex = words.indexOf(keyword);

    if (keywordIndex > -1) {
      // First, check the word AFTER the keyword
      const potentialNameAfter = words[keywordIndex + 1];
      if (potentialNameAfter && !stopWords.has(potentialNameAfter)) {
        data.name = potentialNameAfter;
        break; // Found the name, so we can stop searching.
      }

      // If not found, THEN check the word BEFORE the keyword
      const potentialNameBefore = words[keywordIndex - 1];
      if (potentialNameBefore && !stopWords.has(potentialNameBefore)) {
        data.name = potentialNameBefore;
        break; // Found the name, so we can stop searching.
      }
    }
  }

  // --- Logic to find the AGE ---
  const ageKeywords = ['आयु', 'उम्र', 'साल']; // Add variations you want to catch
let ageFound = false; // A flag to stop searching once we find it

for (const keyword of ageKeywords) {
  const keywordIndex = words.indexOf(keyword);

  // Check if the keyword exists AND there is a word immediately BEFORE it
  if (keywordIndex > 0) {
    // Get the word before "saal"
    const potentialAge = parseInt(words[keywordIndex - 1]);

    // Check if that word is a valid number
    if (!isNaN(potentialAge)) { // isNaN checks if it's "Not a Number"
      data.age = potentialAge;
      ageFound = true;
      break; // Exit the loop as soon as we find a valid age
    }
  }
}

  // --- Logic to find SYMPTOMS ---
  // You can list all possible symptoms you want to detect
  const possibleSymptoms = {
    "बुखार": "fever", "खांसी": "cough", "दर्द": "pain", "कमजोरी": "weakness"
  };
  words.forEach(word => {
    if (possibleSymptoms[word]) {
      // Avoid adding duplicates
      if (!data.symptoms.includes(possibleSymptoms[word])) {
        data.symptoms.push(possibleSymptoms[word]);
      }
    }
  });

  return data;
}

export default App;