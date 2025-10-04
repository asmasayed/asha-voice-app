import getNewVisitDataTemplate from './dataTemplate';
import keywords from './keywords';

// Basic Hindi digit map and word-number map for common ages
const devanagariDigits = { '०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9' };

const wordNumberMap = {
  'शून्य': 0, 'एक': 1, 'दो': 2, 'तीन': 3, 'चार': 4, 'पांच': 5, 'पाँच': 5, 'छह': 6, 'सात': 7, 'आठ': 8, 'नौ': 9, 'दस': 10,
  'ग्यारह': 11, 'बारह': 12, 'तेरह': 13, 'चौदह': 14, 'पंद्रह': 15, 'पन्द्रह': 15, 'सोलह': 16, 'सत्रह': 17, 'अठारह': 18, 'उन्नीस': 19,
  'बीस': 20, 'इक्कीस': 21, 'बाइस': 22, 'बाईस': 22, 'तेईस': 23, 'चौबीस': 24, 'पच्चीस': 25, 'छब्बीस': 26, 'सत्ताईस': 27, 'अट्ठाईस': 28, 'अट्ठाइस': 28, 'उनतीस': 29,
  'तीस': 30, 'इकतीस': 31, 'बत्तीस': 32, 'तेतीस': 33, 'चौतीस': 34, 'पैंतीस': 35, 'पैंतीस': 35, 'छ्त्तीस': 36, 'छत्तीस': 36, 'सैंतीस': 37, 'अड़तीस': 38, 'अड़तालीस': 48,
  'उनतालीस': 39, 'चालीस': 40, 'पैंतालीस': 45, 'पचास': 50, 'साठ': 60, 'सत्तर': 70, 'अस्सी': 80, 'नब्बे': 90, 'सौ': 100
};

const nameCueTokens = new Set([
  'नाम', 'मेरा', 'मेरे', 'मेरी', 'उपनाम', 'सरनेम', 'surname', 'lastname', 'last', 'first', 'given', 'name'
]);

const ageCueTokens = new Set([
  'उम्र', 'उमर', 'साल', 'age', 'years', 'year', 'saal'
]);

const hindiStop = new Set([
  'है','हैं','था','थी','थे','का','की','के','को','में','और','यह','ये','वह','इस','उस','उसका','उसकी','उनका','उनकी','तो','भी','पर','से','केलिए','लिए'
]);

const bannedNameTokens = new Set(['है','हैं','था','थी','थे','साल','उम्र','उमर']);

function toLatinDigits(str) {
  return str.replace(/[०-९]/g, d => devanagariDigits[d] ?? d);
}

function isPureNumberToken(tok) {
  const t = toLatinDigits(tok);
  return /^[0-9]+$/.test(t);
}

function parseNumberToken(tok) {
  if (!tok) return null;
  const latin = toLatinDigits(tok);
  if (/^[0-9]+$/.test(latin)) return parseInt(latin, 10);
  return wordNumberMap[tok] ?? null;
}

function sanitizeToken(tok) {
  return tok.replace(/[.,!?:;()\-–—/\\'"“”‘’]/g, '').trim();
}

function looksLikeNameToken(tok) {
  if (!tok) return false;
  if (bannedNameTokens.has(tok)) return false;
  if (hindiStop.has(tok)) return false;
  if (isPureNumberToken(tok)) return false;
  // Accept Devanagari or alphabetic Latin; reject if contains digits after sanitize
  const s = sanitizeToken(tok);
  if (!s) return false;
  if (/[0-9]/.test(s)) return false;
  return /[\u0900-\u097F]+/.test(s) || /^[a-zA-Z]+$/.test(s);
}

function windowTokens(words, idx, left=3, right=3) {
  const start = Math.max(0, idx - left);
  const end = Math.min(words.length, idx + right + 1);
  return { start, end, span: words.slice(start, end) };
}

function pickNearestAge(words, cueIdx) {
  // Prefer immediate neighbors in patterns like "25 साल" or "साल 25"
  const left1 = words[cueIdx - 1] ? sanitizeToken(words[cueIdx - 1]) : '';
  const right1 = words[cueIdx + 1] ? sanitizeToken(words[cueIdx + 1]) : '';
  let val = parseNumberToken(left1);
  if (val == null) val = parseNumberToken(right1);
  if (val != null) return val;

  // Else scan broader window
  const { start, end } = windowTokens(words, cueIdx, 3, 3);
  let best = null, bestDist = 10;
  for (let i = start; i < end; i++) {
    if (i === cueIdx) continue;
    const tok = sanitizeToken(words[i]);
    const n = parseNumberToken(tok);
    if (n != null) {
      const dist = Math.abs(i - cueIdx);
      if (dist < bestDist) { best = n; bestDist = dist; }
    }
  }
  return best;
}

function extractNameAroundCue(words, cueIdx) {
  // Try to collect up to 2 tokens to the right (e.g., "नाम राहुल शर्मा है")
  const rightTokens = [];
  for (let i = cueIdx + 1; i <= cueIdx + 3 && i < words.length; i++) {
    const tok = sanitizeToken(words[i]);
    if (!looksLikeNameToken(tok)) continue;
    rightTokens.push(tok);
    if (rightTokens.length >= 2) break;
  }
  // Drop trailing auxiliaries like "है" if somehow slipped
  while (rightTokens.length && bannedNameTokens.has(rightTokens[rightTokens.length - 1])) {
    rightTokens.pop();
  }
  // If nothing on right, try left tokens (e.g., "राहुल शर्मा मेरा नाम है")
  const leftTokens = [];
  for (let i = cueIdx - 1; i >= cueIdx - 3 && i >= 0; i--) {
    const tok = sanitizeToken(words[i]);
    if (!looksLikeNameToken(tok)) continue;
    leftTokens.push(tok);
    if (leftTokens.length >= 2) break;
  }
  // Prefer right side if available; else use reversed left side to maintain order
  if (rightTokens.length) return rightTokens.join(' ');
  if (leftTokens.length) return leftTokens.reverse().join(' ');
  return '';
}

function splitName(nameFull) {
  if (!nameFull) return { firstName: '', lastName: '' };
  const parts = nameFull.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

function parseHindiText(text) {
  const data = getNewVisitDataTemplate();
  if (!text || typeof text !== 'string') {
    console.warn('parseHindiText received invalid input:', text);
    return data;
  }

  // Normalize and tokenize, but keep original too for name casing if needed
  const normalized = text.replace(/\s+/g, ' ').trim();
  const words = normalized
    .replace(/[.,!?:;()\-–—/\\'"“”‘’]/g, ' ')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  // 1) Visit type inference from keywords (as in your code)
  for (let i = 0; i < words.length; i++) {
    const two = (words[i] || '') + ' ' + (words[i+1] || '');
    const one = words[i];
    const mapping = keywords[two] || keywords[one];
    if (mapping) {
      if (mapping.field && typeof mapping.field === 'string') {
        if (mapping.field.startsWith('maternalHealth')) {
          data.visitType = 'Maternal';
          break;
        }
        if (mapping.field.startsWith('childHealth')) {
          data.visitType = 'Child';
          break;
        }
      }
    }
  }
  if (data.visitType === 'Maternal' && data.maternalHealth) {
    data.maternalHealth.isPregnant = 'हां';
  }

  const setNestedValue = (path, value) => {
    const keys = path.split('.');
    let obj = data;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in obj)) obj[keys[i]] = {};
      obj = obj[keys[i]];
    }
    const finalKey = keys[keys.length - 1];
    if (Array.isArray(obj[finalKey])) {
      if (!obj[finalKey].includes(value)) obj[finalKey].push(value);
    } else {
      obj[finalKey] = value;
    }
  };

  // 2) Dedicated AGE extraction (independent of generic keyword mapping)
  let detectedAge = null;
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (!ageCueTokens.has(w)) continue;
    const n = pickNearestAge(words, i);
    if (n != null && n >= 0 && n <= 120) {
      detectedAge = n;
      break;
    }
  }
  if (detectedAge != null) {
    // Put age in a consistent place in data model; adjust the field path as per your schema
    setNestedValue('demographics.age', detectedAge);
  }

  // 3) Dedicated NAME extraction using cues and strict token checks
  //    We search for name cues and extract nearby name tokens, avoiding "hai/hain"
  let fullName = '';
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (!nameCueTokens.has(w)) continue;
    const candidate = extractNameAroundCue(words, i);
    if (candidate) {
      fullName = candidate;
      break;
    }
  }

  // If no explicit cue, try a weak heuristic: look for two consecutive name-like tokens at start
  if (!fullName) {
    for (let i = 0; i < words.length - 1; i++) {
      const t1 = sanitizeToken(words[i]);
      const t2 = sanitizeToken(words[i+1]);
      if (looksLikeNameToken(t1) && looksLikeNameToken(t2)) {
        // Avoid capturing if either is an age word or numeric
        if (!ageCueTokens.has(t1) && !ageCueTokens.has(t2) && !isPureNumberToken(t1) && !isPureNumberToken(t2)) {
          fullName = `${t1} ${t2}`;
          break;
        }
      }
    }
  }

  if (fullName) {
    const { firstName, lastName } = splitName(fullName);
    setNestedValue('demographics.firstName', firstName);
    setNestedValue('demographics.lastName', lastName);
  }

  // 4) Phrase-aware general keyword mapping (unchanged logic, but we do not let it set name/age)
  for (let i = 0; i < words.length; i++) {
    const twoWordPhrase = words.slice(i, i + 2).join(' ');
    const oneWordPhrase = words[i];
    let mapping = null;
    let phraseLength = 0;

    if (keywords[twoWordPhrase]) {
      mapping = keywords[twoWordPhrase];
      phraseLength = 2;
    } else if (keywords[oneWordPhrase]) {
      mapping = keywords[oneWordPhrase];
      phraseLength = 1;
    }

    if (mapping) {
      // Skip interfering with demographics.name/age; those are handled above
      if (mapping.field && (mapping.field.includes('demographics.firstName') || mapping.field.includes('demographics.lastName') || mapping.field.includes('demographics.age'))) {
        continue;
      }

      let value;
      if (mapping.type === 'flag' || mapping.type === 'boolean') {
        value = mapping.value;
      } else if (mapping.isSuffix) {
        value = words[i - 1];
      } else {
        const valueIndex = i + phraseLength;
        let potentialValue = words[valueIndex];
        if (potentialValue && hindiStop.has(potentialValue)) {
          const lookAheadValue = words[valueIndex + 1];
          if (lookAheadValue && !hindiStop.has(lookAheadValue)) {
            potentialValue = lookAheadValue;
          }
        }
        value = potentialValue;
        if (mapping.type === 'number' && value) {
          const num = parseInt(toLatinDigits(value), 10);
          if (!isNaN(num)) value = num;
        }
      }

      if (value !== undefined && value !== null && value !== '') {
        setNestedValue(mapping.field, value);
        i += phraseLength - 1;
      }
    }
  }

  // console.log('--- PARSED DATA ---', data);
  return data;
}

export default parseHindiText;
