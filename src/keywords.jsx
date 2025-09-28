const keywords = {
    // ========================================================================
    // ===== GLOBAL KEYWORDS (Always the same regardless of context) =====
    // ========================================================================
    'नाम': { field: 'basicInfo.patientName', type: 'string' },
    'नाम है': { field: 'basicInfo.patientName', type: 'string' },
    'उम्र': { field: 'basicInfo.age', type: 'number' },
    'साल': { field: 'basicInfo.age', type: 'number', isSuffix: true },
    'साल का': { field: 'basicInfo.age', type: 'number', isSuffix: true },
    'साल की': { field: 'basicInfo.age', type: 'number', isSuffix: true },
    'लिंग': { field: 'basicInfo.gender', type: 'string' },
    'पुरुष': { field: 'basicInfo.gender', type: 'boolean', value: 'पुरुष' },
    'महिला': { field: 'basicInfo.gender', type: 'boolean', value: 'महिला' },
    'पता': { field: 'basicInfo.address', type: 'string' },
    'फोन': { field: 'basicInfo.mobile', type: 'string' },
    'मोबाइल': { field: 'basicInfo.mobile', type: 'string' },
    'नंबर': { field: 'basicInfo.mobile', type: 'string' },
    'फोन नंबर': { field: 'basicInfo.mobile', type: 'string' },
    'मोबाइल नंबर': { field: 'basicInfo.mobile', type: 'string' },
    'कॉन्टैक्ट': { field: 'basicInfo.mobile', type: 'string' },
    'कॉन्टैक्ट नंबर': { field: 'basicInfo.mobile', type: 'string' },
    'संपर्क': { field: 'basicInfo.mobile', type: 'string' },
    'संपर्क नंबर': { field: 'basicInfo.mobile', type: 'string' },
    'दिनांक': { field: 'basicInfo.visitDate', type: 'string' },
    'तारीख': { field: 'basicInfo.visitDate', type: 'string' },
    'दवा': { field: 'treatment.medicineProvided', type: 'array' },
    'दवाई': { field: 'treatment.medicineProvided', type: 'array' },
    'गोली': { field: 'treatment.medicineProvided', type: 'array' },
    'पैरासिटामोल': { field: 'treatment.medicineProvided', type: 'flag', value: 'पैरासिटामोल' },
    'आयरन': { field: 'treatment.medicineProvided', type: 'flag', value: 'आयरन टैबलेट' },
    'कैल्शियम': { field: 'treatment.medicineProvided', type: 'flag', value: 'कैल्शियम' },
    'विटामिन': { field: 'treatment.medicineProvided', type: 'flag', value: 'विटामिन' },
    'ओआरएस': { field: 'treatment.medicineProvided', type: 'flag', value: 'ORS' },
    'रेफर': { field: 'treatment.isReferred', type: 'boolean', value: 'हां' },
    'अस्पताल': { field: 'treatment.isReferred', type: 'boolean', value: 'हां' },
    'फॉलोअप': { field: 'treatment.nextFollowUp', type: 'string' },
    'अगली मुलाकात': { field: 'treatment.nextFollowUp', type: 'string' },
    'अगली बार': { field: 'treatment.nextFollowUp', type: 'string' },
    'फिर आना': { field: 'treatment.nextFollowUp', type: 'string' },
    'दोबारा आना': { field: 'treatment.nextFollowUp', type: 'string' },
    'अगली तारीख': { field: 'treatment.nextFollowUp', type: 'string' },
    'अगले सप्ताह': { field: 'treatment.nextFollowUp', type: 'string' },
    'अगला मिलना': { field: 'treatment.nextFollowUp', type: 'string' },
    'अगला मिलन': { field: 'treatment.nextFollowUp', type: 'string' },
    'अगले महीने': { field: 'treatment.nextFollowUp', type: 'string' },
    

    // ========================================================================
    // ===== CONTEXT-AWARE KEYWORDS (Meaning changes based on patient type) =====
    // ========================================================================

    // --- Generic Visit Keywords ---
    'चेकअप': {
        field: {
            maternal: 'maternalHealth.ancVisits',
            child: 'childHealth.checkUpCount',
            general: 'generalHealth.visitCount'
        },
        type: 'number'
    },
    'जांच': {
        field: {
            maternal: 'maternalHealth.ancVisits',
            child: 'childHealth.checkUpCount',
            general: 'generalHealth.visitCount'
        },
        type: 'number'
    },
    'विजिट': {
        field: {
            maternal: 'maternalHealth.ancVisits',
            child: 'childHealth.checkUpCount',
            general: 'generalHealth.visitCount'
        },
        type: 'number'
    },
    'मुलाकात': {
        field: {
            maternal: 'maternalHealth.ancVisits',
            child: 'childHealth.checkUpCount',
            general: 'generalHealth.visitCount'
        },
        type: 'number'
    },
    'एएनसी': {
        field: {
            maternal: 'maternalHealth.ancVisits',
            child: 'childHealth.checkUpCount',
            general: 'generalHealth.visitCount'
        },
        type: 'number'
    },

    // --- Generic Measurement Keywords ---
    'वजन': {
        field: {
            maternal: 'maternalHealth.weight',
            child: 'childHealth.weight',
            general: 'generalHealth.weight'
        },
        type: 'string'
    },
    'किलो': {
        field: {
            maternal: 'maternalHealth.weight',
            child: 'childHealth.weight',
            general: 'generalHealth.weight'
        },
        type: 'string',
        isSuffix: true
    },
    'किलोग्राम': {
        field: {
            maternal: 'maternalHealth.weight',
            child: 'childHealth.weight',
            general: 'generalHealth.weight'
        },
        type: 'string',
        isSuffix: true
    },
    
    // --- Generic Symptom Keywords ---
    'बुखार': {
        field: {
            maternal: 'maternalHealth.symptoms',
            child: 'childHealth.illnessSymptoms',
            general: 'generalHealth.currentSymptoms'
        },
        type: 'flag',
        value: 'बुखार'
    },
    'खांसी': {
        field: {
            maternal: 'maternalHealth.symptoms',
            child: 'childHealth.illnessSymptoms',
            general: 'generalHealth.currentSymptoms'
        },
        type: 'flag',
        value: 'खांसी'
    },
    'कमजोरी': {
        field: {
            maternal: 'maternalHealth.symptoms',
            child: 'childHealth.illnessSymptoms',
            general: 'generalHealth.currentSymptoms'
        },
        type: 'flag',
        value: 'कमजोरी'
    },
    'दर्द': {
        field: {
            maternal: 'maternalHealth.symptoms',
            child: 'childHealth.illnessSymptoms',
            general: 'generalHealth.currentSymptoms'
        },
        type: 'flag',
        value: 'दर्द'
    },
    'उल्टी': {
        field: {
            maternal: 'maternalHealth.symptoms',
            child: 'childHealth.illnessSymptoms',
            general: 'generalHealth.currentSymptoms'
        },
        type: 'flag',
        value: 'उल्टी'
    },
    'सिरदर्द': {
        field: {
            maternal: 'maternalHealth.symptoms',
            child: 'childHealth.illnessSymptoms',
            general: 'generalHealth.currentSymptoms'
        },
        type: 'flag',
        value: 'सिरदर्द'
    },
    'पेटदर्द': {
        field: {
            maternal: 'maternalHealth.symptoms',
            child: 'childHealth.illnessSymptoms',
            general: 'generalHealth.currentSymptoms'
        },
        type: 'flag',
        value: 'पेटदर्द'
    },


    // ========================================================================
    // ===== CONTEXT-SPECIFIC KEYWORDS (Only apply in one context) =====
    // ========================================================================

    // --- Maternal Health Specific ---
    'गर्भवती': { field: { maternal: 'maternalHealth.isPregnant' }, type: 'boolean', value: 'हां' },
    'प्रेगनेंट': { field: { maternal: 'maternalHealth.isPregnant' }, type: 'boolean', value: 'हां' },
    'गर्भावस्था': { field: { maternal: 'maternalHealth.isPregnant' }, type: 'boolean', value: 'हां' },
    'लंप': { field: { maternal: 'maternalHealth.lmpDate' }, type: 'string' },
    'अंतिम माहवारी': { field: { maternal: 'maternalHealth.lmpDate' }, type: 'string' },
    'ऐड': { field: { maternal: 'maternalHealth.edd' }, type: 'string' },
    'डिलीवरी': { field: { maternal: 'maternalHealth.edd' }, type: 'string' },
    'प्रसव': { field: { maternal: 'maternalHealth.edd' }, type: 'string' },
    'उच्च रक्तचाप': { field: { maternal: 'maternalHealth.highRiskFactors', general: 'generalHealth.chronicIllness' }, type: 'flag', value: 'उच्च रक्तचाप' },
    'मधुमेह': { field: { maternal: 'maternalHealth.highRiskFactors', general: 'generalHealth.chronicIllness' }, type: 'flag', value: 'मधुमेह' },
    'एनीमिया': { field: { maternal: 'maternalHealth.highRiskFactors' }, type: 'flag', value: 'एनीमिया' },
    'खून की कमी': { field: { maternal: 'maternalHealth.highRiskFactors' }, type: 'flag', value: 'एनीमिया' },

    // --- Child Health Specific ---
    'बच्चा': { field: { child: 'childHealth.childName' }, type: 'string' },
    'शिशु': { field: { child: 'childHealth.childName' }, type: 'string' },
    'बेबी': { field: { child: 'childHealth.childName' }, type: 'string' },
    'कुपोषण': { field: { child: 'childHealth.isMalnourished' }, type: 'boolean', value: 'हां' },
    'कुपोषित': { field: { child: 'childHealth.isMalnourished' }, type: 'boolean', value: 'हां' },
    'डायरिया': { field: { child: 'childHealth.illnessSymptoms' }, type: 'flag', value: 'डायरिया' },
    'निमोनिया': { field: { child: 'childHealth.illnessSymptoms' }, type: 'flag', value: 'निमोनिया' },
    'सांस की तकलीफ': { field: { child: 'childHealth.illnessSymptoms' }, type: 'flag', value: 'सांस की तकलीफ' },

    // --- Immunization (Child Specific) ---
    'टीका': { field: { child: 'immunization.lastVaccine' }, type: 'string' },
    'टीका दिया': { field: { child: 'immunization.lastVaccine' }, type: 'string' },
    'टिका': { field: { child: 'immunization.lastVaccine' }, type: 'string' },
    'टिका दिया': { field: { child: 'immunization.lastVaccine' }, type: 'string' },
    'टीकाकरण': { field: { child: 'immunization.lastVaccine' }, type: 'string' },
    'वैक्सीन': { field: { child: 'immunization.lastVaccine' }, type: 'string' },
    'बीसीजी': { field: { child: 'immunization.vaccinesGiven' }, type: 'flag', value: 'BCG' },
    'डीपीटी': { field: { child: 'immunization.vaccinesGiven' }, type: 'flag', value: 'DPT' },
    'पोलियो': { field: { child: 'immunization.vaccinesGiven' }, type: 'flag', value: 'पोलियो' },
    'खसरा': { field: { child: 'immunization.vaccinesGiven' }, type: 'flag', value: 'खसरा' },
    'अगला टीका': { field: { child: 'immunization.nextVaccineDate' }, type: 'string' },
    'अगली वैक्सीन': { field: { child: 'immunization.nextVaccineDate' }, type: 'string' },

    // --- Family Planning (Maternal/General Specific) ---
    'परिवार नियोजन': { field: { maternal: 'familyPlanning.contraceptionMethod', general: 'familyPlanning.contraceptionMethod' }, type: 'string' },
    'कंडोम': { field: { maternal: 'familyPlanning.contraceptionMethod', general: 'familyPlanning.contraceptionMethod' }, type: 'boolean', value: 'कंडोम' },
    'कॉपर-टी': { field: { maternal: 'familyPlanning.contraceptionMethod', general: 'familyPlanning.contraceptionMethod' }, type: 'boolean', value: 'कॉपर-टी' },
    'नसबंदी': { field: { maternal: 'familyPlanning.contraceptionMethod', general: 'familyPlanning.contraceptionMethod' }, type: 'boolean', value: 'नसबंदी' },
    'गर्भनिरोधक': { field: { maternal: 'familyPlanning.contraceptionMethod', general: 'familyPlanning.contraceptionMethod' }, type: 'string' },
};

export default keywords;