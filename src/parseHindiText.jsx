import getNewVisitDataTemplate from './dataTemplate';
import keywords from './keywords';

function parseHindiText(text) {
  const data = getNewVisitDataTemplate();
  if (!text || typeof text !== 'string') {
    console.warn('parseHindiText received invalid input:', text);
    return data;
  }

  const words = text.replace(/[.,!?]/g, '').toLowerCase().split(/\s+/);
  const stopWords = new Set(['है', 'हैं', 'था', 'थी', 'थे', 'का', 'की', 'को', 'में', 'और', 'ये', 'वह', 'इस', 'उसका', 'उसकी']);

  // --- DETERMINE VISIT TYPE ---
  // This now checks if any of the matched keywords belong to the maternal or child health categories.
  const matchedKeywords = words.map(word => keywords[word]).filter(Boolean);
  if (matchedKeywords.some(kw => kw.field.startsWith('maternalHealth'))) {
    data.visitType = 'Maternal';
  } else if (matchedKeywords.some(kw => kw.field.startsWith('childHealth'))) {
    data.visitType = 'Child';
  }

  const setNestedValue = (path, value) => {
    const keys = path.split('.');
    let obj = data;
    for (let i = 0; i < keys.length - 1; i++) { obj = obj[keys[i]]; }
    const finalKey = keys[keys.length - 1];
    if (Array.isArray(obj[finalKey])) {
      if (!obj[finalKey].includes(value)) { obj[finalKey].push(value); }
    } else {
      obj[finalKey] = value;
    }
  };

  // --- NEW: PHRASE-AWARE PARSING LOOP ---
  // We use a standard for loop so we can control the index `i` and skip ahead
  // after matching a multi-word phrase.
  for (let i = 0; i < words.length; i++) {
    // Construct potential 2-word and 1-word phrases starting at the current word.
    const twoWordPhrase = words.slice(i, i + 2).join(' ');
    const oneWordPhrase = words[i];

    let mapping = null;
    let phraseLength = 0;

    // IMPORTANT: Check for the longest phrase first (2 words), then fall back to 1 word.
    if (keywords[twoWordPhrase]) {
      mapping = keywords[twoWordPhrase];
      phraseLength = 2;
    } else if (keywords[oneWordPhrase]) {
      mapping = keywords[oneWordPhrase];
      phraseLength = 1;
    }

    // If we found a match (either 1 or 2 words)
    if (mapping) {
      let value;

      if (mapping.type === 'flag' || mapping.type === 'boolean') {
        value = mapping.value;
      } else if (mapping.isSuffix) {
        // Look at the word BEFORE the matched phrase
        value = words[i - 1];
      } else {
        // Look for the value AFTER the matched phrase
        const valueIndex = i + phraseLength; // The position right after our keyword
        const potentialValue = words[valueIndex];

        if (potentialValue && stopWords.has(potentialValue)) {
          const lookAheadValue = words[valueIndex + 1];
          if (lookAheadValue && !stopWords.has(lookAheadValue)) {
            value = lookAheadValue;
          }
        } else {
          value = potentialValue;
        }
      }

      if (mapping.type === 'number' && value) {
        const num = parseInt(value, 10);
        if (!isNaN(num)) { value = num; }
      }

      if (value !== undefined && value !== null && value !== '') {
        setNestedValue(mapping.field, value);
      }

      // CRUCIAL: Advance the loop index to jump past the phrase we just processed.
      i += phraseLength - 1;
    }
  }

  console.log("--- PHRASE-AWARE PARSED DATA ---", data);
  return data;
}

export default parseHindiText;

