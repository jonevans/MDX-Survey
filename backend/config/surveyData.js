// Survey structure including questions, categories, and weights
const surveyData = {
  categories: [
    {
      id: "culture",
      name: "Culture",
      description: "How the organization embraces and prioritizes digital transformation",
      questions: [1, 2]
    },
    {
      id: "leadership",
      name: "Leadership",
      description: "How leadership views and supports digital initiatives",
      questions: [3, 4]
    },
    {
      id: "trainingLearning",
      name: "Training / Learning",
      description: "How the organization develops digital skills",
      questions: [5, 6]
    },
    {
      id: "budget",
      name: "Budget",
      description: "Financial support for digital transformation",
      questions: [7, 8]
    },
    {
      id: "recruitment",
      name: "Recruitment",
      description: "How the organization hires and retains digitally capable staff",
      questions: [9, 10]
    },
    {
      id: "projectManagement",
      name: "Project Management",
      description: "How digital projects are managed and executed",
      questions: [11, 12]
    },
    {
      id: "technologySystems",
      name: "Technology / Systems",
      description: "Integration and optimization of digital systems",
      questions: [13, 14]
    },
    {
      id: "data",
      name: "Data",
      description: "How data is gathered and utilized",
      questions: [15, 16]
    },
    {
      id: "reporting",
      name: "Reporting",
      description: "How performance metrics are defined and used",
      questions: [17, 18]
    }
  ],
  
  questions: [
    {
      id: 1,
      text: "Staff are open to change, eager to improve processes through technology, even if that change is difficult.",
      category: "culture",
      weightFactor: 1.8,
      notes: "How open is the staff, the employee base, to change? Are these forward thinking people.",
      improvementSuggestion: "needs change management, education, top down influence, better hiring practices"
    },
    {
      id: 2,
      text: "Digital Transformation is seen as key to success, and is prioritized at all levels of the organization.",
      category: "culture",
      weightFactor: 1.6,
      notes: "how proactive, are they eager, actively looking, prioritzing, does DX even matter to them?",
      improvementSuggestion: "education, influence leadership, focus on outcomes + goals"
    },
    {
      id: 3,
      text: "Leadership sees Digital Transformation as integral to the overall strategy, and recognizes the need to manage technology as an ongoing investment.",
      category: "leadership",
      weightFactor: 2.0,
      notes: "focuses on the leadership goals, the investment, the future focus",
      improvementSuggestion: "need a reality check. Need leadership education + influence. what's the culture/new hire look like?"
    },
    {
      id: 4,
      text: "Senior management, outside of IT, is directly and actively involved in defining, designing and implementing digital initiatives and understands their impact on the business.",
      category: "leadership",
      weightFactor: 1.4,
      notes: "the leadership doesn't see everything thru the lens of IT's problem. Tech and Digital are seen an integral to the growth and health of the org",
      improvementSuggestion: "leadership education and buy-in, need a reality check on the importance of DX"
    },
    {
      id: 5,
      text: "Learning new and improving existing digital skills is a priority for all teams and employees.",
      category: "trainingLearning",
      weightFactor: 1.2,
      notes: "ongoing training, a culture of progress and adaptation / adoption",
      improvementSuggestion: "mindset, training, education may be lacking, or stagnant workforce"
    },
    {
      id: 6,
      text: "Digital skills are measured and regularly examined to promote professional growth.",
      category: "trainingLearning",
      weightFactor: 1.0,
      notes: "the skills of the staff are measured and understood as important to the health of the org",
      improvementSuggestion: "Mindset. May not have occurred to them that this is important."
    },
    {
      id: 7,
      text: "Digital Transformation efforts are well supported by a healthy budget allowing for thorough vetting and planning prior to execution.",
      category: "budget",
      weightFactor: 1.8,
      notes: "proactively considered instead of reacting to circumstance. Break-fix thinking not strategy. Considers reductions as cost-savings instead of operational efficiency.",
      improvementSuggestion: "education on strategy, mindset. Proper budgeting and roadmapping"
    },
    {
      id: 8,
      text: "Investment in Digital Transformation efforts are utilized effectively, existing tools are used broadly and new use-cases are regularly considered.",
      category: "budget",
      weightFactor: 1.6,
      notes: "maximizing budgets, true enterprise thinking, long term and strategic. Break-fix thinking",
      improvementSuggestion: "education on strategy, education on existing tech and usage. Mindset."
    },
    {
      id: 9,
      text: "New hires are digitally capable. Job descriptions include relevant skills.",
      category: "recruitment",
      weightFactor: 1.6,
      notes: "are you getting the best most forward thinking people to drive your company into the future? Skilled. Or just filling seats",
      improvementSuggestion: "need better hiring practices, better, clearer job descriptions, hire tech forward candidates"
    },
    {
      id: 10,
      text: "Employee turnover is not an issue - new hires are generally retained.",
      category: "recruitment",
      weightFactor: 1.4,
      notes: "employee retention thru job satisfaction, is tech effecting turn over turn over costs you.",
      improvementSuggestion: "need to evaluate work force reasons for departure; tech frustration, stagnation, lack of learning opps, old tech"
    },
    {
      id: 11,
      text: "Projects are managed in an organized, agile methodology leading to efficient and timely delivery.",
      category: "projectManagement",
      weightFactor: 1.0,
      notes: "maximizes budgets, helps ensure success, not tossing money at problems",
      improvementSuggestion: "need agile training, need PM education/culture, possibly need PM staff, methodology"
    },
    {
      id: 12,
      text: "Successful projects have led to the organization achieving it's strategic objectives.",
      category: "projectManagement",
      weightFactor: 1.6,
      notes: "do your projects actually work and make real change? Are your projects even relevant to the org or the employee",
      improvementSuggestion: "need stakeholder involvement, need clearer goals, need more relevance to org goals"
    },
    {
      id: 13,
      text: "Systems and tools are integrated/interconnected providing a smooth and effective user experience.",
      category: "technologySystems",
      weightFactor: 1.4,
      notes: "Systems work together well, data flows easily",
      improvementSuggestion: "need technical assessment of systems interoperability, need easier data flows, UX, system architecture improvements"
    },
    {
      id: 14,
      text: "Opportunities to automate or optimize business processes are identified, assessed, and implemented.",
      category: "technologySystems",
      weightFactor: 1.6,
      notes: "active identification of opportunities, ability to see ways to improve and then execute",
      improvementSuggestion: "need process review, need tech review of current state, need systems assessment, look for opportunities to streamline work"
    },
    {
      id: 15,
      text: "Quality, integrated data is gathered across the organization and used to shape decisions and strategy.",
      category: "data",
      weightFactor: 1.8,
      notes: "uses data to drive decision making, key indicator of an org that knows what it is doing and where it's going",
      improvementSuggestion: "need data/analytics education, need strategy, need mindset shift to data-driven thinking, use KPIs better"
    },
    {
      id: 16,
      text: "Data management is a priority, and is a consideration with any project.",
      category: "data",
      weightFactor: 1.6,
      notes: "data seen as important asset, managed well, secured, used appropriately",
      improvementSuggestion: "need to educate on data importance, shift mindset, develop data management strategy/plan"
    },
    {
      id: 17,
      text: "Holistic performance data and KPIs are clearly defined, always available, and used strategically.",
      category: "reporting",
      weightFactor: 1.8,
      notes: "KPIs are defined, tracked, and shared. Used for strategic decisioning",
      improvementSuggestion: "need clear KPIs, need kpi communication strategies, need management education on data driven decisioning"
    },
    {
      id: 18,
      text: "KPIs are regularly evaluated for efficacy and are reformulated as new insights come to light.",
      category: "reporting",
      weightFactor: 1.6,
      notes: "does the org evolve with data? does it take new info into account and shift?",
      improvementSuggestion: "need to make KPIs more dynamic, need to educate on iterative improvements, need timely data capture and reflection"
    }
  ],
  
  scoring: {
    responseValues: {
      "Strongly Agree": 5,
      "Agree": 4,
      "No Opinion": 0,
      "Disagree": 2,
      "Strongly Disagree": 1
    },
    
    maturityLevels: [
      { level: "Absent", range: [0, 27], description: "Digital transformation is not occurring or is extremely limited" },
      { level: "Limited", range: [28, 55], description: "Basic digital transformation efforts, but lacking strategy and integration" },
      { level: "Emerging", range: [56, 77], description: "Digital transformation is underway with some structure, but not comprehensive" },
      { level: "Applied", range: [78, 98], description: "Digital transformation is well-established and integrated into operations" },
      { level: "Strategic", range: [99, 125], description: "Digital transformation is a strategic priority with strong implementation" },
      { level: "Innovative", range: [126, 135], description: "Digital transformation is a core competency, driving innovation and growth" }
    ]
  }
};

module.exports = surveyData;
