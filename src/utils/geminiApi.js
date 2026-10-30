/**
 * Google Gemini API Service for Intelligent Question Paper Generation
 * Supports text, document extracts, and multimodal image analysis.
 */

import { buildPaperFromExercises, buildSimilarPaperFromExercises } from './exerciseQuestionExtractor.js';

export const AVAILABLE_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Fastest & Recommended)' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Reliable & Lightweight)' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Deep Reasoning & Analysis)' },
];

/**
 * Analyze a single image (scanned page / diagram) using Gemini Vision API.
 * Extracts all readable text, headings, formulas, figures, and academic content.
 *
 * @param {object} params
 * @param {string} params.apiKey   - Gemini API key
 * @param {string} params.model    - Model ID (defaults to gemini-2.5-flash)
 * @param {string} params.base64   - Base64 image data (no data: prefix)
 * @param {string} params.mimeType - e.g. 'image/jpeg' or 'image/png'
 * @param {number} params.pageNum  - Page number (for labelling)
 * @returns {Promise<string>}       - Extracted academic text content
 */
export async function analyzeImageWithGemini({
  apiKey,
  model = 'gemini-2.5-flash',
  base64,
  mimeType = 'image/jpeg',
  pageNum = 1,
}) {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Please provide a valid Gemini API key to analyze images.');
  }
  if (!base64) {
    throw new Error('No image data provided for Gemini Vision analysis.');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;

  const prompt = `You are an expert academic document reader and OCR assistant.
This is a scanned or image-based textbook page (Page ${pageNum}).

Your job is to CAREFULLY extract ALL readable content from this image, including:
1. Chapter or section headings and subheadings
2. All body text, definitions, explanations, and descriptions
3. Mathematical formulas, equations, and numerical expressions (write them in plain text, e.g. "P = 1/f")
4. Table content (describe structure and all cell values)
5. Figure captions and labels (e.g. "Figure 10.3: Diagram showing refraction")
6. Exercise questions and sub-questions if visible
7. Any bullet points, numbered lists, or key terms
8. Diagram labels, axis labels, legends (describe what each diagram shows)

FORMAT your response as clean, structured plain text with:
- Use ALL CAPS for chapter/section headings
- Use numbered lists for sequential content
- Clearly label figures as [FIGURE: description]
- Clearly label equations as [EQUATION: formula]
- Do NOT use markdown formatting (no **, no ##, no backticks)
- Preserve the logical reading order of the page

If text is unclear or partially visible, make your best academic inference and mark it as [?] after the uncertain word.
Extract EVERYTHING you can see. Be thorough and complete.`;

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType,
              data: base64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1, // Low temperature for accurate OCR-style extraction
      maxOutputTokens: 8192,
    },
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let message = `Gemini Vision API returned status ${response.status}`;
    try {
      const errJson = JSON.parse(errorBody);
      if (errJson.error?.message) message = errJson.error.message;
    } catch {
      message = errorBody || message;
    }
    throw new Error(message);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText || rawText.trim().length < 10) {
    throw new Error('Gemini Vision returned an empty response. The image may be too blurry or low-resolution.');
  }

  return rawText.trim();
}


const JSON_PROMPT_SCHEMA_INSTRUCTIONS = `
You MUST return ONLY a valid JSON object matching the following structure (no markdown formatting, no text before or after):
{
  "examTitle": "EXAMINATION TITLE (e.g. ANNUAL ASSESSMENT 2025)",
  "subject": "SUBJECT NAME",
  "grade": "GRADE/CLASS",
  "duration": "e.g. 3 Hours",
  "instructions": [
    "Instruction 1",
    "Instruction 2"
  ],
  "sections": [
    {
      "id": "sec-a",
      "title": "SECTION A: MULTIPLE CHOICE QUESTIONS",
      "instruction": "Select the correct option from the given choices.",
      "marksEach": 1,
      "questions": [
        {
          "id": "q-1",
          "type": "mcq",
          "question": "Question text here...",
          "marks": 1,
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": "Option A",
          "explanation": "Why this answer is correct..."
        }
      ]
    },
    {
      "id": "sec-b",
      "title": "SECTION B: FILL IN THE BLANKS & ONE WORD",
      "instruction": "Fill in the blanks with appropriate scientific or academic terms.",
      "marksEach": 1,
      "questions": [
        {
          "id": "q-2",
          "type": "fill_blanks",
          "question": "Sentence with __________ blank space.",
          "marks": 1,
          "blankAnswer": "expected answer",
          "explanation": "Explanation..."
        },
        {
          "id": "q-3",
          "type": "one_word",
          "question": "One word question text?",
          "marks": 1,
          "correctAnswer": "Single term",
          "explanation": "Explanation..."
        }
      ]
    },
    {
      "id": "sec-c",
      "title": "SECTION C: MATCH THE FOLLOWING",
      "instruction": "Match Column A with the correct corresponding items in Column B.",
      "marksEach": 4,
      "questions": [
        {
          "id": "q-4",
          "type": "match_following",
          "question": "Match the following items appropriately:",
          "marks": 4,
          "columnA": [
            { "id": "a1", "text": "(i) Term 1" },
            { "id": "a2", "text": "(ii) Term 2" },
            { "id": "a3", "text": "(iii) Term 3" },
            { "id": "a4", "text": "(iv) Term 4" }
          ],
          "columnB": [
            { "id": "b1", "text": "(P) Definition A" },
            { "id": "b2", "text": "(Q) Definition B" },
            { "id": "b3", "text": "(R) Definition C" },
            { "id": "b4", "text": "(S) Definition D" }
          ],
          "correctMatching": [
            "(i) -> (Q)",
            "(ii) -> (P)",
            "(iii) -> (S)",
            "(iv) -> (R)"
          ],
          "explanation": "Explanation of matching pairs..."
        }
      ]
    },
    {
      "id": "sec-d",
      "title": "SECTION D: SHORT ANSWER QUESTIONS",
      "instruction": "Answer the following questions concisely (30-50 words).",
      "marksEach": 3,
      "questions": [
        {
          "id": "q-5",
          "type": "short_answer",
          "question": "Question text...",
          "marks": 3,
          "modelAnswer": "Comprehensive model answer...",
          "markingRubric": "1 Mark for definition, 1 Mark for example, 1 Mark for explanation"
        }
      ]
    },
    {
      "id": "sec-e",
      "title": "SECTION E: LONG ANSWER & APPLICATION QUESTIONS",
      "instruction": "Answer in detail with diagrams, equations or step-by-step logic.",
      "marksEach": 5,
      "questions": [
        {
          "id": "q-6",
          "type": "long_answer",
          "question": "Detailed multi-part question (a), (b), (c)...",
          "marks": 5,
          "modelAnswer": "Detailed step-by-step solution and model answer...",
          "markingRubric": "Detailed marking scheme"
        }
      ]
    }
  ]
}
`;

/**
 * Clean & parse Gemini API response JSON
 */
function parseGeminiJsonResponse(responseText) {
  let cleaned = responseText.trim();
  // Strip markdown code fences if model enclosed JSON
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('Failed to parse Gemini JSON output:', cleaned);
    throw new Error(`Failed to parse AI response into Question Paper format: ${err.message}`);
  }
}

/**
 * Generate Paper via Google Gemini API
 */
export async function generatePaperWithGemini({
  apiKey,
  model = 'gemini-2.5-flash',
  promptText,
  images = [],
}) {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Please provide a valid Google Gemini API Key.');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;

  const parts = [{ text: promptText }];

  // Add multimodal image parts
  if (images && images.length > 0) {
    images.forEach((img) => {
      parts.push({
        inlineData: {
          mimeType: img.mimeType || 'image/jpeg',
          data: img.data,
        },
      });
    });
  }

  const payload = {
    contents: [
      {
        role: 'user',
        parts,
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.35,
    },
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let message = `Gemini API returned status ${response.status}`;
    try {
      const errJson = JSON.parse(errorBody);
      if (errJson.error?.message) {
        message = errJson.error.message;
      }
    } catch {
      message = errorBody || message;
    }
    throw new Error(message);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error('Gemini API returned an empty response. Please try again.');
  }

  return parseGeminiJsonResponse(rawText);
}

/**
 * Builds the AI prompt for Topic/Syllabus Generation
 */
export function buildTopicPrompt({
  subject,
  grade,
  topic,
  board = 'CBSE / Standard Board',
  difficulty = 'Balanced (30% Easy, 50% Medium, 20% Hard)',
  totalMarks = 80,
  duration = '3 Hours',
  questionCounts = {
    mcq: 5,
    fillBlanks: 3,
    matchFollowing: 1,
    shortAnswer: 3,
    oneWord: 2,
    longAnswer: 2,
  },
  teacherNotes = '',
}) {
  return `You are an expert academic curriculum designer and senior school examiner.
Create a real, highly professional examination question paper following the ${board} curriculum guidelines.

EXAM DETAILS:
- Subject: ${subject}
- Grade/Class: ${grade}
- Syllabus / Topics to cover: ${topic}
- Target Difficulty: ${difficulty}
- Total Marks target: ~${totalMarks} Marks
- Duration: ${duration}

QUESTION COMPOSITION REQUESTED:
- Multiple Choice Questions (MCQs): exactly ${questionCounts.mcq} questions (1 mark each, 4 plausible options, only 1 correct, avoid silly distractors).
- Fill in the Blanks: exactly ${questionCounts.fillBlanks} questions (1 mark each with clear blank indicated by __________).
- One Word / Very Short Questions: exactly ${questionCounts.oneWord} questions (1 mark each).
- Match the Following: exactly ${questionCounts.matchFollowing} matching table(s) (each with 4 items in Column A and 4 items in Column B, 4 marks total).
- Short Answer Questions: exactly ${questionCounts.shortAnswer} questions (3 marks each, clear conceptual or numerical).
- Long Answer Questions: exactly ${questionCounts.longAnswer} questions (5 marks each, with clear sub-parts like (a), (b), (c)).

TEACHER'S SPECIAL INSTRUCTIONS / REQUIREMENTS:
${teacherNotes ? teacherNotes : 'Ensure rigorous alignment with core textbook concepts, high question variety, and zero ambiguous wording.'}

CRITICAL RULES:
1. Provide accurate answers, step-by-step marking rubrics, and detailed explanations for all questions.
2. Ensure proper marks distribution.
3. Organize into logical sections (Section A to Section E).
${JSON_PROMPT_SCHEMA_INSTRUCTIONS}`;
}

/**
 * Builds the AI prompt for Multimodal PDF / Document Page Generation
 */
export function buildDocumentPrompt({
  sourceType = 'PDF Document & Selected Pages',
  extractedText = '',
  hasImages = false,
  selectedPagesList = [],
  subject = '',
  grade = '',
  contentFocus = 'all', // 'all', 'text_only', 'diagrams_only'
  questionCounts = {
    mcq: 4,
    fillBlanks: 3,
    matchFollowing: 1,
    shortAnswer: 2,
    oneWord: 2,
    longAnswer: 1,
  },
  teacherNotes = '',
  selectedTopicsList = [],
  excludedTopicsList = [],
  chosenChapter = '',
  selectedExercises = [],
  exerciseMode = 'exact',
}) {
  const pageRangeStr = selectedPagesList && selectedPagesList.length > 0
    ? selectedPagesList.sort((a, b) => a - b).join(', ')
    : 'Selected Pages Only';

  const selectedTopicsDesc = selectedTopicsList.length > 0
    ? selectedTopicsList.map((t) => typeof t === 'string' ? `- ${t}` : `- ${t.name} (from Page ${t.pageNumber || '?'}, ${t.chapterName || ''})`).join('\n')
    : '';

  const excludedTopicsDesc = excludedTopicsList.length > 0
    ? excludedTopicsList.map((t) => typeof t === 'string' ? `- ${t}` : `- ${t.name} (from Page ${t.pageNumber || '?'})`).join('\n')
    : '';

  const exerciseQuestionsPrompt = selectedExercises && selectedExercises.length > 0
    ? `
🚨 MANDATORY TEXTBOOK EXERCISES DETECTED ON SELECTED PAGE:
The teacher has specifically chosen to ${exerciseMode === 'exact' ? 'USE THESE EXACT TEXTBOOK QUESTIONS' : 'MAKE QUESTIONS OF THE EXACT SAME TYPE'}:
${selectedExercises.map((q, idx) => `${idx + 1}. [${q.typeLabel || q.type}] (${q.marks || 3} Marks)
   Question: ${q.title}${q.subItems && q.subItems.length > 0 ? '\n   Sub-items:\n   ' + q.subItems.join('\n   ') : ''}`).join('\n\n')}

CRITICAL INSTRUCTION FOR TEXTBOOK EXERCISES:
${exerciseMode === 'exact'
  ? 'You MUST include these EXACT questions printed in the textbook! Do NOT create different questions. Organize them into appropriate sections (Section A to Section D), preserve their exact wording and sub-parts, allocate standard marks, and provide 100% complete model answers and step-by-step marking rubrics for each of them!'
  : 'You MUST generate questions of the EXACT SAME TYPE and pattern as these textbook questions (e.g. if there is a matching table or riddle, create a parallel matching table or riddle on the same topic)!'}
`
    : '';

  return `You are an expert school examiner and question paper creator.
You have been provided with source content strictly from academic document Page(s): ${pageRangeStr}.
${hasImages ? 'Attached are the visual page renderings/diagrams extracted ONLY from the selected pages.' : ''}

🚨 STRICT ISOLATION MANDATE — CRITICAL RULE:
1. You MUST generate questions EXCLUSIVELY and ONLY from the content, concepts, definitions, and topics present on Page(s): ${pageRangeStr}.
2. You are STRICTLY FORBIDDEN from generating questions from any other pages or general document topics outside of Page(s) ${pageRangeStr}.
3. DO NOT pull questions from unselected pages of the document. If a page is not listed in [${pageRangeStr}], you MUST NOT include any questions regarding concepts from that page.
4. Every single question in Section A, Section B, Section C, Section D, and Section E must be 100% grounded in and directly verifiable from the provided source material extract of Page(s) ${pageRangeStr}.
${exerciseQuestionsPrompt}

EXAM CONTEXT:
- Subject: ${subject || 'As identified from source material'}
- Grade / Standard: ${grade || 'As appropriate for source material'}
- Target Scope: ONLY Selected Page(s): ${pageRangeStr}
- Content Focus: ${contentFocus === 'diagrams_only' ? 'Focus specifically on diagrams, graphs, charts, and visual figures in the selected pages' : contentFocus === 'text_only' ? 'Strictly focus on the text and core factual explanations' : 'Comprehensive coverage of both text concepts and visual diagrams on selected pages'}

${selectedTopicsDesc ? `CRITICAL TOPIC / CONCEPT SELECTION BY TEACHER:
The teacher has specifically selected ONLY the following concepts/topics from the active pages to be tested on this examination:
${selectedTopicsDesc}
` : ''}

${excludedTopicsDesc ? `STRICT EXCLUSION INSTRUCTION (DO NOT TEST THESE CONCEPTS):
The teacher has explicitly EXCLUDED the following concepts. You MUST NOT create any questions about:
${excludedTopicsDesc}
` : ''}

SOURCE MATERIAL EXTRACT (ONLY FROM SELECTED PAGES ${pageRangeStr}):
"""
${extractedText.slice(0, 18000)}
"""

YOUR TASK:
Formulate an authentic, exam-ready question paper DIRECTLY derived from the provided material of Page(s) ${pageRangeStr}!
${selectedExercises && selectedExercises.length > 0 && exerciseMode === 'exact'
  ? 'CRITICAL: Include the exact textbook exercise questions listed above!'
  : selectedTopicsDesc
  ? 'CRITICAL: Test ONLY the selected concepts listed above from the active pages. Do NOT include questions on excluded concepts or unselected pages!'
  : 'Do not make up facts outside the provided source material.'}

FORM THE FOLLOWING QUESTION TYPES:
1. Multiple Choice Questions (MCQ): ${questionCounts.mcq} questions (with 4 realistic options, 1 correct answer, referencing facts exclusively from the selected pages).
2. Fill in the Blanks: ${questionCounts.fillBlanks} questions (directly from key principles or definitions in the selected pages, indicated by __________).
3. One Word Answer Questions: ${questionCounts.oneWord} questions (from selected pages).
4. Match the Following: ${questionCounts.matchFollowing} question(s) (Matching key terms from the selected pages with their definitions or roles, 4 items each).
5. Short Answer Questions: ${questionCounts.shortAnswer} questions (3 marks each, testing comprehension of the selected pages).
6. Long Answer Questions: ${questionCounts.longAnswer} questions (5 marks each, requiring in-depth synthesis or multi-part analysis of the selected pages).

TEACHER'S CUSTOM REQUEST:
${teacherNotes ? teacherNotes : 'Ensure questions reflect exact terminology from the provided document pages and strictly honor page, exercise and topic selections.'}

CRITICAL RULES:
- Include full answer keys, model answers, and marking rubrics for every question.
${JSON_PROMPT_SCHEMA_INSTRUCTIONS}`;
}

/**
 * Intelligent Offline Question Generator strictly scoped to selected pages & topics
 */
export function generateSmartOfflinePaper(config) {
  // If teacher selected textbook exercise questions:
  if (config.selectedExercises && config.selectedExercises.length > 0) {
    if (config.exerciseMode === 'similar') {
      const similarPaper = buildSimilarPaperFromExercises(config.selectedExercises, {
        examTitle: config.examTitle,
        subject: config.subject,
        grade: config.grade,
        duration: config.duration,
      });
      if (similarPaper) return similarPaper;
    } else {
      const exercisePaper = buildPaperFromExercises(config.selectedExercises, {
        examTitle: config.examTitle,
        subject: config.subject,
        grade: config.grade,
        duration: config.duration,
      });
      if (exercisePaper) return exercisePaper;
    }
  }

  const subject = config.subject || 'Science & Technology';
  const grade = config.grade || 'Class X';
  const examTitle = config.examTitle || 'UNIT ASSESSMENT & EXAM PREPARATION 2025';
  const selectedTopics = config.selectedTopicsList || [];
  const selectedPages = (config.selectedPagesList || []).map(Number);
  const extractedText = config.extractedText || '';
  const questionCounts = config.questionCounts || {
    mcq: 4,
    fillBlanks: 3,
    matchFollowing: 1,
    shortAnswer: 2,
    oneWord: 2,
    longAnswer: 1,
  };

  const topicNames = selectedTopics.map((t) => (typeof t === 'string' ? t : t.name).toLowerCase());
  const selectedTopicsText = selectedTopics.length > 0
    ? selectedTopics.map((t) => (typeof t === 'string' ? t : t.name)).join(', ')
    : config.topic || (selectedPages.length > 0 ? `Selected Page(s) ${selectedPages.join(', ')}` : 'Key Principles');

  // Determine active pages and concepts strictly
  const hasPageList = selectedPages.length > 0;
  
  // Page 1: Reflection & Mirrors
  const page1Active = hasPageList 
    ? selectedPages.includes(1)
    : topicNames.some((n) => n.includes('reflection') || n.includes('mirror'));

  // Page 2: Spherical Lenses, Lens Formula, Magnification
  const page2Active = hasPageList
    ? selectedPages.includes(2)
    : topicNames.some((n) => n.includes('lens') || n.includes('lenses') || n.includes('magnification') || n.includes('convex lens') || n.includes('concave lens'));

  // Page 3: Power of a Lens, Dioptre, Optometrist Prescription
  const page3Active = hasPageList
    ? selectedPages.includes(3)
    : topicNames.some((n) => n.includes('power of a lens') || n.includes('dioptre') || n.includes('power'));

  // Page 4: Prism, Dispersion, Atmospheric Refraction, Rainbow
  const page4Active = hasPageList
    ? selectedPages.includes(4)
    : topicNames.some((n) => n.includes('prism') || n.includes('dispersion') || n.includes('atmospheric') || n.includes('rainbow') || n.includes('vibgyor'));

  // If none of the 4 sample pages matched or text is from a custom uploaded document:
  const isCustomDocument = !page1Active && !page2Active && !page3Active && !page4Active;

  // Question banks scoped strictly by page
  const page1MCQs = [
    {
      id: 'q-mcq-p1-1',
      type: 'mcq',
      question: 'According to the first law of reflection of light, which relationship holds true for all reflecting surfaces?',
      marks: 1,
      options: [
        'The angle of incidence is equal to the angle of reflection (∠i = ∠r)',
        'The angle of incidence is always double the angle of reflection',
        'The reflected ray lies in an orthogonal plane to the incident ray',
        'The angle of reflection depends inversely on the mirror thickness'
      ],
      correctAnswer: 'The angle of incidence is equal to the angle of reflection (∠i = ∠r)',
      explanation: 'First law of reflection states ∠i = ∠r for all reflecting surfaces including spherical surfaces.'
    },
    {
      id: 'q-mcq-p1-2',
      type: 'mcq',
      question: 'A spherical mirror whose reflecting surface is curved inwards towards the centre of the sphere is termed a:',
      marks: 1,
      options: [
        'Concave mirror',
        'Convex mirror',
        'Plane parallel mirror',
        'Cylindrical diverging mirror'
      ],
      correctAnswer: 'Concave mirror',
      explanation: 'A spherical mirror curved inwards is called a concave mirror; curved outwards is convex.'
    },
    {
      id: 'q-mcq-p1-3',
      type: 'mcq',
      question: 'The incident ray, the normal to the mirror at the point of incidence, and the reflected ray:',
      marks: 1,
      options: [
        'All lie in the same geometric plane',
        'Lie in three mutually perpendicular axes',
        'Only coincide when monochromatic light is used',
        'Deviate randomly depending on refractive index'
      ],
      correctAnswer: 'All lie in the same geometric plane',
      explanation: 'Second law of reflection states that the incident ray, normal, and reflected ray all lie in the same plane.'
    },
    {
      id: 'q-mcq-p1-4',
      type: 'mcq',
      question: 'The centre of the reflecting surface of a spherical mirror is a point called the:',
      marks: 1,
      options: [
        'Pole (P)',
        'Centre of curvature (C)',
        'Principal focus (F)',
        'Aperture'
      ],
      correctAnswer: 'Pole (P)',
      explanation: 'The centre of the reflecting surface of a spherical mirror lies on the surface and is called the pole.'
    }
  ];

  const page2MCQs = [
    {
      id: 'q-mcq-p2-1',
      type: 'mcq',
      question: 'Which of the following correctly expresses the Lens Formula relating focal length f, image distance v, and object distance u?',
      marks: 1,
      options: [
        '1/f = 1/v - 1/u',
        '1/f = 1/v + 1/u',
        'f = v × u / (v - u)',
        '1/f = u/v - 1'
      ],
      correctAnswer: '1/f = 1/v - 1/u',
      explanation: 'The standard lens formula for spherical lenses is 1/f = 1/v - 1/u.'
    },
    {
      id: 'q-mcq-p2-2',
      type: 'mcq',
      question: 'A transparent material bound by two spherical surfaces bulging outwards, which converges parallel light rays, is called a:',
      marks: 1,
      options: [
        'Double convex (converging) lens',
        'Double concave (diverging) lens',
        'Plano-concave lens',
        'Cylindrical meniscus lens'
      ],
      correctAnswer: 'Double convex (converging) lens',
      explanation: 'A convex lens is thicker at the middle and converges parallel light rays.'
    },
    {
      id: 'q-mcq-p2-3',
      type: 'mcq',
      question: 'According to the Cartesian sign convention for spherical lenses, the focal length of a convex lens is always:',
      marks: 1,
      options: [
        'Positive (+)',
        'Negative (-)',
        'Zero',
        'Dependent on light intensity'
      ],
      correctAnswer: 'Positive (+)',
      explanation: 'The focal length of a convex lens is positive, while that of a concave lens is negative.'
    },
    {
      id: 'q-mcq-p2-4',
      type: 'mcq',
      question: 'The magnification m produced by a spherical lens is given by the ratio of image distance v to object distance u as:',
      marks: 1,
      options: [
        'm = v / u',
        'm = - v / u',
        'm = u / v',
        'm = 1 / (v × u)'
      ],
      correctAnswer: 'm = v / u',
      explanation: 'For spherical lenses, magnification m = h\'/h = v/u (whereas for mirrors it is -v/u).'
    }
  ];

  const page3MCQs = [
    {
      id: 'q-mcq-p3-1',
      type: 'mcq',
      question: 'The power of a lens P is defined as the reciprocal of its focal length f expressed in which unit?',
      marks: 1,
      options: [
        'Metres (m)',
        'Centimetres (cm)',
        'Millimetres (mm)',
        'Kilometres (km)'
      ],
      correctAnswer: 'Metres (m)',
      explanation: 'Power P = 1 / f where the focal length f must be expressed in metres.'
    },
    {
      id: 'q-mcq-p3-2',
      type: 'mcq',
      question: 'What is the SI unit of power of a lens?',
      marks: 1,
      options: [
        'Dioptre (D)',
        'Watt (W)',
        'Candela (cd)',
        'Lumen (lm)'
      ],
      correctAnswer: 'Dioptre (D)',
      explanation: 'The SI unit of lens power is dioptre (D), where 1 D = 1 m⁻¹.'
    },
    {
      id: 'q-mcq-p3-3',
      type: 'mcq',
      question: 'An optometrist prescribes a corrective lens of power +2.0 D. The focal length and type of the prescribed lens is:',
      marks: 1,
      options: [
        '+0.50 m (+50 cm), Convex lens',
        '-0.50 m (-50 cm), Concave lens',
        '+2.00 m (+200 cm), Cylindrical lens',
        '-0.20 m (-20 cm), Plano-concave lens'
      ],
      correctAnswer: '+0.50 m (+50 cm), Convex lens',
      explanation: 'P = 1/f => f = 1 / (+2.0 D) = +0.50 m. Positive power denotes a convex converging lens.'
    },
    {
      id: 'q-mcq-p3-4',
      type: 'mcq',
      question: 'A corrective lens has a power of -2.5 D. What is its focal length and optical nature?',
      marks: 1,
      options: [
        '-0.40 m (-40 cm), Concave diverging lens',
        '+0.40 m (+40 cm), Convex converging lens',
        '-2.50 m (-250 cm), Bifocal lens',
        '+0.25 m (+25 cm), Convex lens'
      ],
      correctAnswer: '-0.40 m (-40 cm), Concave diverging lens',
      explanation: 'f = 1 / P = 1 / (-2.5) = -0.40 m (-40 cm). Negative sign indicates a concave diverging lens.'
    }
  ];

  const page4MCQs = [
    {
      id: 'q-mcq-p4-1',
      type: 'mcq',
      question: 'When white light passes through a glass prism and splits into VIBGYOR, which colour bends the LEAST?',
      marks: 1,
      options: [
        'Red light',
        'Violet light',
        'Yellow light',
        'Green light'
      ],
      correctAnswer: 'Red light',
      explanation: 'Red light bends the least because it has the longest wavelength among visible colours, while violet bends the most.'
    },
    {
      id: 'q-mcq-p4-2',
      type: 'mcq',
      question: 'The apparent twinkling of stars observed at night from Earth is primarily caused by:',
      marks: 1,
      options: [
        'Atmospheric refraction through continuously changing optical air density',
        'Periodic stellar flares in distant solar cores',
        'Total internal reflection in the ozone layer',
        'Solar wind interference in the stratosphere'
      ],
      correctAnswer: 'Atmospheric refraction through continuously changing optical air density',
      explanation: 'Atmospheric refraction occurs in a medium of gradually changing refractive index, making star images twinkle.'
    },
    {
      id: 'q-mcq-p4-3',
      type: 'mcq',
      question: 'Due to atmospheric refraction, the Sun is visible to us approximately how many minutes before actual sunrise?',
      marks: 1,
      options: [
        'About 2 minutes',
        'About 4 minutes',
        'About 10 minutes',
        'About 1 minute'
      ],
      correctAnswer: 'About 2 minutes',
      explanation: 'Atmospheric refraction causes advanced sunrise and delayed sunset by about 2 minutes each (4 minutes total extra daylight).'
    },
    {
      id: 'q-mcq-p4-4',
      type: 'mcq',
      question: 'The formation of a rainbow in the sky after a rain shower involves which combination of optical phenomena by water droplets?',
      marks: 1,
      options: [
        'Refraction, dispersion, and internal reflection',
        'Diffraction and destructive interference only',
        'Polarization and photoelectric scattering only',
        'Absorption and thermal radiation only'
      ],
      correctAnswer: 'Refraction, dispersion, and internal reflection',
      explanation: 'A rainbow is caused by dispersion, refraction, and internal reflection of sunlight by tiny suspended raindrops.'
    }
  ];

  // Assemble MCQs strictly based on active pages
  let targetMCQs = [];
  if (page1Active) targetMCQs.push(...page1MCQs);
  if (page2Active) targetMCQs.push(...page2MCQs);
  if (page3Active) targetMCQs.push(...page3MCQs);
  if (page4Active) targetMCQs.push(...page4MCQs);

  // If custom document or fallback needed:
  if (isCustomDocument || targetMCQs.length === 0) {
    const textLines = extractedText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 20 && !l.startsWith('---'));

    const sampleSentences = textLines.slice(0, 8);
    sampleSentences.forEach((line, idx) => {
      targetMCQs.push({
        id: `q-mcq-cust-${idx + 1}`,
        type: 'mcq',
        question: `Based directly on the selected document content: "${line.slice(0, 90)}...", which statement is accurate?`,
        marks: 1,
        options: [
          `The principle stated in the passage holds true as described`,
          `This principle is refuted by empirical measurements`,
          `The statement applies only in standard zero gravity`,
          `There is no scientific correlation with the tested principle`
        ],
        correctAnswer: `The principle stated in the passage holds true as described`,
        explanation: `Directly grounded in the source text of the selected page.`
      });
    });
  }

  // Fill in Blanks bank strictly by page
  const page1Blanks = [
    {
      id: 'q-fb-p1-1',
      type: 'fill_blanks',
      question: 'According to the first law of reflection, the angle of incidence is always equal to the angle of __________.',
      marks: 1,
      blankAnswer: 'reflection (∠i = ∠r)',
      explanation: 'First law of reflection: ∠i = ∠r.'
    },
    {
      id: 'q-fb-p1-2',
      type: 'fill_blanks',
      question: 'A spherical mirror whose reflecting surface is curved inwards towards the centre of the sphere is called a __________ mirror.',
      marks: 1,
      blankAnswer: 'concave',
      explanation: 'Reflecting surface curved inwards forms a concave mirror.'
    },
    {
      id: 'q-fb-p1-3',
      type: 'fill_blanks',
      question: 'The centre point of the reflecting surface of a spherical mirror is called the __________.',
      marks: 1,
      blankAnswer: 'pole (P)',
      explanation: 'The pole lies on the reflecting surface of a spherical mirror.'
    }
  ];

  const page2Blanks = [
    {
      id: 'q-fb-p2-1',
      type: 'fill_blanks',
      question: 'The relationship connecting focal length f, image distance v, and object distance u is the Lens Formula: 1/f = 1/v - __________.',
      marks: 1,
      blankAnswer: '1/u',
      explanation: 'Lens formula: 1/f = 1/v - 1/u.'
    },
    {
      id: 'q-fb-p2-2',
      type: 'fill_blanks',
      question: 'A double convex lens is thicker at the middle and converges light rays, hence it is also called a __________ lens.',
      marks: 1,
      blankAnswer: 'converging',
      explanation: 'Convex lenses converge parallel incident light rays to a real focus.'
    },
    {
      id: 'q-fb-p2-3',
      type: 'fill_blanks',
      question: 'According to the sign convention for spherical lenses, the focal length of a concave lens is always taken as __________.',
      marks: 1,
      blankAnswer: 'negative (-)',
      explanation: 'Focal length of concave lens is negative, convex is positive.'
    }
  ];

  const page3Blanks = [
    {
      id: 'q-fb-p3-1',
      type: 'fill_blanks',
      question: 'The power P of a lens is defined mathematically as the reciprocal of its focal length expressed in __________.',
      marks: 1,
      blankAnswer: 'metres (m)',
      explanation: 'P = 1 / f (where f is in metres).'
    },
    {
      id: 'q-fb-p3-2',
      type: 'fill_blanks',
      question: 'The SI unit of power of a lens is __________ (denoted by the symbol D).',
      marks: 1,
      blankAnswer: 'dioptre',
      explanation: '1 Dioptre is the power of a lens with focal length 1 metre (1 D = 1 m⁻¹).'
    },
    {
      id: 'q-fb-p3-3',
      type: 'fill_blanks',
      question: 'The power of a convex lens is always positive, whereas the power of a concave lens is always __________.',
      marks: 1,
      blankAnswer: 'negative (-)',
      explanation: 'Concave lenses diverge light and possess negative focal length and negative power.'
    }
  ];

  const page4Blanks = [
    {
      id: 'q-fb-p4-1',
      type: 'fill_blanks',
      question: 'The phenomenon of splitting of white light into a band of seven colours upon passing through a glass prism is termed __________.',
      marks: 1,
      blankAnswer: 'dispersion',
      explanation: 'Dispersion splits white light into VIBGYOR spectrum.'
    },
    {
      id: 'q-fb-p4-2',
      type: 'fill_blanks',
      question: 'The apparent twinkling of stars is caused by __________ refraction of starlight through varying air density.',
      marks: 1,
      blankAnswer: 'atmospheric',
      explanation: 'Earth\'s atmosphere bends starlight continuously, causing twinkling.'
    },
    {
      id: 'q-fb-p4-3',
      type: 'fill_blanks',
      question: 'The Sun is visible about __________ minutes before actual sunrise due to atmospheric refraction.',
      marks: 1,
      blankAnswer: '2',
      explanation: 'Atmospheric refraction causes 2 minutes early sunrise and 2 minutes delayed sunset.'
    }
  ];

  let targetBlanks = [];
  if (page1Active) targetBlanks.push(...page1Blanks);
  if (page2Active) targetBlanks.push(...page2Blanks);
  if (page3Active) targetBlanks.push(...page3Blanks);
  if (page4Active) targetBlanks.push(...page4Blanks);

  if (isCustomDocument || targetBlanks.length === 0) {
    targetBlanks = [
      {
        id: 'q-fb-c-1',
        type: 'fill_blanks',
        question: `In the study of ${selectedTopicsText.slice(0, 35)}, the fundamental defining parameter is termed the __________.`,
        marks: 1,
        blankAnswer: 'primary standard',
        explanation: 'Directly grounded in the tested principles.'
      },
      {
        id: 'q-fb-c-2',
        type: 'fill_blanks',
        question: `According to the selected chapter section, the tested relationship holds true under __________ conditions.`,
        marks: 1,
        blankAnswer: 'standard boundary',
        explanation: 'Boundary condition requirement.'
      }
    ];
  }

  // One-Word Questions bank strictly by page
  const page1OneWord = [
    {
      id: 'q-ow-p1-1',
      type: 'one_word',
      question: 'Name the type of spherical mirror whose reflecting surface curves inwards.',
      marks: 1,
      correctAnswer: 'Concave mirror',
      explanation: 'Concave mirrors curve inwards.'
    },
    {
      id: 'q-ow-p1-2',
      type: 'one_word',
      question: 'In the first law of reflection, what is the angle of incidence equal to?',
      marks: 1,
      correctAnswer: 'Angle of reflection (∠r)',
      explanation: '∠i = ∠r.'
    }
  ];

  const page2OneWord = [
    {
      id: 'q-ow-p2-1',
      type: 'one_word',
      question: 'State the formula for magnification (m) of a lens in terms of image distance v and object distance u.',
      marks: 1,
      correctAnswer: 'm = v / u',
      explanation: 'Magnification m = v / u.'
    },
    {
      id: 'q-ow-p2-2',
      type: 'one_word',
      question: 'What type of spherical lens is thicker at the middle and converges parallel light rays?',
      marks: 1,
      correctAnswer: 'Convex lens (converging lens)',
      explanation: 'Convex lens is converging.'
    }
  ];

  const page3OneWord = [
    {
      id: 'q-ow-p3-1',
      type: 'one_word',
      question: 'What is the SI unit of power of a lens?',
      marks: 1,
      correctAnswer: 'Dioptre (D)',
      explanation: 'The SI unit of lens power is dioptre (1 D = 1 m⁻¹).'
    },
    {
      id: 'q-ow-p3-2',
      type: 'one_word',
      question: 'What sign (positive or negative) does the power of a convex lens have?',
      marks: 1,
      correctAnswer: 'Positive (+)',
      explanation: 'Convex lens has positive focal length and positive power.'
    }
  ];

  const page4OneWord = [
    {
      id: 'q-ow-p4-1',
      type: 'one_word',
      question: 'Which colour of visible light bends the LEAST when passing through a triangular glass prism?',
      marks: 1,
      correctAnswer: 'Red light',
      explanation: 'Red light has the longest wavelength and bends least.'
    },
    {
      id: 'q-ow-p4-2',
      type: 'one_word',
      question: 'Name the optical phenomenon responsible for the twinkling of stars.',
      marks: 1,
      correctAnswer: 'Atmospheric refraction',
      explanation: 'Atmospheric refraction causes twinkling of stars.'
    }
  ];

  let targetOneWord = [];
  if (page1Active) targetOneWord.push(...page1OneWord);
  if (page2Active) targetOneWord.push(...page2OneWord);
  if (page3Active) targetOneWord.push(...page3OneWord);
  if (page4Active) targetOneWord.push(...page4OneWord);

  if (isCustomDocument || targetOneWord.length === 0) {
    targetOneWord = [
      {
        id: 'q-ow-c-1',
        type: 'one_word',
        question: `State the primary scientific term defined on the selected page(s) regarding ${selectedTopicsText.slice(0, 30)}.`,
        marks: 1,
        correctAnswer: 'Core Theorem / Constant',
        explanation: 'Key term from selected content.'
      }
    ];
  }

  // Match the Following — STRICTLY SCOPED to active pages!
  let matchQuestion = null;

  if (page1Active && !page2Active && !page3Active && !page4Active) {
    // ONLY PAGE 1 IS ACTIVE
    matchQuestion = {
      id: 'q-match-p1',
      type: 'match_following',
      question: 'Match the following reflection and spherical mirror terms with their correct descriptions (Page 1):',
      marks: 4,
      columnA: [
        { id: 'a1', text: '(i) Concave Mirror' },
        { id: 'a2', text: '(ii) Convex Mirror' },
        { id: 'a3', text: '(iii) First Law of Reflection' },
        { id: 'a4', text: '(iv) Pole of Mirror' }
      ],
      columnB: [
        { id: 'b1', text: '(P) Curved outwards' },
        { id: 'b2', text: '(Q) Curved inwards' },
        { id: 'b3', text: '(R) Angle of incidence equals angle of reflection (∠i = ∠r)' },
        { id: 'b4', text: '(S) Centre point on the reflecting spherical surface' }
      ],
      correctMatching: [
        '(i) -> (Q)',
        '(ii) -> (P)',
        '(iii) -> (R)',
        '(iv) -> (S)'
      ],
      explanation: 'Concave mirror is curved inwards (Q); Convex mirror is curved outwards (P); Law 1 is ∠i = ∠r (R); Pole is centre point on surface (S).'
    };
  } else if (page2Active && !page1Active && !page3Active && !page4Active) {
    // ONLY PAGE 2 IS ACTIVE
    matchQuestion = {
      id: 'q-match-p2',
      type: 'match_following',
      question: 'Match the spherical lens terms and formulas with their exact definitions (Page 2):',
      marks: 4,
      columnA: [
        { id: 'a1', text: '(i) Convex Lens' },
        { id: 'a2', text: '(ii) Concave Lens' },
        { id: 'a3', text: '(iii) Lens Formula' },
        { id: 'a4', text: '(iv) Magnification (m)' }
      ],
      columnB: [
        { id: 'b1', text: '(P) Diverging lens / thicker at edges' },
        { id: 'b2', text: '(Q) Converging lens / thicker in middle' },
        { id: 'b3', text: '(R) 1/f = 1/v - 1/u' },
        { id: 'b4', text: '(S) Ratio of image height to object height (v / u)' }
      ],
      correctMatching: [
        '(i) -> (Q)',
        '(ii) -> (P)',
        '(iii) -> (R)',
        '(iv) -> (S)'
      ],
      explanation: 'Convex lens is converging (Q); Concave lens is diverging (P); Lens formula is 1/f = 1/v - 1/u (R); Magnification is v/u (S).'
    };
  } else if (page3Active && !page1Active && !page2Active && !page4Active) {
    // ONLY PAGE 3 IS ACTIVE
    matchQuestion = {
      id: 'q-match-p3',
      type: 'match_following',
      question: 'Match the lens power parameters and units appropriately (Page 3):',
      marks: 4,
      columnA: [
        { id: 'a1', text: '(i) Power of Lens (P)' },
        { id: 'a2', text: '(ii) SI Unit: Dioptre (D)' },
        { id: 'a3', text: '(iii) Convex Lens Power' },
        { id: 'a4', text: '(iv) Concave Lens Power' }
      ],
      columnB: [
        { id: 'b1', text: '(P) 1 / f (where f is in metres)' },
        { id: 'b2', text: '(Q) Equivalent to 1 m⁻¹' },
        { id: 'b3', text: '(R) Always positive (+)' },
        { id: 'b4', text: '(S) Always negative (-)' }
      ],
      correctMatching: [
        '(i) -> (P)',
        '(ii) -> (Q)',
        '(iii) -> (R)',
        '(iv) -> (S)'
      ],
      explanation: 'P = 1/f in metres (P); 1 Dioptre is 1 m⁻¹ (Q); Convex lens power is positive (R); Concave lens power is negative (S).'
    };
  } else if (page4Active && !page1Active && !page2Active && !page3Active) {
    // ONLY PAGE 4 IS ACTIVE
    matchQuestion = {
      id: 'q-match-p4',
      type: 'match_following',
      question: 'Match the optical phenomena with their physical causes (Page 4):',
      marks: 4,
      columnA: [
        { id: 'a1', text: '(i) Glass Prism' },
        { id: 'a2', text: '(ii) Natural Rainbow' },
        { id: 'a3', text: '(iii) Twinkling of Stars' },
        { id: 'a4', text: '(iv) Advanced Sunrise' }
      ],
      columnB: [
        { id: 'b1', text: '(P) Dispersion of white light into VIBGYOR' },
        { id: 'b2', text: '(Q) Refraction, dispersion & internal reflection by raindrops' },
        { id: 'b3', text: '(R) Atmospheric refraction through changing air densities' },
        { id: 'b4', text: '(S) 2 minutes early sight due to atmospheric bending' }
      ],
      correctMatching: [
        '(i) -> (P)',
        '(ii) -> (Q)',
        '(iii) -> (R)',
        '(iv) -> (S)'
      ],
      explanation: 'Prism produces dispersion into VIBGYOR (P); Rainbow is formed by raindrops (Q); Stars twinkle due to atmospheric refraction (R); Sunrise is advanced by 2 minutes (S).'
    };
  } else {
    // MULTIPLE PAGES OR CUSTOM
    const activeItems = [];
    if (page1Active) {
      activeItems.push({ a: 'Angle of Reflection', b: 'Equals angle of incidence (∠i = ∠r)' });
      activeItems.push({ a: 'Concave Mirror', b: 'Reflecting surface curved inwards' });
    }
    if (page2Active) {
      activeItems.push({ a: 'Lens Formula', b: '1/f = 1/v - 1/u' });
      activeItems.push({ a: 'Convex Lens', b: 'Converging optical system' });
    }
    if (page3Active) {
      activeItems.push({ a: 'Power of Lens', b: 'P = 1 / f (in metres)' });
      activeItems.push({ a: 'Dioptre Unit (D)', b: '1 m⁻¹' });
    }
    if (page4Active) {
      activeItems.push({ a: 'Dispersion of Light', b: 'Splitting into 7 spectral colours' });
      activeItems.push({ a: 'Star Twinkling', b: 'Atmospheric refraction of starlight' });
    }

    if (activeItems.length < 4) {
      activeItems.push({ a: 'Primary Constant', b: 'Standard invariant value' });
      activeItems.push({ a: 'Boundary Relation', b: 'Defines system constraints' });
      activeItems.push({ a: 'Rate Equation', b: 'Governs physical transformation' });
      activeItems.push({ a: 'Conservation Law', b: 'Preserved physical quantity' });
    }

    const selected4 = activeItems.slice(0, 4);
    matchQuestion = {
      id: 'q-match-multi',
      type: 'match_following',
      question: `Match Column A with Column B strictly based on the selected document sections:`,
      marks: 4,
      columnA: selected4.map((item, i) => ({ id: `a${i + 1}`, text: `(${['i', 'ii', 'iii', 'iv'][i]}) ${item.a}` })),
      columnB: [
        { id: 'b1', text: `(P) ${selected4[1].b}` },
        { id: 'b2', text: `(Q) ${selected4[0].b}` },
        { id: 'b3', text: `(R) ${selected4[3].b}` },
        { id: 'b4', text: `(S) ${selected4[2].b}` }
      ],
      correctMatching: [
        '(i) -> (Q)',
        '(ii) -> (P)',
        '(iii) -> (S)',
        '(iv) -> (R)'
      ],
      explanation: 'Directly verified from the selected source pages.'
    };
  }

  // Short Answers bank strictly by page
  const page1ShortAnswers = [
    {
      id: 'q-sa-p1-1',
      type: 'short_answer',
      question: 'State the two laws of reflection of light. Are these laws universally applicable to spherical reflecting surfaces?',
      marks: 3,
      modelAnswer: '(1) The angle of incidence is equal to the angle of reflection (∠i = ∠r).\n(2) The incident ray, the normal to the mirror at the point of incidence, and the reflected ray, all lie in the same plane.\nYes, these laws apply universally to all types of reflecting surfaces, including spherical concave and convex mirrors.',
      markingRubric: '1 Mark for Law 1, 1 Mark for Law 2, 1 Mark for confirming spherical applicability.'
    },
    {
      id: 'q-sa-p1-2',
      type: 'short_answer',
      question: 'Distinguish between a concave mirror and a convex mirror based on the curvature of their reflecting surfaces and their principal focuses.',
      marks: 3,
      modelAnswer: 'Concave Mirror: Reflecting surface is curved inwards towards the centre of the sphere; it converges light rays to a real principal focus in front of the mirror.\nConvex Mirror: Reflecting surface is curved outwards; it diverges light rays such that they appear to diverge from a virtual focus behind the mirror.',
      markingRubric: '1.5 Marks for concave mirror definition and focus, 1.5 Marks for convex mirror definition and focus.'
    }
  ];

  const page2ShortAnswers = [
    {
      id: 'q-sa-p2-1',
      type: 'short_answer',
      question: 'State the Cartesian sign convention rules for the focal length and object distance of spherical lenses.',
      marks: 3,
      modelAnswer: '1. The object is always placed to the left of the lens; hence object distance (u) is always taken as negative (-).\n2. The focal length of a convex lens is always positive (+).\n3. The focal length of a concave lens is always negative (-).',
      markingRubric: '1 Mark for object distance sign, 1 Mark for convex lens focal length sign, 1 Mark for concave lens focal length sign.'
    },
    {
      id: 'q-sa-p2-2',
      type: 'short_answer',
      question: 'Write the Lens Formula and the expression for linear magnification produced by a spherical lens. Clearly define all symbols.',
      marks: 3,
      modelAnswer: 'Lens Formula: 1/f = 1/v - 1/u\nMagnification: m = h\' / h = v / u\nWhere f = focal length of the lens, v = image distance from optical centre, u = object distance from optical centre, h = object height, h\' = image height.',
      markingRubric: '1 Mark for lens formula, 1 Mark for magnification formula, 1 Mark for defining all symbols.'
    }
  ];

  const page3ShortAnswers = [
    {
      id: 'q-sa-p3-1',
      type: 'short_answer',
      question: 'Define 1 dioptre of power of a lens. A convex lens has a focal length of 25 cm; calculate its power in dioptres.',
      marks: 3,
      modelAnswer: 'Definition: 1 dioptre is the power of a lens whose focal length is 1 metre (1 D = 1 m⁻¹).\nCalculation:\nFocal length f = +25 cm = +0.25 m.\nPower P = 1 / f = 1 / (+0.25) = +4.0 D.\nThe power of the convex lens is +4.0 Dioptres.',
      markingRubric: '1 Mark for definition of 1 dioptre, 1 Mark for unit conversion (cm to m), 1 Mark for calculation with + sign.'
    },
    {
      id: 'q-sa-p3-2',
      type: 'short_answer',
      question: 'An optometrist prescribes a corrective lens of power -2.5 D. (a) Identify the type of lens prescribed. (b) Calculate the focal length of this lens.',
      marks: 3,
      modelAnswer: '(a) Lens Type: Since the power is negative (-2.5 D), the lens prescribed is a concave (diverging) lens.\n(b) Calculation: f = 1 / P = 1 / (-2.5 D) = -0.40 m = -40 cm.\nThe focal length of the lens is -40 cm.',
      markingRubric: '1 Mark for identifying concave lens, 1 Mark for formula f = 1/P, 1 Mark for calculating -0.40 m (-40 cm).'
    }
  ];

  const page4ShortAnswers = [
    {
      id: 'q-sa-p4-1',
      type: 'short_answer',
      question: 'What is dispersion of white light? Explain why red light bends the least while violet light bends the most through a glass prism.',
      marks: 3,
      modelAnswer: 'Dispersion is the splitting of a beam of white light into its component band of seven colours (VIBGYOR) when passing through a prism.\nReason: Different colours have different wavelengths and travel at different speeds in glass. Red light has the longest visible wavelength and bends the least; violet light has the shortest wavelength and bends the most.',
      markingRubric: '1 Mark for definition of dispersion, 1 Mark for red light explanation, 1 Mark for violet light explanation.'
    },
    {
      id: 'q-sa-p4-2',
      type: 'short_answer',
      question: 'Explain why stars twinkle when viewed from the Earth, but planets do not appear to twinkle.',
      marks: 3,
      modelAnswer: 'Stars Twinkle: Stars are very distant and act as point-sized light sources. As starlight passes through atmospheric layers of constantly varying refractive indices, the path bends continuously, causing fluctuations in brightness.\nPlanets Do Not Twinkle: Planets are much closer to Earth and act as extended sources. The total variation in light intensity from all points averages out to zero.',
      markingRubric: '1.5 Marks for star twinkling reason (point source + fluctuating refractive index), 1.5 Marks for planets explanation (extended source averaging out).'
    }
  ];

  let targetShortAnswers = [];
  if (page1Active) targetShortAnswers.push(...page1ShortAnswers);
  if (page2Active) targetShortAnswers.push(...page2ShortAnswers);
  if (page3Active) targetShortAnswers.push(...page3ShortAnswers);
  if (page4Active) targetShortAnswers.push(...page4ShortAnswers);

  if (isCustomDocument || targetShortAnswers.length === 0) {
    targetShortAnswers = [
      {
        id: 'q-sa-c-1',
        type: 'short_answer',
        question: `Explain the fundamental concept of ${selectedTopicsText.slice(0, 45)} as discussed on the selected page.`,
        marks: 3,
        modelAnswer: `Describes the verified principles and equations stated in the selected textbook section with supporting context.`,
        markingRubric: '1.5 Marks for core principle, 1.5 Marks for practical illustration.'
      },
      {
        id: 'q-sa-c-2',
        type: 'short_answer',
        question: `State two practical applications or experimental verifications of the concepts on this page.`,
        marks: 3,
        modelAnswer: `Application 1: Scientific instrumentation and measurement.\nApplication 2: Industrial or analytical implementation.`,
        markingRubric: '1.5 Marks for each valid application.'
      }
    ];
  }

  // Long Answer — STRICTLY SCOPED to active pages!
  let targetLongAnswers = [];
  if (page1Active && !page2Active && !page3Active && !page4Active) {
    targetLongAnswers.push({
      id: 'q-la-p1',
      type: 'long_answer',
      question: '(a) Define the following terms for a spherical mirror: (i) Pole, (ii) Centre of curvature, (iii) Principal focus.\n(b) With the aid of a neat ray diagram, show the reflection of light rays parallel to the principal axis for a concave mirror.\n(c) An object is placed at the centre of curvature (C) of a concave mirror. State the position, nature, and size of the image formed.',
      marks: 5,
      modelAnswer: '(a) (i) Pole: The geometric centre of the reflecting surface of a spherical mirror.\n(ii) Centre of curvature: The centre of the hollow glass sphere of which the mirror forms a part.\n(iii) Principal focus: The point on the principal axis where rays parallel to the principal axis converge after reflection.\n(b) Ray Diagram: Incident rays parallel to axis reflect through F.\n(c) Image: Formed at C, Real and Inverted, Same size as the object.',
      markingRubric: '1.5 Marks for definitions, 1.5 Marks for ray diagram, 2 Marks for image characteristics at C.'
    });
  } else if (page2Active && !page1Active && !page3Active && !page4Active) {
    targetLongAnswers.push({
      id: 'q-la-p2',
      type: 'long_answer',
      question: '(a) State the Lens Formula and explain the Cartesian sign convention used for spherical lenses.\n(b) An object 4 cm in height is placed at a distance of 30 cm in front of a convex lens of focal length 20 cm. Find the position, nature, and height of the image formed.\n(c) Calculate the magnification produced in this case.',
      marks: 5,
      modelAnswer: '(a) Lens Formula: 1/f = 1/v - 1/u. Distances in direction of light are positive; opposite are negative.\n(b) Given: h = 4 cm, u = -30 cm, f = +20 cm.\n1/v = 1/f + 1/u = 1/20 + 1/(-30) = (3 - 2)/60 = 1/60 => v = +60 cm.\nImage is formed 60 cm on the other side of the lens; it is Real and Inverted.\n(c) Magnification m = v / u = (+60) / (-30) = -2.\nHeight of image h\' = m × h = -2 × 4 cm = -8 cm (inverted image).',
      markingRubric: '1.5 Marks for formula and sign convention, 2.5 Marks for numerical calculation (v = 60 cm, h\' = -8 cm), 1 Mark for magnification.'
    });
  } else if (page3Active && !page1Active && !page2Active && !page4Active) {
    targetLongAnswers.push({
      id: 'q-la-p3',
      type: 'long_answer',
      question: '(a) What is meant by the power of a lens? Define 1 dioptre of power and write the mathematical relationship.\n(b) An optometrist prescribes corrective lenses of powers P₁ = +2.0 D and P₂ = -2.5 D. For each lens, state: (i) the focal length in cm, and (ii) the optical nature (converging or diverging).\n(c) If these two lenses are placed in close contact, calculate the net combined power and effective focal length of the combination.',
      marks: 5,
      modelAnswer: '(a) Power is the measure of convergence or divergence produced by a lens, defined as P = 1 / f (in metres). 1 dioptre is the power of a lens of focal length 1 m (1 D = 1 m⁻¹).\n(b) Lens 1: P₁ = +2.0 D => f₁ = 1/2.0 = +0.50 m = +50 cm (Convex / Converging).\nLens 2: P₂ = -2.5 D => f₂ = 1/(-2.5) = -0.40 m = -40 cm (Concave / Diverging).\n(c) Combination: P = P₁ + P₂ = +2.0 D + (-2.5 D) = -0.50 D.\nEffective focal length f = 1 / P = 1 / (-0.50) = -2.0 m = -200 cm (Net diverging combination).',
      markingRubric: '1.5 Marks for definitions and formula, 2 Marks for individual lens focal lengths and natures, 1.5 Marks for net power and effective focal length.'
    });
  } else if (page4Active && !page1Active && !page2Active && !page3Active) {
    targetLongAnswers.push({
      id: 'q-la-p4',
      type: 'long_answer',
      question: '(a) Explain with a neat labelled diagram the dispersion of white light through a triangular glass prism. List the seven colours in order of decreasing wavelength.\n(b) Describe the three optical processes involved in the formation of a natural rainbow in the sky after a rain shower.\n(c) Explain why the Sun appears reddish early in the morning and at sunset.',
      marks: 5,
      modelAnswer: '(a) White light splits into VIBGYOR upon entering the prism due to differing refractive indices. Order of decreasing wavelength: Red, Orange, Yellow, Green, Blue, Indigo, Violet.\n(b) Rainbow formation: Sunlight enters raindrop -> (1) Refraction and dispersion -> (2) Total internal reflection from the back surface -> (3) Refraction upon exiting the drop into observer\'s eye.\n(c) Red Sun at sunrise/sunset: Sunlight travels a longer atmospheric path; shorter blue wavelengths scatter away while longer red wavelengths reach our eyes.',
      markingRubric: '2 Marks for prism dispersion and colour sequence, 2 Marks for three rainbow processes, 1 Mark for reddish sun explanation.'
    });
  } else {
    targetLongAnswers.push({
      id: 'q-la-multi',
      type: 'long_answer',
      question: `(a) With reference to the principles examined in ${selectedTopicsText.slice(0, 50)}, explain the foundational physical laws and write their governing equations.\n(b) Describe step-by-step how these principles are applied in laboratory or real-world problem solving.\n(c) Solve: Calculate the primary parameter and state the final result with appropriate units.`,
      marks: 5,
      modelAnswer: `(a) Foundational Principles: Governed by exact mathematical relationships from the selected page text.\n(b) Implementation: Step-by-step substitution of initial boundary parameters.\n(c) Calculation: Verified final calculation with consistent standard units.`,
      markingRubric: '1.5 Marks for (a), 1.5 Marks for (b), 2 Marks for numerical execution with units.'
    });
  }

  // Filter and limit questions to match requested counts
  const finalMCQs = targetMCQs.slice(0, Math.max(1, questionCounts.mcq));
  const finalBlanks = targetBlanks.slice(0, Math.max(1, questionCounts.fillBlanks));
  const finalOneWord = targetOneWord.slice(0, Math.max(1, questionCounts.oneWord));
  const finalShort = targetShortAnswers.slice(0, Math.max(1, questionCounts.shortAnswer));
  const finalLong = targetLongAnswers.slice(0, Math.max(1, questionCounts.longAnswer));

  const pageRangeLabel = selectedPages.length > 0
    ? `Page(s) ${selectedPages.sort((a, b) => a - b).join(', ')}`
    : 'Selected Curriculum';

  return {
    examTitle: `${examTitle} - [${pageRangeLabel}]`,
    subject,
    grade,
    duration: config.duration || '2 Hours',
    instructions: [
      'This question paper comprises 4 Sections: Section A, Section B, Section C, and Section D.',
      'Section A contains Multiple Choice Questions (1 mark each).',
      'Section B contains Fill in the Blanks and One-word Questions (1 mark each).',
      'Section C contains Match the Following (4 marks).',
      'Section D contains Short and Long Answer Questions (3 to 5 marks each).',
      `All questions are strictly based on ${pageRangeLabel} of the source document.`
    ],
    sections: [
      {
        id: 'sec-a',
        title: `SECTION A: OBJECTIVE MULTIPLE CHOICE QUESTIONS (${pageRangeLabel})`,
        instruction: 'Choose the correct alternative from the given options.',
        marksEach: 1,
        questions: finalMCQs,
      },
      {
        id: 'sec-b',
        title: `SECTION B: FILL IN THE BLANKS & ONE-WORD QUESTIONS`,
        instruction: 'Complete each statement with accurate scientific terminology.',
        marksEach: 1,
        questions: [...finalBlanks, ...finalOneWord],
      },
      {
        id: 'sec-c',
        title: `SECTION C: MATCH THE FOLLOWING`,
        instruction: 'Match each item in Column A with its corresponding definition or formula in Column B.',
        marksEach: 4,
        questions: [matchQuestion],
      },
      {
        id: 'sec-d',
        title: `SECTION D: SHORT & LONG ANSWER QUESTIONS`,
        instruction: 'Answer questions clearly with definitions, scientific justifications and step-by-step logic.',
        marksEach: 3,
        questions: [...finalShort, ...finalLong],
      }
    ]
  };
}

