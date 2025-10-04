import getNewVisitDataTemplate from './dataTemplate';
import keywords from './keywords';

// Devanagari to Latin digit conversion
const devanagariDigits = { 
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4', 
  '५': '5', '६': '6', '७': '7', '८': '8', '९': '9' 
};

// Word to number mapping for Hindi
const wordNumberMap = {
  'शून्य': 0, 'एक': 1, 'दो': 2, 'तीन': 3, 'चार': 4, 'पांच': 5, 'पाँच': 5, 
  'छह': 6, 'सात': 7, 'आठ': 8, 'नौ': 9, 'दस': 10,
  'ग्यारह': 11, 'बारह': 12, 'तेरह': 13, 'चौदह': 14, 'पंद्रह': 15, 'पन्द्रह': 15, 
  'सोलह': 16, 'सत्रह': 17, 'अठारह': 18, 'उन्नीस': 19,
  'बीस': 20, 'इक्कीस': 21, 'बाइस': 22, 'बाईस': 22, 'तेईस': 23, 'चौबीस': 24, 
  'पच्चीस': 25, 'छब्बीस': 26, 'सत्ताईस': 27, 'अट्ठाईस': 28, 'अट्ठाइस': 28, 'उनतीस': 29,
  'तीस': 30, 'इकतीस': 31, 'बत्तीस': 32, 'तेतीस': 33, 'चौतीस': 34, 'पैंतीस': 35, 
  'छ्त्तीस': 36, 'छत्तीस': 36, 'सैंतीस': 37, 'अड़तीस': 38, 'अड़तालीस': 48,
  'उनतालीस': 39, 'चालीस': 40, 'पैंतालीस': 45, 'पचास': 50, 'साठ': 60, 
  'सत्तर': 70, 'अस्सी': 80, 'नब्बे': 90, 'सौ': 100
};

// Helper function to convert Devanagari numerals to Latin
function convertDevanagariNumerals(text) {
  return text.replace(/[०-९]/g, digit => devanagariDigits[digit] || digit);
}

// Helper function to normalize text for processing
function normalizeText(text) {
  if (!text || typeof text !== 'string') return '';
  
  // Convert Devanagari numerals to Latin
  let normalized = convertDevanagariNumerals(text);
  
  // Remove extra whitespace and normalize
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  // Convert to lowercase for case-insensitive matching
  return normalized.toLowerCase();
}

// Helper function to extract number from text
function extractNumber(text) {
  if (!text) return null;
  
  // First try to parse as direct number
  const directNumber = parseInt(text, 10);
  if (!isNaN(directNumber)) return directNumber;
  
  // Try word-to-number mapping
  const wordNumber = wordNumberMap[text];
  if (wordNumber !== undefined) return wordNumber;
  
  return null;
}

// Main parsing function using targeted regex patterns
function parseHindiText(text, visitType = 'General') {
  const data = getNewVisitDataTemplate();
  
  if (!text || typeof text !== 'string') {
    console.warn('parseHindiText received invalid input:', text);
    return data;
  }

  // Set visit type
  data.visitType = visitType;
  
  // Normalize the input text
  const normalizedText = normalizeText(text);
  console.log('Normalized text:', normalizedText);

  // 1. PATIENT NAME EXTRACTION
  // Pattern: नाम [name] है/और/उम्र/पता/मोबाइल - Enhanced for your example
  const namePatterns = [
    // Enhanced pattern for your example: "मेरा नाम Danish है"
    /(?:मेरा|मेरे|मेरी)\s+नाम\s+([\u0900-\u097F\s]+?)(?=\s+है|\s+और|\s+उम्र|\s+पता|\s+मोबाइल|\s+फोन|$)/i,
    /(?:नाम|नाम है|पेशेंट का नाम|रोगी का नाम)\s+([\u0900-\u097F\s]+?)(?=\s+है|\s+और|\s+उम्र|\s+पता|\s+मोबाइल|\s+फोन|$)/i,
    /([\u0900-\u097F]+)\s+(?:का|की)\s+नाम/i,
    // Additional patterns for mixed language names
    /(?:मेरा|मेरे|मेरी)\s+नाम\s+([a-zA-Z\s]+?)(?=\s+है|\s+और|\s+उम्र|$)/i
  ];
  
  for (const pattern of namePatterns) {
    const match = normalizedText.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim().replace(/\s+/g, ' ');
      // Filter out common Hindi words that might be captured
      if (!['है', 'हैं', 'था', 'थी', 'थे', 'साल', 'उम्र', 'पता', 'मोबाइल', 'फोन'].includes(name)) {
        data.basicInfo.patientName = name;
        console.log('Extracted name:', name);
        break;
      }
    }
  }

  // 2. AGE EXTRACTION
  // Pattern: उम्र/आयु [number] साल/वर्ष/की है - Enhanced for your example
  const agePatterns = [
    // Enhanced pattern for your example: "मेरी उम्र 20 साल है"
    /(?:मेरी|मेरे)\s+उम्र\s*(\d+)(?:\s*(?:साल|वर्ष|की|है))?/i,
    /(?:उम्र|आयु)\s*(\d+)(?:\s*(?:साल|वर्ष|की|है))?/i,
    /(\d+)\s*(?:साल|वर्ष)(?:\s*(?:का|की|है))?/i,
    /(?:साल|वर्ष)\s*(\d+)/i
  ];
  
  for (const pattern of agePatterns) {
    const match = normalizedText.match(pattern);
    if (match && match[1]) {
      const age = parseInt(match[1], 10);
      if (age >= 0 && age <= 120) {
        data.basicInfo.age = age.toString();
        console.log('Extracted age:', age);
        break;
      }
    }
  }

  // 3. MOBILE NUMBER EXTRACTION
  // Pattern: मोबाइल/फोन नंबर [10-11 digits] - Enhanced for your example
  const mobilePatterns = [
    // Hindi patterns - Enhanced for your example: "मेरा फ़ोन नंबर 11222323333 है"
    /(?:मेरा|मेरे|मेरी)\s*(?:फोन|मोबाइल|फ़ोन)\s*(?:नंबर)?\s*(\d{10,11})/i,
    /(?:फोन|मोबाइल|फ़ोन)\s*(?:नंबर)?\s*(\d{10,11})/i,
    /(?:संपर्क|कॉन्टैक्ट)\s*(?:नंबर)?\s*(\d{10,11})/i,
    // Fallback patterns
    /(\d{10,11})/g // Fallback: any 10-11 digit number
  ];
  
  for (const pattern of mobilePatterns) {
    const match = normalizedText.match(pattern);
    if (match && match[1]) {
      let mobile = match[1];
      // Handle 11-digit numbers (remove leading country code if present)
      if (mobile.length === 11 && mobile.startsWith('1')) {
        mobile = mobile.substring(1); // Remove leading '1' for Indian numbers
      }
      // Validate it's a proper 10-digit number
      if (mobile.length === 10 && /^\d{10}$/.test(mobile)) {
        data.basicInfo.mobile = mobile;
        console.log('Extracted mobile:', mobile);
        break;
      }
    }
  }

  // 4. ADDRESS EXTRACTION
  // Pattern: पता/एड्रेस [address text]
  const addressPatterns = [
    /(?:पता|एड्रेस|घर)\s+([^,]+?)(?=\s+है|,|$)/i,
    /(?:रहता|रहती)\s+([^,]+?)(?=\s+में|\s+पर|,|$)/i
  ];
  
  for (const pattern of addressPatterns) {
    const match = normalizedText.match(pattern);
    if (match && match[1]) {
      const address = match[1].trim();
      if (address.length > 2) {
        data.basicInfo.address = address;
        console.log('Extracted address:', address);
        break;
      }
    }
  }

  // 5. GENDER EXTRACTION
  // Pattern: पुरुष/महिला/स्त्री/औरत
  const genderPatterns = [
    /(?:पुरुष|मर्द|आदमी)/i,
    /(?:महिला|स्त्री|औरत|नारी)/i
  ];
  
  for (const pattern of genderPatterns) {
    const match = normalizedText.match(pattern);
    if (match) {
      data.basicInfo.gender = match[0];
      console.log('Extracted gender:', match[0]);
      break;
    }
  }

  // 6. SYMPTOMS EXTRACTION
  // Pattern: Look for symptom keywords throughout the text
  const symptomKeywords = [
    'बुखार', 'खांसी', 'सर्दी', 'दस्त', 'कमजोरी', 'सिर दर्द', 'पेट दर्द', 
    'उल्टी', 'मतली', 'सांस की तकलीफ', 'छाती में दर्द', 'जोड़ों में दर्द',
    'थकान', 'नींद न आना', 'भूख न लगना', 'प्यास लगना', 'बेचैनी'
  ];
  
  const foundSymptoms = [];
  for (const symptom of symptomKeywords) {
    const pattern = new RegExp(symptom, 'gi');
    if (pattern.test(normalizedText)) {
      foundSymptoms.push(symptom);
    }
  }
  
  if (foundSymptoms.length > 0) {
    data.generalHealth.currentSymptoms = foundSymptoms;
    console.log('Extracted symptoms:', foundSymptoms);
  }

  // 7. MEDICINE EXTRACTION
  // Pattern: दवा/दवाई [medicine name]
  const medicineKeywords = [
    'पैरासिटामोल', 'आयरन', 'कैल्शियम', 'विटामिन', 'ओआरएस', 'एंटीबायोटिक',
    'गोली', 'टैबलेट', 'सिरप', 'इंजेक्शन'
  ];
  
  const foundMedicines = [];
  for (const medicine of medicineKeywords) {
    const pattern = new RegExp(medicine, 'gi');
    if (pattern.test(normalizedText)) {
      foundMedicines.push(medicine);
    }
  }
  
  if (foundMedicines.length > 0) {
    data.treatment.medicineProvided = foundMedicines;
    console.log('Extracted medicines:', foundMedicines);
  }

  // 8. REFERRAL EXTRACTION
  // Pattern: रेफर/अस्पताल भेजना
  const referralPatterns = [
    /(?:रेफर|भेजना|अस्पताल|डॉक्टर)/i
  ];
  
  for (const pattern of referralPatterns) {
    const match = normalizedText.match(pattern);
    if (match) {
      data.treatment.isReferred = 'हां';
      console.log('Extracted referral:', match[0]);
      break;
    }
  }

  // 9. FOLLOW-UP EXTRACTION
  // Pattern: अगली मुलाकात/फॉलोअप [date/time]
  const followUpPatterns = [
    /(?:अगली मुलाकात|फॉलोअप|अगली बार|फिर आना|दोबारा आना)\s+([^,]+?)(?=,|$)/i,
    /(?:अगले सप्ताह|अगले महीने|अगली तारीख)/i
  ];
  
  for (const pattern of followUpPatterns) {
    const match = normalizedText.match(pattern);
    if (match) {
      data.treatment.nextFollowUp = match[1] || match[0];
      console.log('Extracted follow-up:', match[1] || match[0]);
      break;
    }
  }

  // 10. VISIT TYPE DETECTION
  // Check for maternal/child specific keywords
  const maternalKeywords = ['गर्भवती', 'प्रेगनेंट', 'गर्भावस्था', 'लंप', 'एएनसी'];
  const childKeywords = ['बच्चा', 'शिशु', 'बेबी', 'कुपोषण', 'टीका', 'वैक्सीन'];
  
  for (const keyword of maternalKeywords) {
    if (normalizedText.includes(keyword)) {
      data.visitType = 'Maternal';
      data.maternalHealth.isPregnant = 'हां';
      console.log('Detected maternal visit');
      break;
    }
  }

  if (data.visitType === 'General') {
    for (const keyword of childKeywords) {
      if (normalizedText.includes(keyword)) {
        data.visitType = 'Child';
        console.log('Detected child visit');
          break;
      }
    }
  }

  // 11. MATERNAL HEALTH SPECIFIC EXTRACTION
  if (data.visitType === 'Maternal') {
    // ANC Visits
    const ancPattern = /(?:एएनसी|चेकअप|जांच)\s*(\d+)/i;
    const ancMatch = normalizedText.match(ancPattern);
    if (ancMatch) {
      data.maternalHealth.ancVisits = ancMatch[1];
    }

    // Weight
    const weightPattern = /वजन\s*(\d+(?:\.\d+)?)\s*(?:किलो|किलोग्राम)?/i;
    const weightMatch = normalizedText.match(weightPattern);
    if (weightMatch) {
      data.maternalHealth.weight = weightMatch[1];
    }
  }

  // 12. CHILD HEALTH SPECIFIC EXTRACTION
  if (data.visitType === 'Child') {
    // Child name
    const childNamePattern = /(?:बच्चा|शिशु|बेबी)\s+([\u0900-\u097F\s]+?)(?=\s+है|\s+और|\s+उम्र|$)/i;
    const childNameMatch = normalizedText.match(childNamePattern);
    if (childNameMatch) {
      data.childHealth.childName = childNameMatch[1].trim();
    }

    // Weight
    const weightPattern = /वजन\s*(\d+(?:\.\d+)?)\s*(?:किलो|किलोग्राम)?/i;
    const weightMatch = normalizedText.match(weightPattern);
    if (weightMatch) {
      data.childHealth.weight = weightMatch[1];
    }

    // Malnutrition
    if (normalizedText.includes('कुपोषण') || normalizedText.includes('कुपोषित')) {
      data.childHealth.isMalnourished = 'हां';
    }
  }

  console.log('Final parsed data:', data);
  return data;
}

export default parseHindiText;