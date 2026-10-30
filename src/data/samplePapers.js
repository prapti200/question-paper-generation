// Pre-configured rich educational sample papers & templates
export const DEFAULT_HEADER_CONFIG = {
  schoolName: "DELHI PUBLIC SCHOOL, R.K. PURAM",
  affiliation: "Affiliated to CBSE, New Delhi | Senior Secondary Examination",
  examTitle: "HALF YEARLY EXAMINATION (2025-2026)",
  subject: "SCIENCE (PHYSICS & CHEMISTRY)",
  subjectCode: "086",
  grade: "Class X - All Sections",
  facultyName: "Dr. Ananya Sharma (PGT Physics)",
  duration: "3 Hours",
  maxMarks: 80,
  autoCalculateMarks: true,
  logoUrl: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=160&q=80",
  showLogo: true,
  logoPosition: "left", // 'left', 'center', 'right'
  watermark: {
    enabled: true,
    type: "text", // 'text' | 'image'
    text: "DPS EXAMINATION",
    imageUrl: "",
    opacity: 0.08,
    angle: -30,
    fontSize: 48,
  },
  instructions: [
    "This question paper consists of 5 Sections: A, B, C, D and E with 39 questions in total.",
    "Section A consists of 20 Multiple Choice Questions (MCQs) carrying 1 mark each.",
    "Section B consists of 6 Very Short Answer / Fill in the Blanks questions carrying 2 marks each.",
    "Section C consists of 7 Short Answer type questions carrying 3 marks each.",
    "Section D consists of 3 Long Answer type questions carrying 5 marks each.",
    "Section E consists of 3 Case-based integrated units of assessment carrying 4 marks each with sub-parts.",
    "All questions are compulsory. Internal choices are provided in some questions.",
    "Use of log tables and calculators is strictly not permitted."
  ],
  studentFields: {
    showRollNo: true,
    showStudentName: true,
    showSection: true,
    showDate: true,
    showInvigilatorSign: true,
  }
};

export const INITIAL_SAMPLE_PAPER = {
  header: { ...DEFAULT_HEADER_CONFIG },
  sections: [
    {
      id: "sec-a",
      title: "SECTION A: OBJECTIVE & MULTIPLE CHOICE QUESTIONS",
      instruction: "Select the most appropriate option out of the four choices provided. (1 Mark each)",
      marksEach: 1,
      questions: [
        {
          id: "q-1",
          type: "mcq",
          question: "A ray of light traveling in air falls obliquely on the surface of water. Which of the following statements is TRUE about the path of light?",
          marks: 1,
          options: [
            "It will bend towards the normal because water is optically denser than air",
            "It will bend away from the normal because water is optically rarer than air",
            "It will continue without deviation in the same straight line",
            "It will be completely reflected back into air at all angles"
          ],
          correctAnswer: "It will bend towards the normal because water is optically denser than air",
          explanation: "Water is optically denser than air (refractive index ~1.33 vs ~1.00). Light slows down and bends towards the normal.",
          imageUrl: ""
        },
        {
          id: "q-2",
          type: "mcq",
          question: "When dilute hydrochloric acid (HCl) is added to granulated zinc in a test tube, which gas is evolved?",
          marks: 1,
          options: [
            "Oxygen gas which rekindles a glowing splint",
            "Hydrogen gas which burns with a characteristic pop sound",
            "Chlorine gas with a suffocating pungent odor",
            "Carbon dioxide gas which turns lime water milky"
          ],
          correctAnswer: "Hydrogen gas which burns with a characteristic pop sound",
          explanation: "Zn + 2HCl → ZnCl₂ + H₂↑. Hydrogen gas burns with a 'pop' sound.",
          imageUrl: ""
        },
        {
          id: "q-3",
          type: "mcq",
          question: "An object is placed at 2F₁ in front of a convex lens of focal length 15 cm. Where will the image be formed?",
          marks: 1,
          options: [
            "Between F₂ and 2F₂",
            "At 2F₂ on the other side of the lens",
            "Beyond 2F₂",
            "At infinity"
          ],
          correctAnswer: "At 2F₂ on the other side of the lens",
          explanation: "For a convex lens, when an object is placed at 2F (30 cm), a real, inverted, same-sized image is formed at 2F₂.",
          imageUrl: ""
        },
        {
          id: "q-4",
          type: "mcq",
          question: "Which of the following represents the correct order of increasing acidic strength?",
          marks: 1,
          options: [
            "Water < Acetic acid < Hydrochloric acid",
            "Water < Hydrochloric acid < Acetic acid",
            "Acetic acid < Water < Hydrochloric acid",
            "Hydrochloric acid < Water < Acetic acid"
          ],
          correctAnswer: "Water < Acetic acid < Hydrochloric acid",
          explanation: "Water is neutral (pH 7), Acetic acid is a weak organic acid, and Hydrochloric acid is a strong mineral acid.",
          imageUrl: ""
        }
      ]
    },
    {
      id: "sec-b",
      title: "SECTION B: FILL IN THE BLANKS & ONE-WORD QUESTIONS",
      instruction: "Fill in the blank spaces with suitable scientific terms or answer in one word. (1 Mark each)",
      marksEach: 1,
      questions: [
        {
          id: "q-5",
          type: "fill_blanks",
          question: "The power of a lens having a focal length of -50 cm is __________ dioptres.",
          marks: 1,
          blankAnswer: "-2 D",
          explanation: "P = 1 / f(in metres) = 1 / (-0.50 m) = -2 Dioptre.",
          imageUrl: ""
        },
        {
          id: "q-6",
          type: "fill_blanks",
          question: "The chemical formula of Plaster of Paris is __________.",
          marks: 1,
          blankAnswer: "CaSO₄·½H₂O",
          explanation: "Plaster of Paris is Calcium Sulphate Hemihydrate: CaSO₄·½H₂O.",
          imageUrl: ""
        },
        {
          id: "q-7",
          type: "one_word",
          question: "Name the light-sensitive screen at the back of the human eye upon which images are focused.",
          marks: 1,
          correctAnswer: "Retina",
          explanation: "The retina contains photoreceptors (rods and cones) and acts as the screen of the eye.",
          imageUrl: ""
        },
        {
          id: "q-8",
          type: "one_word",
          question: "What type of chemical reaction occurs when quicklime (calcium oxide) reacts vigorously with water?",
          marks: 1,
          correctAnswer: "Exothermic combination reaction",
          explanation: "CaO + H₂O → Ca(OH)₂ + Heat (Combination & Exothermic).",
          imageUrl: ""
        }
      ]
    },
    {
      id: "sec-c",
      title: "SECTION C: MATCH THE FOLLOWING",
      instruction: "Match the items in Column A with their correct counterparts in Column B. (4 Marks)",
      marksEach: 4,
      questions: [
        {
          id: "q-9",
          type: "match_following",
          question: "Match the following optical phenomena with their underlying causes:",
          marks: 4,
          columnA: [
            { id: "a1", text: "(i) Blue colour of clear sky" },
            { id: "a2", text: "(ii) Twinkling of stars" },
            { id: "a3", text: "(iii) Formation of rainbow" },
            { id: "a4", text: "(iv) Advanced sunrise & delayed sunset" }
          ],
          columnB: [
            { id: "b1", text: "(P) Atmospheric refraction through fluctuating air density" },
            { id: "b2", text: "(Q) Rayleigh scattering of shorter wavelengths" },
            { id: "b3", text: "(R) Atmospheric refraction by Earth's atmosphere" },
            { id: "b4", text: "(S) Dispersion, refraction, and internal reflection in raindrops" }
          ],
          correctMatching: [
            "(i) -> (Q)",
            "(ii) -> (P)",
            "(iii) -> (S)",
            "(iv) -> (R)"
          ],
          explanation: "Blue sky is due to Rayleigh scattering; star twinkling is due to fluctuating atmospheric refraction; rainbow is dispersion+TIR; sunrise advance is atmospheric refraction.",
          imageUrl: ""
        }
      ]
    },
    {
      id: "sec-d",
      title: "SECTION D: SHORT ANSWER QUESTIONS",
      instruction: "Answer each question in about 30 to 50 words. (3 Marks each)",
      marksEach: 3,
      questions: [
        {
          id: "q-10",
          type: "short_answer",
          question: "State Snell's Law of refraction of light. Write the mathematical formula and define the terms used.",
          marks: 3,
          modelAnswer: "Snell's Law states that the ratio of the sine of the angle of incidence to the sine of the angle of refraction is a constant for a light of a given colour and for a given pair of media. Formula: sin(i) / sin(r) = n₂₁ (where 'i' is the angle of incidence, 'r' is the angle of refraction, and 'n₂₁' is the refractive index of medium 2 with respect to medium 1).",
          markingRubric: "1 Mark for statement, 1 Mark for formula, 1 Mark for defining terms.",
          imageUrl: ""
        },
        {
          id: "q-11",
          type: "short_answer",
          question: "Why does an aqueous solution of an acid conduct electricity, whereas glucose solution does not?",
          marks: 3,
          modelAnswer: "An aqueous solution of an acid (like HCl) dissociates into free hydronium ions (H₃O⁺) and anions, which are charge carriers that allow electric current to flow. In contrast, glucose (C₆H₁₂O₆) is a covalent molecular compound that does not ionise in water, meaning no free ions are available to conduct electricity.",
          markingRubric: "1.5 Marks for explanation of acid ionisation, 1.5 Marks for glucose absence of ions.",
          imageUrl: ""
        }
      ]
    },
    {
      id: "sec-e",
      title: "SECTION E: LONG ANSWER & APPLICATION QUESTIONS",
      instruction: "Answer in detail (80 to 120 words) with diagrams wherever appropriate. (5 Marks each)",
      marksEach: 5,
      questions: [
        {
          id: "q-12",
          type: "long_answer",
          question: "A student unable to see distant objects clearly is diagnosed with myopia (near-sightedness).\n(a) State two possible causes of myopia.\n(b) With the help of neat ray diagrams, show: (i) the myopic eye, and (ii) its correction using a suitable lens.\n(c) If the far point of this person is 80 cm in front of the eye, calculate the focal length and power of the corrective lens required.",
          marks: 5,
          modelAnswer: "(a) Causes: (1) Excessive curvature of the eye lens (lens too thick), (2) Elongation of the eyeball.\n(b) Correction: A concave lens of suitable focal length is used to diverge incoming rays so they appear to come from the far point (80 cm).\n(c) Calculation: Object at infinity: u = -∞, Image at far point: v = -80 cm = -0.8 m.\nBy lens formula: 1/f = 1/v - 1/u => 1/f = 1/(-80) - 0 => f = -80 cm (-0.8 m).\nPower P = 1 / f(m) = 1 / (-0.8) = -1.25 D.",
          markingRubric: "1 Mark for causes; 2 Marks for accurate ray diagrams; 2 Marks for lens formula calculation and power unit.",
          imageUrl: ""
        }
      ]
    }
  ]
};

export const PRESET_TEMPLATES = [
  {
    id: "science-10",
    name: "CBSE Class 10 - Science Full Assessment",
    subject: "Science (Physics, Chemistry & Biology)",
    grade: "Class X",
    duration: "3 Hours",
    marks: 80,
    topic: "Light, Acids & Bases, Chemical Reactions, Life Processes",
    presetPaper: INITIAL_SAMPLE_PAPER
  },
  {
    id: "maths-10",
    name: "Class 10 Mathematics - Standard Unit Test",
    subject: "Mathematics",
    grade: "Class X",
    duration: "90 Minutes",
    marks: 40,
    topic: "Quadratic Equations, Arithmetic Progressions, Coordinate Geometry"
  },
  {
    id: "physics-12",
    name: "Class 12 Physics - Board Pre-Mock",
    subject: "Physics",
    grade: "Class XII",
    duration: "3 Hours",
    marks: 70,
    topic: "Electrostatics, Current Electricity, Magnetism & Wave Optics"
  },
  {
    id: "history-8",
    name: "Social Studies & History - Mid Term",
    subject: "Social Science",
    grade: "Class VIII",
    duration: "2 Hours",
    marks: 50,
    topic: "The Revolt of 1857, Indian Constitution, Resources & Development"
  }
];
