// We need to import the data template to use it here.
import getNewVisitDataTemplate from './dataTemplate';

function parseHindiText(text) {
  // Initialize our new, structured data object.
  const data = getNewVisitDataTemplate();
  const words = text.replace(/[.,]/g, '').toLowerCase().split(/\s+/);

  // --- 1. DEFINE KEYWORDS ---
  const keywords = {
    // ... (your keywords object remains the same) ...
    'नाम': { field: 'basicInfo.patientName', type: 'string' },
    'उम्र': { field: 'basicInfo.age', type: 'number' },
    'साल': { field: 'basicInfo.age', type: 'number', isSuffix: true },
    'लिंग': { field: 'basicInfo.gender', type: 'string' },
    'पता': { field: 'basicInfo.address', type: 'string' },
    'फोन': { field: 'basicInfo.phone', type: 'string' },
    'गर्भवती': { field: 'maternalHealth.isPregnant', type: 'boolean', value: 'Yes' },
    'पेट से': { field: 'maternalHealth.isPregnant', type: 'boolean', value: 'Yes' },
    'एलएमपी': { field: 'maternalHealth.lmpDate', type: 'string' },
    'एएनसी': { field: 'maternalHealth.ancVisits', type: 'number' },
    'बच्चा': { field: 'childHealth.childName', type: 'string' },
    'शिशु': { field: 'childHealth.childName', type: 'string' },
    'वजन': { field: 'childHealth.weight', type: 'string' },
    'टीका': { field: 'immunization.lastVaccine', type: 'string' },
    'दवाई': { field: 'treatment.medicineProvided', type: 'array' },
    'रेफर': { field: 'treatment.isReferred', type: 'boolean', value: 'Yes' },
    'बुखार': { field: 'generalHealth.currentSymptoms', type: 'array' },
    'खांसी': { field: 'generalHealth.currentSymptoms', type: 'array' },
    'कमजोरी': { field: 'generalHealth.currentSymptoms', type: 'array' },
  };

  // --- 2. DETERMINE VISIT TYPE ---
  if (words.includes('गर्भवती') || words.includes('पेट से')) {
    data.visitType = 'Maternal';
    data.maternalHealth.isPregnant = 'Yes';
  } else if (words.includes('बच्चा') || words.includes('शिशु')) {
    data.visitType = 'Child';
  }

  // --- 3. PARSE AND POPULATE DATA ---
  words.forEach((word, index) => {
    const mapping = keywords[word];
    if (!mapping) return;

    const setNestedValue = (path, value) => {
      const keys = path.split('.');
      let obj = data;
      for (let i = 0; i < keys.length - 1; i++) {
        obj = obj[keys[i]];
      }
      if (Array.isArray(obj[keys[keys.length - 1]])) {
        obj[keys[keys.length - 1]].push(value);
      } else {
        obj[keys[keys.length - 1]] = value;
      }
    };
    
    let value;
    if (mapping.type === 'boolean') {
      value = mapping.value;
    } else if (mapping.isSuffix) {
      value = words[index - 1];
    } else {
      value = words[index + 1];
    }

    if (mapping.type === 'number') {
        const num = parseInt(value, 10);
        if (!isNaN(num)) value = num;
    }

    if (value) {
      setNestedValue(mapping.field, value);
    }
  });

  console.log("--- NEW PARSED DATA ---", data);
  return data;
}

export default parseHindiText;