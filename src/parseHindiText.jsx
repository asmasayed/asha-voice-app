import getNewVisitDataTemplate from './dataTemplate';
import keywords from './keywords';

// Hindi month names to numbers mapping
const hindiMonths = {
  'जनवरी': '01', 'जनवरी': '01', 'फरवरी': '02', 'फरवरी': '02', 
  'मार्च': '03', 'अप्रैल': '04', 'मई': '05', 'जून': '06', 
  'जुलाई': '07', 'अगस्त': '08', 'सितंबर': '09', 'सितम्बर': '09',
  'अक्टूबर': '10', 'अक्तूबर': '10', 'नवंबर': '11', 'नवम्बर': '11', 
  'दिसंबर': '12', 'दिसम्बर': '12'
};

// Function to parse Hindi dates and relative dates
const parseHindiDate = (dateString) => {
  if (!dateString) return null;
  
  const today = new Date();
  const currentYear = today.getFullYear();
  
  // Handle relative dates
  if (dateString.includes('अगले सप्ताह') || dateString.includes('अगले हफ्ते')) {
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    return nextWeek.toISOString().split('T')[0];
  }
  
  if (dateString.includes('अगले महीने')) {
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);
    return nextMonth.toISOString().split('T')[0];
  }
  
  if (dateString.includes('कल') || dateString.includes('tomorrow')) {
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }
  
  // Handle specific dates like "10 जनवरी 2025"
  const dateMatch = dateString.match(/(\d{1,2})\s+([^\s]+)\s+(\d{4})/);
  if (dateMatch) {
    const [, day, monthName, year] = dateMatch;
    const monthNum = hindiMonths[monthName];
    if (monthNum) {
      return `${year}-${monthNum}-${day.padStart(2, '0')}`;
    }
  }
  
  // Handle dates like "10/1/2025" or "10-1-2025"
  const numericMatch = dateString.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (numericMatch) {
    const [, day, month, year] = numericMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Handle dates like "10 जनवरी" (without year - assume current year)
  const dateWithoutYear = dateString.match(/(\d{1,2})\s+([^\s]+)/);
  if (dateWithoutYear) {
    const [, day, monthName] = dateWithoutYear;
    const monthNum = hindiMonths[monthName];
    if (monthNum) {
      return `${currentYear}-${monthNum}-${day.padStart(2, '0')}`;
    }
  }
  
  return dateString; // Return as-is if no pattern matches
};

// Function to clean up duplicate words and number sequences in text
const cleanDuplicateWords = (text) => {
  const words = text.split(/\s+/);
  const cleanedWords = [];
  let lastWord = '';
  let lastNumberSequence = '';
  
  for (const word of words) {
    // Check if this is a number sequence (like phone numbers)
    const isNumber = /^\d+$/.test(word);
    
    if (isNumber) {
      // For numbers, check if it's a duplicate of the last number sequence
      if (word !== lastNumberSequence) {
        cleanedWords.push(word);
        lastNumberSequence = word;
        lastWord = word;
      }
    } else {
      // For non-numbers, check if it's a duplicate of the last word
      if (word !== lastWord) {
        cleanedWords.push(word);
        lastWord = word;
        lastNumberSequence = ''; // Reset number sequence tracking
      }
    }
  }
  
  return cleanedWords.join(' ');
};

function parseHindiText(text, selectedVisitType = null) {
  const data = getNewVisitDataTemplate();
  if (!text || typeof text !== 'string') {
    console.warn('parseHindiText received invalid input:', text);
    return data;
  }

  // Clean up duplicate words first
  const cleanedText = cleanDuplicateWords(text);
  console.log("Original text:", text);
  console.log("Cleaned text:", cleanedText);
  const words = cleanedText.replace(/[.,!?]/g, '').toLowerCase().split(/\s+/);
  const stopWords = new Set(['है', 'हैं', 'था', 'थी', 'थे', 'का', 'की', 'को', 'में', 'और', 'ये', 'वह', 'इस', 'उसका', 'उसकी', 'हैं', 'है', 'में', 'से', 'पर', 'के', 'की', 'का', 'को', 'ने', 'से', 'तक', 'तो', 'भी', 'ही', 'सिर्फ', 'केवल']);

  // Determine visit type - prioritize selectedVisitType if provided
  let visitType = 'General';
  if (selectedVisitType) {
    visitType = selectedVisitType;
  } else {
    // Auto-detect from text
  const lowerText = text.toLowerCase();
    if (lowerText.includes('गर्भवती') || lowerText.includes('प्रेगनेंट') || lowerText.includes('गर्भावस्था') || lowerText.includes('एलएमपी') || lowerText.includes('ईडीडी') || lowerText.includes('एएनसी')) {
      visitType = 'Maternal';
    } else if (lowerText.includes('बच्चा') || lowerText.includes('शिशु') || lowerText.includes('बेबी') || lowerText.includes('टीका') || lowerText.includes('वैक्सीन') || lowerText.includes('कुपोषण')) {
      visitType = 'Child';
    }
  }
  
  data.visitType = visitType;

  // Set the isPregnant flag if the visit is determined to be Maternal
  if (data.visitType === 'Maternal') {
      data.maternalHealth.isPregnant = 'हां';
  }

  const setNestedValue = (path, value) => {
    const keys = path.split('.');
    let obj = data;
    for (let i = 0; i < keys.length - 1; i++) { 
      if (!obj[keys[i]]) obj[keys[i]] = {};
      obj = obj[keys[i]]; 
    }
    const finalKey = keys[keys.length - 1];
    if (Array.isArray(obj[finalKey])) {
      if (!obj[finalKey].includes(value)) { 
        obj[finalKey].push(value); 
      }
    } else {
      obj[finalKey] = value;
    }
  };

  // Helper function to get the correct field path based on visit type
  const getFieldPath = (mapping) => {
    if (typeof mapping.field === 'string') {
      return mapping.field;
    } else if (typeof mapping.field === 'object') {
      const visitTypeKey = visitType.toLowerCase();
      return mapping.field[visitTypeKey] || mapping.field.general || mapping.field.maternal || mapping.field.child;
    }
    return null;
  };

  // --- PHRASE-AWARE PARSING LOOP ---
  for (let i = 0; i < words.length; i++) {
    // Check for 3-word phrases first, then 2-word, then 1-word
    const threeWordPhrase = words.slice(i, i + 3).join(' ');
    const twoWordPhrase = words.slice(i, i + 2).join(' ');
    const oneWordPhrase = words[i];

    let mapping = null;
    let phraseLength = 0;

    // Check in order of specificity (longest first)
    if (keywords[threeWordPhrase]) {
      mapping = keywords[threeWordPhrase];
      phraseLength = 3;
    } else if (keywords[twoWordPhrase]) {
      mapping = keywords[twoWordPhrase];
      phraseLength = 2;
    } else if (keywords[oneWordPhrase]) {
      mapping = keywords[oneWordPhrase];
      phraseLength = 1;
    }

    if (mapping) {
      let value;
      const fieldPath = getFieldPath(mapping);

      if (!fieldPath) {
        i += phraseLength - 1;
        continue;
      }

      if (mapping.type === 'flag' || mapping.type === 'boolean') {
        value = mapping.value;
      } else if (mapping.isSuffix) {
        // Look at the word BEFORE the matched phrase
        value = words[i - 1];
      } else {
        // Look for the value AFTER the matched phrase
        const valueIndex = i + phraseLength;
        let potentialValue = words[valueIndex];

        // Skip stop words
        if (potentialValue && stopWords.has(potentialValue)) {
          potentialValue = words[valueIndex + 1];
        }

        // For multi-word values, collect until we hit a stop word or keyword
        if (potentialValue && !stopWords.has(potentialValue)) {
          const valueWords = [potentialValue];
          let j = valueIndex + 1;
          
          while (j < words.length && !stopWords.has(words[j]) && !keywords[words[j]] && !keywords[words.slice(j, j + 2).join(' ')]) {
            valueWords.push(words[j]);
            j++;
          }
          value = valueWords.join(' ');
        } else {
          value = potentialValue;
        }
      }

      // Type conversion
      if (mapping.type === 'number' && value) {
        const num = parseInt(value, 10);
        if (!isNaN(num)) { 
          value = num; 
        }
      }

      // Set the value if it's valid
      if (value !== undefined && value !== null && value !== '' && value !== 'undefined') {
        // Special handling for follow-up dates
        if (fieldPath === 'treatment.nextFollowUp') {
          const parsedDate = parseHindiDate(value);
          setNestedValue(fieldPath, parsedDate || value);
        } else {
          setNestedValue(fieldPath, value);
        }
      }

      // Advance the loop index
      i += phraseLength - 1;
    }
  }

  // Set treatment visit type to match main visit type
  data.treatment.visitType = data.visitType;

  console.log("--- PHRASE-AWARE PARSED DATA ---", data);
  return data;
}

export default parseHindiText;

