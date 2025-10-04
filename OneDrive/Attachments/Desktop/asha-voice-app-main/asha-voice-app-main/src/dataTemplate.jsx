// This function returns a new, empty data structure for a visit.
const getNewVisitDataTemplate = () => ({
  visitType: 'General', // Default type, can be changed to 'Maternal' or 'Child'
  
  basicInfo: {
    patientName: null,
    age: null,
    gender: null,
    address: null,
    mobile: null,
    visitDate: new Date().toLocaleDateString('en-IN'), // Automatically set today's date
  },

  maternalHealth: {
    isPregnant: null,
    lmpDate: null,
    edd: null,
    ancVisits: null,
    highRiskFactors: [],
  },

  childHealth: {
    childName: null,
    weight: null,
    isMalnourished: null,
    illnessSymptoms: [],
  },

  immunization: {
    lastVaccine: null,
    nextVaccineDate: null,
  },

  generalHealth: {
    familyMembers: null,
    chronicIllness: [],
    currentSymptoms: [],
  },

  treatment: {
    medicineProvided: [],
    isReferred: null,
    referralPlace: null,
    nextFollowUp: null,
  },

  familyPlanning: {
    contraceptionMethod: null,
  },
});

// Use 'export default' so App.jsx can import this function
export default getNewVisitDataTemplate;