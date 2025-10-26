// Shared mantra categories used across MantraManagement and RecitationLogger
export const mantraCategories = {
  'Banis': {
    name: 'Banis',
    description: 'Daily prayers and complete compositions',
    subcategories: ['Japji Sahib', 'Jaap Sahib', 'Sukhmani Sahib', 'Rehras Sahib', 'Kirtan Sohila', 'Ardas'],
    defaultCount: 1
  },
  'Japji Paurees': {
    name: 'Japji Paurees',
    description: 'Individual verses from Japji Sahib',
    subcategories: ['Pauree 1', 'Pauree 2', 'Pauree 3', 'Pauree 4', 'Pauree 5', 'Pauree 6', 'Pauree 7', 'Pauree 8', 'Pauree 9', 'Pauree 10', 'Pauree 11', 'Pauree 12', 'Pauree 13', 'Pauree 14', 'Pauree 15', 'Pauree 16', 'Pauree 17', 'Pauree 18', 'Pauree 19', 'Pauree 20', 'Pauree 21', 'Pauree 22', 'Pauree 23', 'Pauree 24', 'Pauree 25', 'Pauree 26', 'Pauree 27', 'Pauree 28', 'Pauree 29', 'Pauree 30', 'Pauree 31', 'Pauree 32', 'Pauree 33', 'Pauree 34', 'Pauree 35', 'Pauree 36', 'Pauree 37', 'Slok'],
    defaultCount: 11
  },
  'Assorted Mantras': {
    name: 'Assorted Mantras',
    description: 'Individual mantras and simran',
    subcategories: ['Waheguru', 'Satnam', 'Ik Onkar', 'Guru Mantra', 'Mool Mantra', 'Other Simran'],
    defaultCount: 108
  }
};

// Daily Banis list
export const dailyBanis = [
  'Japji Sahib',
  'Jaap Sahib', 
  'Tav-Prasad Savaiye',
  'Chaupai Sahib',
  'Anand Sahib',
  'Rehras Sahib',
  'Kirtan Sohila',
  'Sukhmani Sahib',
  'Asa Di Var',
  'Ramkali Ki Var'
];

// Helper function to get default count based on category
export const getDefaultCountForMantra = (mantraName: string): number => {
  // Check if it's a daily bani
  if (dailyBanis.includes(mantraName)) return 1;
  
  // Check if it's a Japji Pauree
  if (mantraCategories['Japji Paurees'].subcategories.includes(mantraName)) return 11;
  
  // Check if it's an assorted mantra
  if (mantraCategories['Assorted Mantras'].subcategories.includes(mantraName)) return 108;
  
  // Check main categories
  for (const [mainCat, config] of Object.entries(mantraCategories)) {
    if (mantraName === mainCat) return config.defaultCount;
  }
  
  return 108; // Default fallback
};

// Helper function to get all category names
export const getAllCategories = () => Object.keys(mantraCategories);

// Helper function to get all subcategories for dropdown population
export const getAllSubcategories = () => {
  const allSubcategories: string[] = [];
  Object.values(mantraCategories).forEach(config => {
    allSubcategories.push(...config.subcategories);
  });
  return allSubcategories;
};