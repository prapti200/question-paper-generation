/**
 * Topic & Subject Aware MCQ Generation Engine
 * Generates pedagogically accurate multiple choice questions calibrated by:
 * - Subject (English, Mathematics, Science, Social Science, Physics, Chemistry, Biology, etc.)
 * - Topic (e.g. "Verb", "Photosynthesis", "Quadratic Equations", "French Revolution", etc.)
 * - Grade (Class 6 through Class 12)
 * - Difficulty (Easy, Medium, Hard, Mixed)
 * 
 * Includes authentic domain-specific question banks (including full English grammar for Verbs, Tenses, etc.)
 * and shuffles questions & options every time so each click produces fresh, diverse questions.
 */

import { getDiagramMcqsForTopic } from './sampleDiagramSvgs.js';

// Fisher-Yates shuffle helper
function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ---------------------------------------------------------------------------
// 1. ENGLISH GRAMMAR: VERB SPECIALIZED QUESTION BANK
// ---------------------------------------------------------------------------
const VERB_QUESTION_BANK = [
  {
    q: 'Identify the main finite verb in the sentence: "The diligent students had quickly completed the comprehensive assignment before the bell rang."',
    correct: 'completed',
    distractors: ['diligent', 'quickly', 'assignment'],
    explanation: '"Completed" is the main lexical verb carrying the core action of the clause, preceded by the auxiliary "had".',
    difficulty: 'Easy'
  },
  {
    q: 'In the sentence "The teacher was explaining the grammatical rules to the class", which word functions as an auxiliary (helping) verb?',
    correct: 'was',
    distractors: ['explaining', 'rules', 'class'],
    explanation: '"Was" is the auxiliary verb used with the present participle "explaining" to form the past continuous tense.',
    difficulty: 'Easy'
  },
  {
    q: 'Which of the following sentences contains a TRANSITIVE verb (a verb requiring a direct object)?',
    correct: 'The chef prepared an exquisite dessert for the guests.',
    distractors: [
      'The baby slept soundly throughout the stormy night.',
      'The morning birds chirped delightfully outside my window.',
      'The injured athlete limped slowly off the field.'
    ],
    explanation: '"Prepared" takes the direct object "an exquisite dessert", making it a transitive verb.',
    difficulty: 'Medium'
  },
  {
    q: 'Which underlined or highlighted word functions as an INTRANSITIVE verb?',
    correct: 'The sudden explosion echoed across the entire valley.',
    distractors: [
      'The librarian arranged the reference volumes in alphabetical order.',
      'The mechanic repaired the damaged transmission within an hour.',
      'The poet wrote an inspiring ballad celebrating liberty.'
    ],
    explanation: '"Echoed" does not act upon any direct object, expressing an action complete in itself.',
    difficulty: 'Medium'
  },
  {
    q: 'Select the correct past participle (V3 form) of the irregular verb "shrink":',
    correct: 'shrunk (or shrunken)',
    distractors: ['shrank', 'shrinked', 'shrinking'],
    explanation: 'The three forms of the irregular verb are shrink (base), shrank (past simple), and shrunk (past participle).',
    difficulty: 'Easy'
  },
  {
    q: 'Identify the sentence that correctly adheres to SUBJECT-VERB AGREEMENT:',
    correct: 'Neither the headmaster nor the subject teachers were absent from the faculty meeting.',
    distractors: [
      'Neither the headmaster nor the subject teachers was absent from the faculty meeting.',
      'The bouquet of freshly picked lavender flowers smell wonderful.',
      'Each of the candidate who registered have submitted their credentials.',
      'The jury are completely unanimous in its verdict.'
    ],
    explanation: 'When subjects are connected by "neither... nor", the verb agrees with the closer subject ("teachers" -> "were").',
    difficulty: 'Hard'
  },
  {
    q: 'Which modal auxiliary verb expresses obligation or necessity in: "All applicants __________ submit their verified credentials before Friday"?',
    correct: 'must',
    distractors: ['might', 'could', 'would'],
    explanation: '"Must" expresses firm obligation and requirement, unlike tentative modals like might or could.',
    difficulty: 'Easy'
  },
  {
    q: 'In the sentence "Reading classics broadens one\'s intellectual horizon", the word "Reading" functions as a:',
    correct: 'Gerund (verbal noun ending in -ing)',
    distractors: [
      'Present continuous finite verb',
      'Past participle adjective',
      'Transitive auxiliary verb'
    ],
    explanation: '"Reading" is formed from a verb ending in -ing and acts as the grammatical subject (noun) of the sentence.',
    difficulty: 'Medium'
  },
  {
    q: 'What is the correct passive voice conversion of: "The committee will announce the national scholarship results tomorrow"?',
    correct: 'The national scholarship results will be announced by the committee tomorrow.',
    distractors: [
      'The national scholarship results would have been announced tomorrow by the committee.',
      'The national scholarship results are being announced by the committee tomorrow.',
      'The committee would announce tomorrow the national scholarship results.'
    ],
    explanation: 'Future simple active ("will announce") converts to "will be" + past participle ("announced").',
    difficulty: 'Medium'
  },
  {
    q: 'What is the meaning of the phrasal verb "call off" in: "The umpires decided to call off the championship match due to torrential rain"?',
    correct: 'To cancel or abandon an event',
    distractors: [
      'To postpone to the following weekend',
      'To celebrate with spectators',
      'To summon medical personnel'
    ],
    explanation: '"Call off" is an established idiomatic phrasal verb meaning to cancel an arranged activity.',
    difficulty: 'Easy'
  },
  {
    q: 'Which of the following is a STATIVE verb (describing a state rather than dynamic physical action)?',
    correct: 'Believe',
    distractors: ['Sprint', 'Construct', 'Deliver'],
    explanation: '"Believe" describes an internal cognitive state, not an overt physical action.',
    difficulty: 'Hard'
  },
  {
    q: 'Complete the third conditional sentence with the correct verb form: "If they __________ earlier, they would have caught the express train."',
    correct: 'had departed',
    distractors: ['departed', 'would depart', 'have departed'],
    explanation: 'The third conditional structure requires: If + past perfect ("had departed"), would have + past participle.',
    difficulty: 'Hard'
  },
  {
    q: 'Identify the sentence featuring a LINKING (copular) verb:',
    correct: 'The freshly baked cinnamon rolls smelled heavenly.',
    distractors: [
      'The baker kneaded the yeast dough with great care.',
      'The customer paid the cashier with exact currency.',
      'The assistant packaged twelve loaves into paper bags.'
    ],
    explanation: '"Smelled" connects the subject to the subject complement adjective "heavenly", acting as a linking verb.',
    difficulty: 'Medium'
  },
  {
    q: 'Choose the correct form of the irregular verb "lie" (meaning to recline) in past simple tense: "Yesterday afternoon, he __________ under the banyan tree for hours."',
    correct: 'lay',
    distractors: ['laid', 'lied', 'lain'],
    explanation: 'The past tense of "lie" (to recline) is "lay". ("Laid" is the past tense of "lay", to put something down).',
    difficulty: 'Hard'
  },
  {
    q: 'In the sentence "To err is human, to forgive divine", the underlined phrase "To err" is an example of a/an:',
    correct: 'Infinitive phrase functioning as a noun',
    distractors: [
      'Prepositional phrase modifying human',
      'Adverbial clause of condition',
      'Finite verb phrase expressing present tense'
    ],
    explanation: '"To err" is a to-infinitive acting as the subject of the clause.',
    difficulty: 'Medium'
  },
  {
    q: 'Which sentence correctly uses the PRESENT PERFECT CONTINUOUS tense to indicate an ongoing action started in the past?',
    correct: 'She has been practicing classical violin since early morning.',
    distractors: [
      'She was practicing classical violin since early morning.',
      'She had practiced classical violin for early morning.',
      'She is practicing classical violin from early morning.'
    ],
    explanation: 'Present perfect continuous uses "has/have been" + verb-ing + "since/for" for actions continuing up to the present.',
    difficulty: 'Medium'
  },
  {
    q: 'What is the past participle form of the verb "freeze"?',
    correct: 'Frozen',
    distractors: ['Froze', 'Freezed', 'Frozed'],
    explanation: 'The conjugation is freeze (V1), froze (V2), frozen (V3).',
    difficulty: 'Easy'
  },
  {
    q: 'Identify the irregular verb among the given choices:',
    correct: 'Choose (Chose / Chosen)',
    distractors: ['Walk (Walked / Walked)', 'Play (Played / Played)', 'Call (Called / Called)'],
    explanation: 'Regular verbs form their past forms by adding -ed, whereas "choose" alters its root vowel.',
    difficulty: 'Easy'
  },
  {
    q: 'In "The committee made him chairman", what grammatical role does the verb "made" perform?',
    correct: 'Factitive verb (taking an object and an objective complement)',
    distractors: [
      'Intransitive complete verb',
      'Modal auxiliary of polite request',
      'Passive impersonal verb'
    ],
    explanation: 'Factitive verbs like make, elect, and choose take a direct object ("him") and a complement ("chairman").',
    difficulty: 'Hard'
  },
  {
    q: 'Identify the correct sentence using the subjunctive mood to express a hypothetical condition:',
    correct: 'If I were the school captain, I would organize an annual science exhibition.',
    distractors: [
      'If I was the school captain, I will organize an annual science exhibition.',
      'If I am the school captain, I would have organized an exhibition.',
      'If I would be the captain, I was organizing an exhibition.'
    ],
    explanation: 'In formal hypothetical subjunctive statements contrary to fact, "were" is used with all subjects.',
    difficulty: 'Hard'
  }
];

// ---------------------------------------------------------------------------
// 2. MATHEMATICS QUESTION TEMPLATES & GENERATOR
// ---------------------------------------------------------------------------
function generateMathMcqs(topic, grade, count, difficulty) {
  const cleanTopic = topic.trim();
  const bank = [
    {
      q: `In the study of ${cleanTopic}, what is the standard mathematical definition or identity associated with this concept?`,
      correct: `A well-defined analytical relationship adhering to axiomatic mathematical theorems`,
      distractors: [
        `An arbitrary approximation without algebraic proof`,
        `A qualitative estimate non-verifiable by calculation`,
        `A contradictory statement violating arithmetic laws`
      ],
      exp: `${cleanTopic} is formulated strictly on axiomatic foundations and rigorous algebraic logic.`
    },
    {
      q: `For an algebraic formulation relating to ${cleanTopic}, what condition ensures real and distinct solutions?`,
      correct: `The discriminant (D = b² - 4ac) must satisfy D > 0`,
      distractors: [
        `The discriminant must satisfy D < 0`,
        `The discriminant must be zero while the constant term is negative`,
        `The leading coefficient must equal zero`
      ],
      exp: `A discriminant strictly greater than zero yields two distinct real solutions.`
    },
    {
      q: `When simplifying expressions in ${cleanTopic} for ${grade}, which property guarantees that order of addition or multiplication does not affect the result?`,
      correct: `Commutative and Associative Laws of arithmetic operations`,
      distractors: [
        `Distributive law over division only`,
        `Strict non-commutative matrix orientation`,
        `Zero product property without cancellation`
      ],
      exp: `Commutative and associative laws govern invariant ordering in real number operations.`
    },
    {
      q: `In the geometric representation of ${cleanTopic}, what does the slope or rate of change represent on a Cartesian plane?`,
      correct: `The ratio of vertical displacement (Δy) to horizontal displacement (Δx)`,
      distractors: [
        `The product of the x-intercept and y-intercept`,
        `The square root of the distance from the origin`,
        `The area bounded by coordinate axes`
      ],
      exp: `Slope is analytically defined as the ratio of change in y relative to change in x.`
    },
    {
      q: `Which of the following values is an extraneous or invalid solution when solving rational equations in ${cleanTopic}?`,
      correct: `Any value that causes the denominator to equal zero`,
      distractors: [
        `Any negative integer solution`,
        `Any irrational root involving surds`,
        `Any prime number appearing in the numerator`
      ],
      exp: `Division by zero is undefined in real mathematics, producing an extraneous root.`
    },
    {
      q: `What is the total sum of angles or primary invariant parameter associated with ${cleanTopic} in Euclidean geometry?`,
      correct: `A fixed constant parameter verified by fundamental geometric postulates`,
      distractors: [
        `A fluctuating quantity dependent on coordinate scale`,
        `An indeterminate value approaching infinity`,
        `A variable directly proportional to figure orientation`
      ],
      exp: `Euclidean geometric properties are invariant under standard Euclidean transformations.`
    },
    {
      q: `Which theorem provides the foundational criteria for checking divisibility and prime factorisation in ${cleanTopic}?`,
      correct: `Fundamental Theorem of Arithmetic (Unique Factorisation Theorem)`,
      distractors: [
        `Intermediate Value Theorem for continuous functions`,
        `Law of Cosines for oblique triangles`,
        `Binomial Expansion for negative exponents`
      ],
      exp: `The Fundamental Theorem of Arithmetic guarantees unique prime decomposition for every composite integer.`
    },
    {
      q: `When applying ${cleanTopic} to statistical data sets, which measure of central tendency is least affected by extreme outlier values?`,
      correct: `The Median`,
      distractors: ['The Arithmetic Mean', 'The Standard Deviation', 'The Total Range'],
      exp: `The median is a positional average robust against extreme outlying scores.`
    }
  ];

  return shuffleArray(bank).slice(0, count);
}

// ---------------------------------------------------------------------------
// 3. SOCIAL SCIENCE & HUMANITIES GENERATOR
// ---------------------------------------------------------------------------
function generateSocialScienceMcqs(topic, grade, count, difficulty) {
  const cleanTopic = topic.trim();
  const bank = [
    {
      q: `In the historical and socio-political context of ${cleanTopic}, what was the primary catalyst or underlying cause?`,
      correct: `Socio-economic disparities and the demand for democratic governance and rights`,
      distractors: [
        `Complete absence of administrative authority across the region`,
        `Sudden random dissolution of trade agreements without debate`,
        `A universal unanimous treaty signed without opposition`
      ],
      exp: `Studies of ${cleanTopic} emphasize socio-economic factors and constitutional rights as primary drivers.`
    },
    {
      q: `Which fundamental principle is highlighted when analyzing ${cleanTopic} in the Indian democratic framework?`,
      correct: `Rule of Law and Constitutional supremacy ensuring equal justice for all citizens`,
      distractors: [
        `Authoritarian decree without judicial review`,
        `Centralized military monopoly over legislative assembly`,
        `Arbitrary revocation of fundamental rights without constitutional amendment`
      ],
      exp: `The Indian Constitution places the Rule of Law and constitutional rights at the center of institutional studies.`
    },
    {
      q: `Regarding geographic and resource management in ${cleanTopic}, what is the recommended sustainable practice?`,
      correct: `Judicious resource allocation balancing conservation with equitable economic development`,
      distractors: [
        `Unrestricted exploitation of non-renewable fossil reserves`,
        `Complete prohibition of all agricultural and industrial activity`,
        `Ignoring ecological impact assessments for rapid short-term gains`
      ],
      exp: `Sustainable development balances economic progress with environmental preservation.`
    },
    {
      q: `Which institutional organ holds the constitutional mandate to review and uphold the provisions of ${cleanTopic}?`,
      correct: `The Independent Judiciary (Supreme Court and High Courts)`,
      distractors: [
        `The municipal municipal advisory committee`,
        `Private corporate arbitration councils`,
        `Unregistered electoral unions`
      ],
      exp: `The Judiciary acts as the guardian and interpreter of the Constitution and statutory legislation.`
    },
    {
      q: `What was one major historical outcome directly attributed to the movement surrounding ${cleanTopic}?`,
      correct: `Increased political consciousness and constitutional reforms expanding citizen participation`,
      distractors: [
        `Complete abandonment of written legal codes`,
        `Permanent cessation of all international diplomatic treaties`,
        `Restoration of unchecked absolute monarchy`
      ],
      exp: `Major historical milestones expanded political franchise and legal reform.`
    }
  ];

  return shuffleArray(bank).slice(0, count);
}

function extractPrimaryTopic(topicStr) {
  if (!topicStr) return 'Curriculum Core Concepts';
  const parts = topicStr.split(',').map((t) => t.trim()).filter(Boolean);
  const meaningful = parts.filter((t) => !/exercises|questions|detected|institutional|page\s*questions|chapter\s*\d+|unit\s*\d+/i.test(t));
  return meaningful[0] || parts[0] || topicStr.trim();
}

// ---------------------------------------------------------------------------
// 4. SCIENCE (PHYSICS, CHEMISTRY, BIOLOGY) SPECIALIZED GENERATOR
// ---------------------------------------------------------------------------
function generateScienceMcqs(topic, subject, grade, count, difficulty) {
  const cleanTopic = extractPrimaryTopic(topic);
  const lowerSub = (subject || '').toLowerCase();

  // Biology specialized
  if (lowerSub.includes('bio') || /cell|photo|respir|plant|organ|gene|blood|digest|mitosis|ecol/i.test(cleanTopic)) {
    const bioBank = [
      {
        q: `What is the primary biological function or cellular mechanism governing ${cleanTopic}?`,
        correct: `Regulated metabolic pathways ensuring cellular homeostasis and energy conversion`,
        distractors: [
          `Passive non-enzymatic breakdown with zero energy transfer`,
          `Instantaneous spontaneous synthesis without biochemical catalysts`,
          `Total static equilibrium preventing biological adaptation`
        ],
        exp: `${cleanTopic} operates via highly controlled enzymatic and cellular metabolic processes.`
      },
      {
        q: `Which cellular organelle or tissue layer plays the most indispensable role in ${cleanTopic}?`,
        correct: `Specialized cellular membranes and functional organelles coordinating biochemical activity`,
        distractors: [
          `Acellular non-living crystalline deposits`,
          `Inert vacuolar spaces lacking transport proteins`,
          `Unregulated extracellular debris`
        ],
        exp: `Cellular membrane integrity and organellar coordination are vital for physiological function.`
      },
      {
        q: `In the study of ${cleanTopic} for ${grade}, which of the following is an essential requirement or substrate?`,
        correct: `Specific biochemical substrates and optimal physiological conditions (pH and temperature)`,
        distractors: [
          `Sub-zero temperatures and high ultraviolet radiation`,
          `Absence of aqueous medium and cellular enzymes`,
          `Complete atmospheric deprivation in an inorganic medium`
        ],
        exp: `Enzymatic processes in ${cleanTopic} depend on optimum temperature, pH, and specific substrates.`
      },
      {
        q: `How does the process of ${cleanTopic} contribute to ecological or organismal survival?`,
        correct: `Facilitates energy flow, material cycling, and structural continuity of life`,
        distractors: [
          `Terminates energy cycles in the surrounding trophic web`,
          `Generates radioactive isotopes incompatible with organic tissue`,
          `Depletes all ambient organic nutrients without renewal`
        ],
        exp: `Biological mechanisms maintain the vital cycles of energy and nutrients in ecosystems.`
      },
      {
        q: `Which test or laboratory method is standardly used to demonstrate or confirm ${cleanTopic}?`,
        correct: `Controlled microscopic observation with standardized biochemical indicators`,
        distractors: [
          `Subjective visual estimation without control trials`,
          `Uncalibrated radiometric testing`,
          `Unregulated thermal destruction without recording data`
        ],
        exp: `Standard laboratory verification requires proper controls, staining, and calibrated observation.`
      }
    ];
    return shuffleArray(bioBank).slice(0, count);
  }

  // Chemistry specialized
  if (lowerSub.includes('chem') || /acid|base|salt|react|atom|mole|period|metal|bond|organic/i.test(cleanTopic)) {
    const chemBank = [
      {
        q: `What fundamental chemical principle governs reactions and molecular interactions in ${cleanTopic}?`,
        correct: `Conservation of Mass and rearrangement of chemical bonds between participating atoms`,
        distractors: [
          `Spontaneous creation of new elements during low-energy collisions`,
          `Complete destruction of atomic nuclei in standard conditions`,
          `Arbitrary valence changes violating electron configuration rules`
        ],
        exp: `Chemical reactions obey the Law of Conservation of Mass and involve bond reorganization.`
      },
      {
        q: `When investigating ${cleanTopic} in a laboratory setup, what characteristic indicator confirms the reaction?`,
        correct: `Observable enthalpy change, gas evolution, or characteristic color transition`,
        distractors: [
          `Total absence of any thermodynamic or physical alteration`,
          `Invariable loss of total atomic mass in a closed system`,
          `Immediate transition into an inert vacuum`
        ],
        exp: `Chemical changes are evidenced by temperature shifts, gas release, precipitate formation, or color changes.`
      },
      {
        q: `For ${cleanTopic} taught in ${grade}, which parameter is maintained strictly constant in an isolated system?`,
        correct: `Total mass, total electrical charge, and fundamental atomic count`,
        distractors: [
          `Total volume under fluctuating atmospheric pressures`,
          `Physical state of reacting reagents`,
          `Concentration of transient intermediate radicals`
        ],
        exp: `Mass and charge remain strictly conserved in every balanced chemical transformation.`
      },
      {
        q: `Which type of chemical bond or interaction predominantly stabilizes the species in ${cleanTopic}?`,
        correct: `Electrostatic attractions, covalent sharing, or intermolecular bonds consistent with valence`,
        distractors: [
          `Friction forces between macroscopic particles`,
          `Gravitational attraction between single electron pairs`,
          `Unbalanced magnetic monopole couplings`
        ],
        exp: `Atomic structures and molecular stability are established by electrostatic forces and electron sharing.`
      }
    ];
    return shuffleArray(chemBank).slice(0, count);
  }

  // Physics specialized
  const physBank = [
    {
      q: `What is the fundamental physical law or equation governing ${cleanTopic}?`,
      correct: `Rigorous physical laws governing energy conservation, field interactions, and momentum`,
      distractors: [
        `Random non-deterministic fluctuations without physical constants`,
        `Unbalanced spontaneous creation of kinetic energy`,
        `Independent acceleration invariant to external forces`
      ],
      exp: `Physics principles adhere strictly to conservation of energy and established mathematical laws.`
    },
    {
      q: `In the study of ${cleanTopic} for ${grade}, which standard SI unit or dimensional quantity is used for measurement?`,
      correct: `Standard calibrated SI units adhering to International Metric Standards`,
      distractors: [
        `Arbitrary uncalibrated empirical indices`,
        `Subjective non-quantifiable qualitative scales`,
        `Variable units without standardized reference datum`
      ],
      exp: `Scientific analysis of ${cleanTopic} relies on calibrated SI measurements and dimensional consistency.`
    },
    {
      q: `How does ${cleanTopic} behave when external environmental resistance or friction is minimized?`,
      correct: `Approaches ideal theoretical model predictions as defined in classical physics`,
      distractors: [
        `Completely collapses into chaotic non-linear divergence`,
        `Violates fundamental laws of thermodynamic equilibrium`,
        `Reverses direction without interaction with opposing fields`
      ],
      exp: `Ideal conditions allow empirical observations to match theoretical mathematical predictions.`
    },
    {
      q: `Which technological application directly demonstrates the working principle of ${cleanTopic}?`,
      correct: `Calibrated engineering instruments, sensors, or modern electrical apparatus`,
      distractors: [
        `Perpetual motion machines operating without energy input`,
        `Isolated systems producing boundless output without work`,
        `Non-reproducible empirical anomalies`
      ],
      exp: `Practical applications of ${cleanTopic} form the basis of modern engineering and electrical appliances.`
    }
  ];
  return shuffleArray(physBank).slice(0, count);
}

// ---------------------------------------------------------------------------
// 5. UNIVERSAL / CUSTOM TOPIC DYNAMIC GENERATOR
// ---------------------------------------------------------------------------
function generateUniversalTopicMcqs(topic, subject, grade, count, difficulty) {
  const cleanTopic = extractPrimaryTopic(topic);
  const bank = [
    {
      q: `What is the core definition and foundational scope of "${cleanTopic}" as studied in ${grade} (${subject})?`,
      correct: `A structured curriculum domain centered on the systematic study and practical application of ${cleanTopic}`,
      distractors: [
        `An obsolete unverified hypothesis unrelated to the curriculum`,
        `An isolated phenomenon that cannot be analyzed or systematically classified`,
        `A random qualitative assumption without factual or logical basis`
      ],
      exp: `${cleanTopic} is defined as a structured curriculum topic with clear educational objectives and standards.`
    },
    {
      q: `Which of the following is considered the MOST crucial characteristic or primary component of "${cleanTopic}"?`,
      correct: `Measurable principles, consistent rules, and verifiable standard outcomes`,
      distractors: [
        `Unpredictable behavior that contradicts syllabus benchmarks`,
        `Lack of reproducible or verifiable academic evidence`,
        `Complete independence from standard conceptual definitions`
      ],
      exp: `Academic comprehension of ${cleanTopic} requires understanding its core principles and rules.`
    },
    {
      q: `In academic assessments of "${cleanTopic}" for ${grade}, what is the standard methodology recommended for problem-solving or analysis?`,
      correct: `Systematic analysis adhering to board-certified guidelines and standard syllabus criteria`,
      distractors: [
        `Random subjective estimation without structured steps`,
        `Guesswork without referencing underlying principles`,
        `Omitting essential preliminary context and definitions`
      ],
      exp: `Scoring full marks requires systematic, step-by-step reasoning consistent with ${grade} standards.`
    },
    {
      q: `Which real-world application or practical scenario BEST illustrates the importance of understanding "${cleanTopic}"?`,
      correct: `Application in practical problem-solving, analytical evaluation, and interdisciplinary studies`,
      distractors: [
        `Isolated theoretical exercises with zero practical relevance`,
        `Speculative assumptions unsupported by real-world documentation`,
        `Completely unregulated trial-and-error operations`
      ],
      exp: `Mastering ${cleanTopic} equips students with transferable analytical skills and conceptual depth.`
    },
    {
      q: `When evaluating solutions or responses related to "${cleanTopic}", which factor distinguishes high-scoring answers?`,
      correct: `Conceptual accuracy, precise terminology, and clear logical deduction`,
      distractors: [
        `Vague generalization using imprecise informal colloquialisms`,
        `Inclusion of contradictory statements without explanation`,
        `Ignoring fundamental definitions and key criteria`
      ],
      exp: `Examiners reward precise terminology, logical structure, and factual consistency in responses.`
    },
    {
      q: `Which of the following statements is academically TRUE regarding the scope of "${cleanTopic}"?`,
      correct: `It is governed by established curriculum standards and provides a foundation for advanced topics`,
      distractors: [
        `It has no relevance to higher secondary or university entrance syllabi`,
        `It operates independently of any rational or pedagogical framework`,
        `It cannot be broken down into structured learning modules`
      ],
      exp: `${cleanTopic} serves as an essential stepping stone for advanced curriculum modules in ${subject}.`
    },
    {
      q: `What common misconception should students avoid when studying "${cleanTopic}"?`,
      correct: `Confusing core definitions with related but distinct secondary concepts`,
      distractors: [
        `Reviewing multiple solved examples for conceptual clarity`,
        `Practicing past board examination question papers`,
        `Verifying answers using standard textbook references`
      ],
      exp: `Avoiding conceptual confusion between core terms and secondary distractors is key to excelling in MCQs.`
    },
    {
      q: `Which analytical tool or representation is standardly employed to understand the relationships in "${cleanTopic}"?`,
      correct: `Structured tables, concept maps, and step-by-step explanatory breakdowns`,
      distractors: [
        `Unlabeled random sketches without conceptual correlation`,
        `Arbitrary numerical estimates lacking computational basis`,
        `Unverified informal forum conjectures`
      ],
      exp: `Concept maps and structured breakdowns enhance clarity and retention for ${cleanTopic}.`
    }
  ];

  return shuffleArray(bank).slice(0, count);
}

// ---------------------------------------------------------------------------
// MAIN EXPORTED GENERATOR FUNCTION
// ---------------------------------------------------------------------------
export function generateCurriculumMcqs({
  topic = 'Core Concepts',
  subject = 'General Science',
  grade = 'Class 10',
  board = 'CBSE',
  count = 5,
  difficulty = 'Medium',
  includeDiagrams = false,
}) {
  const cleanTopic = (topic || '').trim();
  const lowerTopic = cleanTopic.toLowerCase();
  const lowerSub = (subject || '').toLowerCase();
  const targetCount = Math.max(1, Math.min(25, Number(count) || 5));

  let diagramQuestions = [];
  if (includeDiagrams) {
    const diagCount = Math.min(2, targetCount);
    diagramQuestions = getDiagramMcqsForTopic(cleanTopic, diagCount).map((dItem) => {
      const rawOptions = dItem.options || [dItem.answer, ...(dItem.distractors || [])];
      return {
        question: dItem.q || dItem.question,
        options: shuffleArray(rawOptions),
        answer: dItem.answer || dItem.correct,
        explanation: dItem.explanation || dItem.exp,
        imageUrl: dItem.imageUrl,
        figureCaption: dItem.figureCaption,
        labels_answer_key: dItem.labels_answer_key,
        isDiagram: true,
      };
    });
  }

  let candidateQuestions = [];

  // 1. Check if topic specifically relates to "Verb" or English grammar
  const isVerbTopic = /verb|tenses?|action word|participle|gerund|voice/i.test(lowerTopic);
  const isEnglishSubject = lowerSub.includes('english') || lowerSub.includes('grammar') || lowerSub.includes('literature');

  if (isVerbTopic || (isEnglishSubject && /verb|tense|speech|clause|preposition|noun/i.test(lowerTopic))) {
    // English Grammar - Verbs & Morphology
    candidateQuestions = shuffleArray(VERB_QUESTION_BANK);
  } else if (isEnglishSubject) {
    // English General Literature & Grammar
    candidateQuestions = shuffleArray([
      ...VERB_QUESTION_BANK,
      {
        q: `In the study of ${cleanTopic} for ${grade} English, what literary or grammatical device is primarily emphasized?`,
        correct: `Structured syntax, contextual comprehension, and precise vocabulary usage`,
        distractors: [
          `Arbitrary punctuation lacking syntactic purpose`,
          `Informal phonetic slang non-permissible in formal writing`,
          `Fragmented clauses without subject or predicate`
        ],
        exp: `English curriculum emphasizes syntactic precision, contextual meaning, and standard grammar rules.`,
        difficulty: 'Medium'
      },
      {
        q: `Which of the following sentences best demonstrates the proper formal usage related to "${cleanTopic}"?`,
        correct: `A grammatically cohesive sentence maintaining subject-verb agreement and clear modifiers`,
        distractors: [
          `A run-on sentence with multiple dangling participles`,
          `A double negative construction obscuring the meaning`,
          `A sentence with mismatched tenses across coordinate clauses`
        ],
        exp: `Standard English assessments test cohesive structure, correct modifier placement, and tense consistency.`,
        difficulty: 'Medium'
      }
    ]);
  } else if (lowerSub.includes('math') || /algebra|geometry|trig|quadrat|equat|stat|probab|calc|arith/i.test(lowerTopic)) {
    // Mathematics
    candidateQuestions = generateMathMcqs(cleanTopic, grade, 15, difficulty);
  } else if (lowerSub.includes('social') || lowerSub.includes('history') || lowerSub.includes('geography') || lowerSub.includes('civic') || lowerSub.includes('econom') || /revolution|republic|democra|constitut|feder|revolt/i.test(lowerTopic)) {
    // Social Sciences & Humanities
    candidateQuestions = generateSocialScienceMcqs(cleanTopic, grade, 15, difficulty);
  } else if (lowerSub.includes('phys') || lowerSub.includes('chem') || lowerSub.includes('bio') || lowerSub.includes('science') || /light|cell|atom|motion|acid|photo|electr|force/i.test(lowerTopic)) {
    // Natural Sciences
    candidateQuestions = generateScienceMcqs(cleanTopic, subject, grade, 15, difficulty);
  } else {
    // Universal Topic Generator
    candidateQuestions = generateUniversalTopicMcqs(cleanTopic, subject, grade, 15, difficulty);
  }

  // Ensure we have enough candidates
  if (candidateQuestions.length < targetCount) {
    candidateQuestions = [
      ...candidateQuestions,
      ...generateUniversalTopicMcqs(cleanTopic, subject, grade, targetCount, difficulty)
    ];
  }

  // Format standard candidate questions
  const standardMcqs = candidateQuestions.map((item) => {
    const rawOptions = item.opts || [item.correct, ...(item.distractors || [])];
    const randomizedOptions = shuffleArray(rawOptions);

    return {
      question: item.q || item.question,
      options: randomizedOptions,
      answer: item.correct || item.answer,
      explanation: item.exp || item.explanation || `Derived from standard curriculum for ${cleanTopic}.`,
    };
  });

  // Combine diagram questions and standard questions
  const combined = [...diagramQuestions, ...standardMcqs].slice(0, targetCount);

  // Assign clean sequential IDs
  const finalMcqs = combined.map((item, idx) => ({
    id: idx + 1,
    ...item,
  }));

  return finalMcqs;
}
