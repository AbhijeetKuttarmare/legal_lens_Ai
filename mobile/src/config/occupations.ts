// Grouped so the picker can be a two-step "category, then occupation"
// flow instead of one long scrolling list of 30+ options.
export const OCCUPATION_CATEGORIES: { category: string; occupations: string[] }[] = [
  {
    category: 'Legal & Compliance',
    occupations: ['Lawyer / Legal Associate', 'Notary', 'Compliance Officer', 'Company Secretary'],
  },
  {
    category: 'Healthcare',
    occupations: ['Doctor', 'Clinic / Nursing Home Owner', 'Pharmacist'],
  },
  {
    category: 'Finance & Accounting',
    occupations: ['Chartered Accountant', 'Bank / Loan Officer', 'Insurance Agent', 'Auditor'],
  },
  {
    category: 'Real Estate & Construction',
    occupations: ['Real Estate Agent / Broker', 'Property Dealer', 'Architect', 'Civil Engineer', 'Contractor / Builder'],
  },
  {
    category: 'Business & Corporate',
    occupations: [
      'HR Manager',
      'Business Consultant',
      'Procurement Officer',
      'Recruitment Consultant',
      'Franchise Owner',
      'Import / Export Trader',
      'Startup / IT Founder',
      'Manufacturing Unit Owner',
    ],
  },
  {
    category: 'Government & Public Sector',
    occupations: ['Government / PSU Employee'],
  },
  {
    category: 'Media, Arts & Events',
    occupations: ['Journalist', 'Actor / Musician / Artist', 'Event Manager', 'Travel Agency Owner'],
  },
  {
    category: 'Education',
    occupations: ['School / College Administrator'],
  },
  {
    category: 'Other',
    occupations: ['Freelancer', 'Tenant', 'Job Seeker', 'Student', 'Other'],
  },
];
