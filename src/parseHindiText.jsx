import getNewVisitDataTemplate from './dataTemplate';
import keywords from './keywords';

const parseSpokenDate = (text) => {
  if (!text) return null;
  const cleanText = text.toLowerCase().trim().replace(/को$/, '').replace(/है$/, '').replace(/[.,!?]$/, '').trim();
  const date = new Date();

  // 1. Handle relative dates first
  if (cleanText.includes('कल')) { date.setDate(date.getDate() + 1); }
  else if (cleanText.includes('परसों')) { date.setDate(date.getDate() + 2); }
  else if (cleanText.includes('अगले हफ्ते') || cleanText.includes('एक हफ्ता बाद')) { date.setDate(date.getDate() + 7); }
  else if (cleanText.includes('दिन बाद')) {
    const daysMatch = cleanText.match(/(\d+)/);
    if (daysMatch) { date.setDate(date.getDate() + parseInt(daysMatch[1], 10)); }
  } else {
    // 2. If not relative, parse a specific date (e.g., "30 सितंबर 2025")
    const monthMap = { 'जनवरी':0, 'फरवरी':1, 'फ़रवरी':1, 'मार्च':2, 'अप्रैल':3, 'मई':4, 'जून':5, 'जुलाई':6, 'अगस्त':7, 'सितंबर':8, 'अक्टूबर':9, 'नवंबर':10, 'दिसंबर':11, 'january':0, 'february':1, 'march':2, 'april':3, 'may':4, 'june':5, 'july':6, 'august':7, 'september':8, 'october':9, 'november':10, 'december':11 };
    const allMonthNames = Object.keys(monthMap).join('|');
    const monthNameRegex = new RegExp(`(\\d{1,2})\\s*(${allMonthNames})\\s*(\\d{4})?`);
    const monthNameMatch = cleanText.match(monthNameRegex);

    if (monthNameMatch) {
      const day = parseInt(monthNameMatch[1], 10);
      const monthName = monthNameMatch[2];
      const month = monthMap[monthName];
      const year = monthNameMatch[3] ? parseInt(monthNameMatch[3], 10) : date.getFullYear();
      if (month !== undefined) date.setFullYear(year, month, day);
    } 
    // 3. Fallback for numeric dates (e.g., "30 9 2025")
    else {
      const numericDateMatch = cleanText.match(/(\d{1,2})\s+(\d{1,2})\s+(\d{4})?/);
      if (numericDateMatch) {
        const day = parseInt(numericDateMatch[1], 10);
        const month = parseInt(numericDateMatch[2], 10) - 1;
        const year = numericDateMatch[3] ? parseInt(numericDateMatch[3], 10) : date.getFullYear();
        date.setFullYear(year, month, day);
      } else {
        return null; // All parsing attempts have failed
      }
    }
  }

  // ALWAYS return the date in the standard YYYY-MM-DD format for database consistency.
  return date.toISOString().split('T')[0];
};
const stopWords = new Set(['है', 'हैं', 'था', 'थी', 'थे', 'का', 'की', 'को', 'में', 'और', 'ये', 'वह', 'इस', 'उसका', 'उसकी']);
const trimTrailingStopWords = (text) => {
    const words = text.split(/\s+/);
    while (words.length > 0 && stopWords.has(words[words.length - 1])) {
        words.pop(); // Remove the last word if it's a stop word
    }
    return words.join(' ');
};


const cleanTranscript = (text) => {
    let words = text.split(/\s+/);
    let cleanedWords = [];
    if (words.length < 2) return text;

    // First pass for single word repeats
    cleanedWords.push(words[0]);
    for (let i = 1; i < words.length; i++) {
        if (words[i] !== words[i-1]) {
            cleanedWords.push(words[i]);
        }
    }
    
    // Second pass for repeated multi-word phrases (e.g., "ling purush ling purush")
    let finalWords = [];
    let i = 0;
    while (i < cleanedWords.length) {
        let bestMatchLength = 0;
        // Check for repeated phrases starting at the current word
        for (let len = 1; len <= Math.floor((cleanedWords.length - i) / 2); len++) {
            const phrase1 = cleanedWords.slice(i, i + len).join(' ');
            const phrase2 = cleanedWords.slice(i + len, i + 2 * len).join(' ');
            if (phrase1 === phrase2) {
                bestMatchLength = len;
            }
        }

        if (bestMatchLength > 0) {
            finalWords.push(...cleanedWords.slice(i, i + bestMatchLength));
            i += 2 * bestMatchLength; // Skip over the repeated phrase
        } else {
            finalWords.push(cleanedWords[i]);
            i++;
        }
    }
    return finalWords.join(' ');
};

function parseHindiText(text) {
    const data = getNewVisitDataTemplate();
    if (!text || typeof text !== 'string') { return data; }

    const cleanText = cleanTranscript(text);
    const lowerText = cleanText.toLowerCase();

    let visitType = 'General';
    if (lowerText.includes('गर्भवती') || lowerText.includes('प्रेगनेंट') || lowerText.includes('एएनसी')) {
        visitType = 'Maternal';
    } else if (lowerText.includes('बच्चा') || lowerText.includes('शिशु') || lowerText.includes('टीका')) {
        visitType = 'Child';
    }
    data.visitType = visitType;
    if (visitType === 'Maternal') { data.maternalHealth.isPregnant = 'हां'; }

    const setNestedValue = (path, value) => {
        const keys = path.split('.');
        let obj = data;
        for (let i = 0; i < keys.length - 1; i++) {
            if (!obj[keys[i]]) obj[keys[i]] = {};
            obj = obj[keys[i]];
        }
        const finalKey = keys[keys.length - 1];
        if (Array.isArray(obj[finalKey])) {
            if (!obj[finalKey].includes(value)) obj[finalKey].push(value);
        } else { obj[finalKey] = value; }
    };
    
    const getFieldPath = (mapping) => {
        if (typeof mapping.field === 'string') return mapping.field;
        if (typeof mapping.field === 'object') return mapping.field[visitType.toLowerCase()];
        return null;
    };

    const foundKeywords = [];
    const sortedKeywords = Object.keys(keywords).sort((a, b) => b.length - a.length);

    sortedKeywords.forEach(kw => {
        const regex = new RegExp(kw, 'g');
        let match;
        while ((match = regex.exec(lowerText)) != null) {
            const isOverlapped = foundKeywords.some(found => match.index >= found.index && match.index < found.endIndex);
            if (!isOverlapped) {
                foundKeywords.push({ keyword: kw, index: match.index, endIndex: match.index + kw.length });
            }
        }
    });
    foundKeywords.sort((a, b) => a.index - b.index);

    foundKeywords.forEach((found, i) => {
        const mapping = keywords[found.keyword];
        const fieldPath = getFieldPath(mapping);
        if (!fieldPath) return;

        const valueStartIndex = found.endIndex;
        const valueEndIndex = (i + 1 < foundKeywords.length) ? foundKeywords[i + 1].index : cleanText.length;
        let valueText = cleanText.substring(valueStartIndex, valueEndIndex).trim();
        valueText = valueText.replace(/^[:\s,]+/, '').replace(/[.,!?]$/, '').trim();

        if (mapping.type === 'flag' || mapping.type === 'boolean') {
            setNestedValue(fieldPath, mapping.value);
        } else if (mapping.type === 'array') {
            sortedKeywords.forEach(kw => {
                if (valueText.includes(kw)) {
                    const itemMapping = keywords[kw];
                    if (itemMapping.type === 'flag' && getFieldPath(itemMapping) === fieldPath) {
                        setNestedValue(fieldPath, itemMapping.value);
                    }
                }
            });
        } else if (valueText) {
            // --- THIS IS THE FIX ---
            // Before assigning the value, clean it by trimming any trailing stop words.
            let finalValue = trimTrailingStopWords(valueText);

            if (fieldPath === 'treatment.nextFollowUp') {
                finalValue = parseSpokenDate(finalValue) || finalValue;
            } else if (mapping.type === 'number') {
                const numMatch = finalValue.match(/\d+/);
                if (numMatch) finalValue = parseInt(numMatch[0], 10);
            }
            setNestedValue(fieldPath, finalValue);
        }
    });

    console.log("--- FINAL PARSED DATA ---", data);
    return data;
}

export default parseHindiText;

