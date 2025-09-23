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
    recognition.interimResults = false; // We only want the final result

    recognition.onstart = () => {
      setIsListening(true);
      console.log('Listening started...');
    };

    recognition.onresult = (event) => {
      const speechToText = event.results[0][0].transcript;
      console.log('Recognized text:', speechToText);
      setTranscribedText(speechToText);
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

export default App;