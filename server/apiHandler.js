import fs from 'node:fs';
import path from 'node:path';
import { generateCurriculumMcqs } from '../src/utils/topicMcqEngine.js';

// Helper to read and parse .env safely
export function getEnvConfig() {
  const envPath = path.resolve(process.cwd(), '.env');
  const config = {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
    SCAN_MODEL: process.env.SCAN_MODEL || 'gemini-3.8-flash',
    MCQ_MODEL: process.env.MCQ_MODEL || 'gemini-3.8-flash',
    FINAL_MODEL: process.env.FINAL_MODEL || 'gemini-3.8-flash',
  };

  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, 'utf8');
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
          config[key] = val;
        }
      }
    } catch (err) {
      console.warn('Could not read .env file:', err.message);
    }
  }

  return config;
}

// Helper to write updated settings to .env
export function saveEnvConfig(updates) {
  const envPath = path.resolve(process.cwd(), '.env');
  const current = getEnvConfig();
  const merged = { ...current, ...updates };

  const content = `# Google Gemini API Key (keep secret, never exposed to client)
GEMINI_API_KEY=${merged.GEMINI_API_KEY || ''}

# Fast multimodal model for scanning documents and detecting chapters & science diagrams
SCAN_MODEL=${merged.SCAN_MODEL || 'gemini-3.8-flash'}

# Fast model for Topic MCQ generation
MCQ_MODEL=${merged.MCQ_MODEL || 'gemini-3.8-flash'}

# Strong model for generating the final comprehensive Question Paper
FINAL_MODEL=${merged.FINAL_MODEL || 'gemini-3.8-flash'}
`;

  fs.writeFileSync(envPath, content, 'utf8');
  // Update process.env as well
  for (const [k, v] of Object.entries(merged)) {
    process.env[k] = v;
  }
}

// Helper to sanitize filenames/hashes
function sanitizeHash(str) {
  return String(str || 'default').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
}

// Helper to call Gemini REST API
async function callGeminiApi({ apiKey, model, contents, systemInstruction = '', responseMimeType = 'application/json', temperature = 0.2 }) {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('GEMINI_API_KEY is not configured in .env');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;

  const payload = {
    contents,
    generationConfig: {
      temperature: typeof temperature === 'number' ? temperature : 0.2,
      responseMimeType: responseMimeType === 'application/json' ? 'application/json' : undefined,
    },
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey.trim(),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    let parsedMsg = errorText;
    try {
      const errJson = JSON.parse(errorText);
      if (errJson.error?.message) parsedMsg = errJson.error.message;
    } catch {
      // ignore
    }
    throw new Error(`Gemini API error (${res.status}): ${parsedMsg}`);
  }

  const data = await res.json();
  const candidate = data.candidates?.[0];
  const rawText = candidate?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error('Gemini returned an empty response. Candidate finish reason: ' + (candidate?.finishReason || 'UNKNOWN'));
  }

  return rawText.trim();
}

// Safe JSON parser with retry repair
function cleanAndParseJson(text) {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
  }

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    // Attempt to extract the outermost { ... } or [ ... ]
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
      } catch {
        // fall through
      }
    }
    throw new Error(`Failed to parse JSON response: ${err.message}\nRaw Text: ${cleaned.slice(0, 300)}...`);
  }
}

// Request body reader
async function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      // 150MB safety limit for large multi-page PDF documents
      if (body.length > 150 * 1024 * 1024) {
        reject(new Error('Request entity too large (exceeds 150MB)'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON in request body: ' + err.message));
      }
    });
    req.on('error', reject);
  });
}

// Send JSON response
function sendJson(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}

// Robust server-side extraction directly from uploaded PDF pages & topics
function generateServerFallbackPaper({
  selectedTopics = [],
  selectedPages = [],
  questionSettings = {},
  figures = [],
  headerConfig = {},
}) {
  const combinedText = selectedPages
    .map((p) => p.text || '')
    .filter(Boolean)
    .join('\n');

  // Clean sentences
  const rawSentences = combinedText
    .split(/(?<=[.?!])\s+|\n+/)
    .map((s) => s.trim().replace(/\s+/g, ' '))
    .filter(
      (s) =>
        s.length >= 25 &&
        s.length <= 260 &&
        !s.startsWith('http') &&
        !/^(page|\-\-\-|chapter|unit|section|\d+\s*$)/i.test(s)
    );

  // Extract key terms for vocabulary pool (proper nouns, technical keywords)
  const termMatches = combinedText.match(/\b[A-Z][a-z]{3,}(?:\s+[A-Z][a-z]{3,})*\b/g) || [];
  const vocabularyPool = Array.from(
    new Set(
      termMatches.filter(
        (t) =>
          !['Page', 'Chapter', 'Figure', 'Class', 'Unit', 'Table', 'Section', 'Subject', 'Name', 'Date', 'Time'].includes(
            t
          )
      )
    )
  );

  // Fallback vocabulary if document is short
  if (vocabularyPool.length < 8) {
    vocabularyPool.push(
      'Mitochondria', 'Chloroplast', 'Cytoplasm', 'Nucleus', 'Membrane',
      'Refraction', 'Dispersion', 'Diffraction', 'Wavelength', 'Frequency',
      'Photosynthesis', 'Respiration', 'Transpiration', 'Metabolism', 'Diffusion'
    );
  }

  // Active topic names
  const topicNames = selectedTopics.map((t) => t.name || t.cleanName || '').filter(Boolean);
  const primaryTopic = topicNames[0] || headerConfig.subject || 'Textbook Concepts';

  // Questions generator
  const questions = [];

  const mcqSetting = questionSettings.mcq || { enabled: true, count: 4, marks: 1 };
  const shortSetting = questionSettings.short_answer || { enabled: true, count: 4, marks: 2 };
  const longSetting = questionSettings.long_answer || { enabled: true, count: 2, marks: 5 };
  const diagSetting = questionSettings.diagram_based || { enabled: false, count: 1, marks: 4 };
  const labelSetting = questionSettings.label_the_diagram || { enabled: false, count: 1, marks: 4 };

  // 1. MCQs
  if (mcqSetting.enabled && mcqSetting.count > 0) {
    const targetCount = Number(mcqSetting.count) || 4;
    const marks = Number(mcqSetting.marks) || 1;

    for (let i = 0; i < targetCount; i++) {
      const sentence = rawSentences[i % Math.max(1, rawSentences.length)];
      let questionText = '';
      let correctAnswer = '';
      let distractors = [];

      if (sentence && (sentence.includes(' is ') || sentence.includes(' are ') || sentence.includes(':'))) {
        const words = sentence.split(' ');
        const candidateWords = words.filter(
          (w) => w.length > 4 && /^[A-Za-z]+$/.test(w) && !['their', 'there', 'which', 'about', 'these', 'those'].includes(w.toLowerCase())
        );
        const targetWord = candidateWords[Math.floor(candidateWords.length * 0.4)] || 'Principle';
        correctAnswer = targetWord;
        questionText = `According to the textbook material, complete the statement:\n"${sentence.replace(new RegExp(`\\b${targetWord}\\b`, 'i'), '__________')}"`;

        distractors = vocabularyPool
          .filter((v) => v.toLowerCase() !== correctAnswer.toLowerCase())
          .slice(i * 3, i * 3 + 3);
        while (distractors.length < 3) {
          distractors.push(`Alternative Factor ${distractors.length + 1}`);
        }
      } else {
        const topicItem = topicNames[i % Math.max(1, topicNames.length)] || primaryTopic;
        correctAnswer = topicItem;
        questionText = `Which key topic discussed in the curriculum relates to: "${sentence || primaryTopic}"?`;
        distractors = vocabularyPool
          .filter((v) => v.toLowerCase() !== correctAnswer.toLowerCase())
          .slice(0, 3);
        while (distractors.length < 3) {
          distractors.push(`Concept ${distractors.length + 1}`);
        }
      }

      const options = [correctAnswer, ...distractors].sort(() => 0.5 - Math.random());

      questions.push({
        id: `mcq-${i + 1}`,
        type: 'mcq',
        text: questionText,
        options,
        answer: correctAnswer,
        marks,
        explanation: `Directly derived from textbook content: ${sentence || primaryTopic}`,
      });
    }
  }

  // 2. Short Answer
  if (shortSetting.enabled && shortSetting.count > 0) {
    const targetCount = Number(shortSetting.count) || 4;
    const marks = Number(shortSetting.marks) || 2;

    for (let i = 0; i < targetCount; i++) {
      const sIdx = (i + 2) % Math.max(1, rawSentences.length);
      const sentence = rawSentences[sIdx];
      const topicItem = topicNames[i % Math.max(1, topicNames.length)] || primaryTopic;

      questions.push({
        id: `short-${i + 1}`,
        type: 'short_answer',
        text: sentence
          ? `Explain the scientific concept and significance of: "${sentence.slice(0, 80)}..."`
          : `Define and state the key characteristics of ${topicItem} as described in the chapter.`,
        answer: sentence
          ? `${sentence}. Provide necessary scientific reasoning and examples.`
          : `Standard textbook definition and key explanatory points for ${topicItem}.`,
        marks,
        markingRubric: `1 Mark for accurate definition, 1 Mark for key scientific point/example.`,
      });
    }
  }

  // 3. Long Answer
  if (longSetting.enabled && longSetting.count > 0) {
    const targetCount = Number(longSetting.count) || 2;
    const marks = Number(longSetting.marks) || 5;

    for (let i = 0; i < targetCount; i++) {
      const topicItem = topicNames[i % Math.max(1, topicNames.length)] || primaryTopic;
      const relatedSentences = rawSentences.slice(i * 3, i * 3 + 4).join(' ');

      questions.push({
        id: `long-${i + 1}`,
        type: 'long_answer',
        text: `Write a comprehensive, structured answer on "${topicItem}". Elaborate on its fundamental mechanism, key principles, and real-world significance discussed in the text.`,
        answer: relatedSentences
          ? `Comprehensive Model Answer:\n1. Core Principle: ${relatedSentences.slice(0, 160)}.\n2. Mechanism: Step-by-step description according to textbook curriculum.\n3. Significance and Applications: Practical observations and examples.`
          : `Detailed scientific explanation covering definition, principles, step-by-step process, and real-world applications of ${topicItem}.`,
        marks,
        markingRubric: `2 Marks for foundational explanation, 2 Marks for mechanism/points, 1 Mark for neat structure and terminology.`,
      });
    }
  }

  // 4. Diagram-Based & Identification Questions (Strictly matching ticked topic & pages)
  const selectedPageNums = new Set(selectedPages.map((p) => p.pageNumber));
  const activeTopicWords = topicNames.flatMap((t) => t.toLowerCase().split(/[\s,.-]+/)).filter((w) => w.length > 2);

  const matchedFigures = figures.filter((f) => {
    if (f.page && selectedPageNums.has(f.page)) return true;
    const caption = (f.caption || '').toLowerCase();
    const labels = (f.labels_present || []).join(' ').toLowerCase();
    return activeTopicWords.some((w) => caption.includes(w) || labels.includes(w));
  });

  const pageWithImg = selectedPages.find((p) => (p.imageBase64 && p.imageBase64.length > 200) || (p.dataUrl && p.dataUrl.length > 200));

  const effectiveFigures = matchedFigures.length > 0
    ? matchedFigures
    : (pageWithImg
        ? [{
            id: `page_${pageWithImg.pageNumber}`,
            page: pageWithImg.pageNumber,
            imageUrl: pageWithImg.imageBase64 || pageWithImg.dataUrl,
            caption: `Figure from Page ${pageWithImg.pageNumber}: ${primaryTopic}`,
            labels_present: ['Part (1)', 'Part (2)', 'Part (3)', 'Part (4)'],
          }]
        : []);

  if (diagSetting.enabled && diagSetting.count > 0 && effectiveFigures.length > 0) {
    const targetCount = Number(diagSetting.count) || 1;
    const marks = Number(diagSetting.marks) || 4;

    for (let i = 0; i < targetCount; i++) {
      const fig = effectiveFigures[i % effectiveFigures.length];

      questions.push({
        id: `diag-${i + 1}`,
        type: 'diagram_based',
        figure_id: fig?.id,
        imageUrl: fig?.imageUrl || (fig?.id ? `/figures/${fig.id}.png` : ''),
        figureCaption: fig?.caption || `Illustration for ${primaryTopic} (Page ${fig?.page || 'Topic'})`,
        text: `Study the scientific diagram shown below related to ${primaryTopic} and answer:
(a) Identify the process, organism, or setup depicted in the figure.
(b) Explain the working principle or scientific function illustrated.
(c) State two practical precautions or observations.`,
        answer: `(a) Represents ${fig?.caption || primaryTopic}.
(b) Illustrates key scientific principles as detailed in the textbook.
(c) Standard experimental precautions and real-world observations.`,
        marks,
        markingRubric: `1 Mark for identification, 2 Marks for principle/function, 1 Mark for precautions/observations.`,
      });
    }
  }

  // 5. Label the Diagram
  if (labelSetting.enabled && labelSetting.count > 0 && effectiveFigures.length > 0) {
    const targetCount = Number(labelSetting.count) || 1;
    const marks = Number(labelSetting.marks) || 4;

    for (let i = 0; i < targetCount; i++) {
      const fig = effectiveFigures[i % effectiveFigures.length];
      const labels = fig?.labels_present && fig.labels_present.length >= 2
        ? fig.labels_present
        : ['Apex / Surface', 'Central Core', 'Boundary Layer', 'Base Support'];

      questions.push({
        id: `label-${i + 1}`,
        type: 'label_the_diagram',
        figure_id: fig?.id,
        imageUrl: fig?.imageUrl || (fig?.id ? `/figures/${fig.id}.png` : ''),
        figureCaption: fig?.caption || `Diagram of ${primaryTopic}`,
        text: `Observe the diagram below related to ${primaryTopic}. Identify and label the indicated parts (1), (2), (3), and (4):`,
        labels_answer_key: labels.slice(0, 4).map((l, idx) => ({
          pointer: idx + 1,
          label: l,
        })),
        answer: `Correct Labels: ${labels.slice(0, 4).map((l, idx) => `(${idx + 1}) ${l}`).join('; ')}`,
        marks,
        markingRubric: `1 Mark for each part correctly identified and labeled.`,
      });
    }
  }

  // Organize into sections
  const sections = [];
  const mcqs = questions.filter((q) => q.type === 'mcq');
  const shortAns = questions.filter((q) => q.type === 'short_answer');
  const longAns = questions.filter((q) => q.type === 'long_answer');
  const diagrams = questions.filter((q) => q.type === 'diagram_based' || q.type === 'label_the_diagram');

  let secCounter = 0;
  const getLetter = () => String.fromCharCode(65 + secCounter++);

  if (mcqs.length > 0) {
    sections.push({
      id: 'sec-mcq',
      letter: getLetter(),
      title: 'MULTIPLE CHOICE QUESTIONS (MCQ)',
      instruction: 'Choose and write the correct alternative from the given options.',
      questions: mcqs,
      totalSectionMarks: mcqs.reduce((s, q) => s + (Number(q.marks) || 1), 0),
    });
  }

  if (shortAns.length > 0) {
    sections.push({
      id: 'sec-short',
      letter: getLetter(),
      title: 'SHORT ANSWER QUESTIONS',
      instruction: 'Answer the following questions concisely based on the textbook concepts.',
      questions: shortAns,
      totalSectionMarks: shortAns.reduce((s, q) => s + (Number(q.marks) || 2), 0),
    });
  }

  if (longAns.length > 0) {
    sections.push({
      id: 'sec-long',
      letter: getLetter(),
      title: 'LONG ANSWER & EXPLANATORY QUESTIONS',
      instruction: 'Answer the following questions in detail with structured scientific reasoning.',
      questions: longAns,
      totalSectionMarks: longAns.reduce((s, q) => s + (Number(q.marks) || 5), 0),
    });
  }

  if (diagrams.length > 0) {
    sections.push({
      id: 'sec-diag',
      letter: getLetter(),
      title: 'DIAGRAM & IDENTIFICATION QUESTIONS',
      instruction: 'Study the diagrams carefully and answer the questions / label the indicated parts.',
      questions: diagrams,
      totalSectionMarks: diagrams.reduce((s, q) => s + (Number(q.marks) || 4), 0),
    });
  }

  // Renumber questions globally
  let globalNum = 1;
  for (const sec of sections) {
    for (const q of sec.questions) {
      q.number = globalNum++;
    }
  }

  const totalMarks = sections.reduce((s, sec) => s + sec.totalSectionMarks, 0);

  return {
    header: {
      schoolName: headerConfig.schoolName || 'DELHI PUBLIC SCHOOL',
      examTitle: headerConfig.examTitle || 'EXAMINATION QUESTION PAPER',
      subject: headerConfig.subject || 'General Science',
      grade: headerConfig.grade || 'Class 10',
      duration: headerConfig.duration || '3 Hours',
      maxMarks: totalMarks,
      instructions: [
        'All questions are compulsory.',
        'Figures to the right indicate full marks.',
        'Draw neat and labeled diagrams wherever necessary.',
      ],
    },
    sections,
    totalCalculatedMarks: totalMarks,
    totalQuestionCount: globalNum - 1,
  };
}

// Fallback topic MCQ generator when no Gemini key is present
function generateServerFallbackMcqs({
  topic = 'Science Concepts',
  subject = 'General Science',
  grade = 'Class 10',
  board = 'CBSE',
  count = 5,
  difficulty = 'Medium',
}) {
  return generateCurriculumMcqs({
    topic,
    subject,
    grade,
    board,
    count,
    difficulty,
  });
}

// Main API Handler router
export async function handleApiRequest(req, res) {
  const urlObj = new URL(req.url, 'http://localhost');
  const pathname = urlObj.pathname;

  try {
    // -------------------------------------------------------------
    // GET /api/config : Returns configuration status (never leaks key)
    // -------------------------------------------------------------
    if (pathname === '/api/config' && req.method === 'GET') {
      const config = getEnvConfig();
      return sendJson(res, 200, {
        ok: true,
        hasApiKey: Boolean(config.GEMINI_API_KEY && config.GEMINI_API_KEY.trim().length > 10),
        scanModel: config.SCAN_MODEL,
        mcqModel: config.MCQ_MODEL,
        finalModel: config.FINAL_MODEL,
      });
    }

    // -------------------------------------------------------------
    // POST /api/save-config : Saves API key and model names to .env
    // -------------------------------------------------------------
    if (pathname === '/api/save-config' && req.method === 'POST') {
      const body = await readBody(req);
      const updates = {};
      if (body.apiKey !== undefined) updates.GEMINI_API_KEY = body.apiKey.trim();
      if (body.scanModel) updates.SCAN_MODEL = body.scanModel.trim();
      if (body.mcqModel) updates.MCQ_MODEL = body.mcqModel.trim();
      if (body.finalModel) updates.FINAL_MODEL = body.finalModel.trim();

      saveEnvConfig(updates);
      const updated = getEnvConfig();

      return sendJson(res, 200, {
        ok: true,
        message: 'Settings saved to .env successfully',
        hasApiKey: Boolean(updated.GEMINI_API_KEY && updated.GEMINI_API_KEY.trim().length > 10),
        scanModel: updated.SCAN_MODEL,
        mcqModel: updated.MCQ_MODEL,
        finalModel: updated.FINAL_MODEL,
      });
    }

    // -------------------------------------------------------------
    // POST /api/save-figure : Saves cropped figure to figures/<id>.png
    // -------------------------------------------------------------
    if (pathname === '/api/save-figure' && req.method === 'POST') {
      const body = await readBody(req);
      const { id, dataUrl } = body;
      if (!id || !dataUrl) {
        return sendJson(res, 400, { ok: false, error: 'id and dataUrl are required' });
      }

      const safeId = sanitizeHash(id);
      const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      // Save to public/figures/ so it is immediately served by Vite
      const publicFiguresDir = path.resolve(process.cwd(), 'public', 'figures');
      if (!fs.existsSync(publicFiguresDir)) {
        fs.mkdirSync(publicFiguresDir, { recursive: true });
      }
      fs.writeFileSync(path.join(publicFiguresDir, `${safeId}.png`), buffer);

      // Also ensure figures/ root directory exists and contains it
      const rootFiguresDir = path.resolve(process.cwd(), 'figures');
      if (!fs.existsSync(rootFiguresDir)) {
        fs.mkdirSync(rootFiguresDir, { recursive: true });
      }
      fs.writeFileSync(path.join(rootFiguresDir, `${safeId}.png`), buffer);

      return sendJson(res, 200, {
        ok: true,
        id: safeId,
        url: `/figures/${safeId}.png`,
        path: `figures/${safeId}.png`,
      });
    }

    // -------------------------------------------------------------
    // POST /api/extract-images : Uses PyMuPDF to extract all authentic images from PDF
    // -------------------------------------------------------------
    if (pathname === '/api/extract-images' && req.method === 'POST') {
      const body = await readBody(req);
      const { pdfBase64 } = body;
      if (!pdfBase64) {
        return sendJson(res, 400, { ok: false, error: 'pdfBase64 is required' });
      }

      const tempDir = path.resolve(process.cwd(), 'cache');
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
      const tempPdfPath = path.join(tempDir, `upload_${Date.now()}.pdf`);

      const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
      fs.writeFileSync(tempPdfPath, Buffer.from(cleanBase64, 'base64'));

      const publicFiguresDir = path.resolve(process.cwd(), 'public', 'figures');
      const rootFiguresDir = path.resolve(process.cwd(), 'figures');
      if (!fs.existsSync(publicFiguresDir)) fs.mkdirSync(publicFiguresDir, { recursive: true });
      if (!fs.existsSync(rootFiguresDir)) fs.mkdirSync(rootFiguresDir, { recursive: true });

      const pyScript = path.resolve(process.cwd(), 'server', 'extract_images.py');

      try {
        const { execSync } = await import('node:child_process');
        const output = execSync(`python "${pyScript}" "${tempPdfPath}" "${publicFiguresDir}"`, { encoding: 'utf8' });
        const jsonMatch = output.match(/\{[\s\S]*\}/);
        const data = jsonMatch ? JSON.parse(jsonMatch[0]) : { figures: [] };

        if (data.figures && Array.isArray(data.figures)) {
          for (const f of data.figures) {
            if (f.filename) {
              const src = path.join(publicFiguresDir, f.filename);
              const dst = path.join(rootFiguresDir, f.filename);
              if (fs.existsSync(src)) fs.copyFileSync(src, dst);
            }
          }
        }

        try { fs.unlinkSync(tempPdfPath); } catch {}
        return sendJson(res, 200, { ok: true, figures: data.figures || [] });
      } catch (err) {
        try { fs.unlinkSync(tempPdfPath); } catch {}
        return sendJson(res, 200, { ok: false, figures: [], error: err.message });
      }
    }

    // -------------------------------------------------------------
    // POST /api/scan-pdf : Multimodal analysis of PDF pages
    // -------------------------------------------------------------
    if (pathname === '/api/scan-pdf' && req.method === 'POST') {
      const body = await readBody(req);
      const { pdfHash, pages } = body;

      if (!pages || !Array.isArray(pages) || pages.length === 0) {
        return sendJson(res, 400, { ok: false, error: 'pages array is required' });
      }

      const safePdfHash = sanitizeHash(pdfHash || `pdf_${pages.length}_${Date.now()}`);
      const cacheDir = path.resolve(process.cwd(), 'cache');
      const cacheFile = path.join(cacheDir, `${safePdfHash}.json`);

      // 1. Check disk cache
      if (fs.existsSync(cacheFile)) {
        try {
          const cachedData = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
          return sendJson(res, 200, {
            ok: true,
            cached: true,
            ...cachedData,
          });
        } catch (e) {
          console.warn('Cache read error:', e.message);
        }
      }

      const config = getEnvConfig();
      if (!config.GEMINI_API_KEY) {
        return sendJson(res, 200, {
          ok: true,
          cached: false,
          fallback: true,
          chapters: [],
          figures: [],
          message: 'Gemini API key is not configured in .env; using fast local document analysis.',
        });
      }

      // 2. Multimodal call to Gemini Flash
      const scanModel = config.SCAN_MODEL || 'gemini-3.8-flash';

      // Build multimodal parts: send all page images and text
      // Process in batches if > 6 pages for speed and stability
      const BATCH_SIZE = 4;
      const batches = [];
      for (let i = 0; i < pages.length; i += BATCH_SIZE) {
        batches.push(pages.slice(i, i + BATCH_SIZE));
      }

      const systemInstruction = `You are an expert textbook curriculum and scientific diagram analyzer.
Analyze the provided textbook page images and their OCR text.
Your goals:
1. Extract the hierarchical structure: Chapters and their specific Topics with page numbers and key concept points.
2. CRITICAL: Locate ALL scientific diagrams, anatomical figures, illustrations, charts, circuits, apparatus setups, and biological drawings.
   For each figure:
   - "id": A unique string ID, e.g. "fig_p{pageNum}_{index}"
   - "page": The exact 1-based page number where this diagram is located
   - "caption": Descriptive title or caption for the figure (e.g. "Human Digestive System", "Refraction through glass prism")
   - "bbox": [x1, y1, x2, y2] strictly normalized bounding box coordinates between 0.0 and 1.0 (x1=left, y1=top, x2=right, y2=bottom) tightly enclosing the diagram graphic.
   - "labels_present": Array of part names, anatomical labels, or keys visible in this diagram (e.g. ["Cornea", "Iris", "Pupil", "Retina"]).

You must output STRICT JSON matching:
{
  "chapters": [
    {
      "name": "Chapter Name",
      "topics": [
        {
          "name": "Topic Name",
          "pages": [1, 2],
          "key_points": ["Point 1", "Point 2"]
        }
      ]
    }
  ],
  "figures": [
    {
      "id": "fig_p1_1",
      "page": 1,
      "caption": "Diagram caption",
      "bbox": [0.1, 0.2, 0.8, 0.6],
      "labels_present": ["Part 1", "Part 2"]
    }
  ]
}`;

      // Function to process a single batch of pages
      async function processBatch(batchPages) {
        const parts = [];
        parts.push({
          text: `Analyze the following textbook pages: ${batchPages.map((p) => `Page ${p.pageNumber}`).join(', ')}. Return strict JSON with chapters, topics, and figures with bounding boxes [x1, y1, x2, y2].`,
        });

        for (const page of batchPages) {
          parts.push({
            text: `=== PAGE ${page.pageNumber} ===\nExtracted Text:\n${page.text || '(Visual diagram content)'}`,
          });

          if (page.imageBase64) {
            const cleanBase64 = page.imageBase64.replace(/^data:image\/\w+;base64,/, '');
            parts.push({
              inlineData: {
                mimeType: page.mimeType || 'image/png',
                data: cleanBase64,
              },
            });
          }
        }

        const rawJson = await callGeminiApi({
          apiKey: config.GEMINI_API_KEY,
          model: scanModel,
          contents: [{ role: 'user', parts }],
          systemInstruction,
          responseMimeType: 'application/json',
        });

        return cleanAndParseJson(rawJson);
      }

      // Run batches in parallel for high speed
      const batchResults = await Promise.all(batches.map((batch) => processBatch(batch)));

      // Merge chapters and figures across batches
      const mergedChapters = [];
      const mergedFigures = [];

      for (const resItem of batchResults) {
        if (resItem.chapters && Array.isArray(resItem.chapters)) {
          for (const chap of resItem.chapters) {
            const existing = mergedChapters.find((c) => c.name.toLowerCase().trim() === chap.name.toLowerCase().trim());
            if (existing) {
              if (chap.topics && Array.isArray(chap.topics)) {
                for (const t of chap.topics) {
                  if (!existing.topics.some((et) => et.name.toLowerCase().trim() === t.name.toLowerCase().trim())) {
                    existing.topics.push(t);
                  }
                }
              }
            } else {
              mergedChapters.push(chap);
            }
          }
        }

        if (resItem.figures && Array.isArray(resItem.figures)) {
          for (const fig of resItem.figures) {
            if (fig && fig.bbox && Array.isArray(fig.bbox) && fig.bbox.length === 4) {
              mergedFigures.push({
                id: fig.id || `fig_p${fig.page || 1}_${Date.now()}`,
                page: Number(fig.page) || 1,
                caption: fig.caption || 'Scientific Diagram',
                bbox: fig.bbox.map((v) => Math.min(1, Math.max(0, Number(v) || 0))),
                labels_present: Array.isArray(fig.labels_present) ? fig.labels_present : [],
              });
            }
          }
        }
      }

      const result = {
        chapters: mergedChapters,
        figures: mergedFigures,
      };

      // Save to cache directory
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }
      fs.writeFileSync(cacheFile, JSON.stringify(result, null, 2), 'utf8');

      return sendJson(res, 200, {
        ok: true,
        cached: false,
        ...result,
      });
    }

    // -------------------------------------------------------------
    // POST /api/generate-paper : Strict JSON question paper generation
    // -------------------------------------------------------------
    if (pathname === '/api/generate-paper' && req.method === 'POST') {
      const body = await readBody(req);
      const {
        selectedTopics = [],
        selectedPages = [],
        questionSettings = {},
        figures = [],
        headerConfig = {},
      } = body;

      const config = getEnvConfig();
      if (!config.GEMINI_API_KEY) {
        const fallbackPaper = generateServerFallbackPaper({
          selectedTopics,
          selectedPages,
          questionSettings,
          figures,
          headerConfig,
        });
        return sendJson(res, 200, {
          ok: true,
          fallback: true,
          message: 'Generated question paper directly from your PDF content.',
          paper: fallbackPaper,
        });
      }

      const finalModel = config.FINAL_MODEL || 'gemini-3.8-flash';

      // Build prompt with only selected topics and pages
      const parts = [];
      const topicSummary = selectedTopics.map((t) => `- ${t.name} (Pages: ${t.pages?.join(', ') || t.pageNumber})`).join('\n');

      const settingsDescription = Object.entries(questionSettings)
        .filter(([, v]) => v && v.enabled && v.count > 0)
        .map(([typeKey, v]) => `* Type: "${typeKey}", Count: ${v.count}, Marks per question: ${v.marks}`)
        .join('\n');

      const availableFiguresList = figures.map((f) => ({
        id: f.id,
        page: f.page,
        caption: f.caption,
        labels_present: f.labels_present,
      }));

      const systemInstruction = `You are an expert school examination question paper creator.
You create official, balanced question papers adhering to official board curricula (CBSE, ICSE, State Boards).
You will receive:
1. The list of selected chapters/topics and textbook content.
2. Question type counts and marks settings.
3. Available detected diagrams and science figures.

REQUIREMENTS:
- Generate high-quality, academically rigorous questions strictly covering the selected topics.
- For question types:
  - "mcq": Must provide exactly 4 options in "options" array, and the correct answer in "answer".
  - "short_answer": Concise conceptual or explanatory question (2-3 marks).
  - "long_answer": In-depth analytical or multi-part question (4-5 marks).
  - "diagram_based": Question that refers to a diagram. MUST assign "figure_id" to one of the available figures.
  - "label_the_diagram": Question instructing students to identify labeled parts (1, 2, 3, etc.) on the diagram.
    MUST assign "figure_id" to one of the available figures.
    MUST provide "labels_answer_key": array of objects [{ "pointer": 1, "label": "..." }, { "pointer": 2, "label": "..." }] based on the figure's labels.
- Return ONLY strict JSON matching the schema.`;

      let promptText = `Generate an examination question paper for:
School: ${headerConfig.schoolName || 'DELHI PUBLIC SCHOOL'}
Subject: ${headerConfig.subject || 'General Science'}
Class/Grade: ${headerConfig.grade || 'Class 10'}
Exam Title: ${headerConfig.examTitle || 'ANNUAL ASSESSMENT EXAMINATION'}

SELECTED TOPICS:
${topicSummary || 'All topics in provided material'}

REQUIRED QUESTION SETTINGS:
${settingsDescription}

AVAILABLE FIGURES FOR DIAGRAM QUESTIONS:
${JSON.stringify(availableFiguresList, null, 2)}

TEXTBOOK EXTRACTS FOR SELECTED PAGES:
`;

      for (const p of selectedPages) {
        promptText += `\n--- PAGE ${p.pageNumber} ---\n${p.text || ''}\n`;
      }

      parts.push({ text: promptText });

      // Add selected page images (up to 6 images for multimodal grounding)
      for (const p of selectedPages.slice(0, 6)) {
        if (p.imageBase64) {
          const cleanBase64 = p.imageBase64.replace(/^data:image\/\w+;base64,/, '');
          parts.push({
            inlineData: {
              mimeType: p.mimeType || 'image/png',
              data: cleanBase64,
            },
          });
        }
      }

      parts.push({
        text: `You must return ONLY strict JSON matching this schema:
{
  "examTitle": "${headerConfig.examTitle || 'EXAMINATION QUESTION PAPER'}",
  "subject": "${headerConfig.subject || 'Science'}",
  "grade": "${headerConfig.grade || 'Class 10'}",
  "duration": "3 Hours",
  "instructions": [
    "All questions are compulsory.",
    "Draw neat and labeled diagrams wherever necessary."
  ],
  "questions": [
    {
      "type": "mcq" | "short_answer" | "long_answer" | "diagram_based" | "label_the_diagram",
      "text": "Question statement...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "Complete answer or solution",
      "marks": 1,
      "figure_id": "fig_p1_1",
      "labels_answer_key": [
        { "pointer": 1, "label": "Cornea" },
        { "pointer": 2, "label": "Iris" },
        { "pointer": 3, "label": "Pupil" },
        { "pointer": 4, "label": "Retina" }
      ]
    }
  ]
}`,
      });

      // Call Gemini API with 1 retry on JSON failure
      let rawJson = '';
      try {
        rawJson = await callGeminiApi({
          apiKey: config.GEMINI_API_KEY,
          model: finalModel,
          contents: [{ role: 'user', parts }],
          systemInstruction,
          responseMimeType: 'application/json',
        });
      } catch (callErr) {
        // Retry once with fallback prompt
        console.warn('First generate attempt failed, retrying once...', callErr.message);
        try {
          rawJson = await callGeminiApi({
            apiKey: config.GEMINI_API_KEY,
            model: finalModel,
            contents: [{ role: 'user', parts }],
            systemInstruction,
            responseMimeType: 'application/json',
          });
        } catch (retryErr) {
          console.warn('Gemini generate failed, falling back to PDF content engine...', retryErr.message);
          const fallbackPaper = generateServerFallbackPaper({
            selectedTopics,
            selectedPages,
            questionSettings,
            figures,
            headerConfig,
          });
          return sendJson(res, 200, {
            ok: true,
            fallback: true,
            message: `Generated from PDF content (${retryErr.message})`,
            paper: fallbackPaper,
          });
        }
      }

      const parsed = cleanAndParseJson(rawJson);

      // Organize parsed questions into clean examination sections
      const questions = Array.isArray(parsed.questions) ? parsed.questions : [];

      // Link figure image URLs
      for (const q of questions) {
        if (q.figure_id) {
          const matchedFig = figures.find((f) => f.id === q.figure_id);
          if (matchedFig) {
            q.imageUrl = matchedFig.imageUrl || `/figures/${matchedFig.id}.png`;
            q.figureCaption = matchedFig.caption;
          }
        }
      }

      // Group into sections
      const sections = [];
      const mcqs = questions.filter((q) => q.type === 'mcq');
      const shortAns = questions.filter((q) => q.type === 'short_answer');
      const longAns = questions.filter((q) => q.type === 'long_answer');
      const diagrams = questions.filter((q) => q.type === 'diagram_based' || q.type === 'label_the_diagram');
      const others = questions.filter(
        (q) => !['mcq', 'short_answer', 'long_answer', 'diagram_based', 'label_the_diagram'].includes(q.type)
      );

      let secCounter = 0;
      const getLetter = () => String.fromCharCode(65 + secCounter++);

      if (mcqs.length > 0) {
        sections.push({
          id: 'sec-mcq',
          letter: getLetter(),
          title: 'MULTIPLE CHOICE QUESTIONS',
          instruction: 'Choose the correct alternative from the given options.',
          questions: mcqs,
          totalSectionMarks: mcqs.reduce((s, q) => s + (Number(q.marks) || 1), 0),
        });
      }

      if (shortAns.length > 0) {
        sections.push({
          id: 'sec-short',
          letter: getLetter(),
          title: 'SHORT ANSWER QUESTIONS',
          instruction: 'Answer the following questions in 2 to 3 sentences.',
          questions: shortAns,
          totalSectionMarks: shortAns.reduce((s, q) => s + (Number(q.marks) || 2), 0),
        });
      }

      if (longAns.length > 0) {
        sections.push({
          id: 'sec-long',
          letter: getLetter(),
          title: 'LONG ANSWER & EXPLANATORY QUESTIONS',
          instruction: 'Answer the following questions in detail with scientific reasoning.',
          questions: longAns,
          totalSectionMarks: longAns.reduce((s, q) => s + (Number(q.marks) || 5), 0),
        });
      }

      if (diagrams.length > 0) {
        sections.push({
          id: 'sec-diag',
          letter: getLetter(),
          title: 'DIAGRAM & IDENTIFICATION QUESTIONS',
          instruction: 'Study the diagrams carefully and answer the questions / label the indicated parts.',
          questions: diagrams,
          totalSectionMarks: diagrams.reduce((s, q) => s + (Number(q.marks) || 4), 0),
        });
      }

      if (others.length > 0) {
        sections.push({
          id: 'sec-other',
          letter: getLetter(),
          title: 'ADDITIONAL QUESTIONS',
          instruction: 'Answer the following questions as directed.',
          questions: others,
          totalSectionMarks: others.reduce((s, q) => s + (Number(q.marks) || 2), 0),
        });
      }

      // Add 1-based global numbers to all questions
      let globalNum = 1;
      for (const sec of sections) {
        for (const q of sec.questions) {
          q.number = globalNum++;
          q.id = q.id || `q_${q.number}_${Date.now()}`;
        }
      }

      const totalMarks = sections.reduce((s, sec) => s + sec.totalSectionMarks, 0);

      const paperResult = {
        header: {
          schoolName: headerConfig.schoolName || 'DELHI PUBLIC SCHOOL',
          examTitle: parsed.examTitle || headerConfig.examTitle || 'EXAMINATION QUESTION PAPER',
          subject: parsed.subject || headerConfig.subject || 'General Science',
          grade: parsed.grade || headerConfig.grade || 'Class 10',
          duration: parsed.duration || headerConfig.duration || '3 Hours',
          maxMarks: totalMarks,
          instructions: parsed.instructions && parsed.instructions.length > 0 ? parsed.instructions : [
            'All questions are compulsory.',
            'Figures to the right indicate full marks.',
            'Draw neat and labeled diagrams wherever necessary.',
          ],
        },
        sections,
        totalCalculatedMarks: totalMarks,
        totalQuestionCount: globalNum - 1,
      };

      return sendJson(res, 200, {
        ok: true,
        paper: paperResult,
      });
    }

    // -------------------------------------------------------------
    // POST /api/generate-mcqs : Quick Topic MCQ generation
    // -------------------------------------------------------------
    if (pathname === '/api/generate-mcqs' && req.method === 'POST') {
      const body = await readBody(req);
      const {
        topic = 'Science Concepts',
        subject = 'General Science',
        grade = 'Class 10',
        board = 'CBSE',
        count = 5,
        difficulty = 'Medium',
        contextText = '',
        includeDiagrams = false,
      } = body;

      const config = getEnvConfig();
      if (!config.GEMINI_API_KEY) {
        const localMcqs = generateServerFallbackMcqs({
          topic,
          subject,
          grade,
          board,
          count,
          difficulty,
        });
        return sendJson(res, 200, {
          ok: true,
          fallback: true,
          topic,
          subject,
          grade,
          board,
          mcqs: localMcqs,
          message: `Generated MCQs using ${board} curriculum topic engine.`,
        });
      }

      const mcqModel = config.MCQ_MODEL || config.SCAN_MODEL || 'gemini-3.8-flash';

      const systemInstruction = `You are a master board examination question paper setter for school curricula (${board}, CBSE, ICSE, Cambridge, State Boards).
Create exactly ${count} multiple choice questions (MCQs) for school students on the given topic.

CRITICAL CURRICULUM & SUBJECT ACCURACY RULES:
1. BOARD & SYLLABUS: Strictly follow the syllabus benchmarks, question format, and standards of the "${board}" education board.
2. SUBJECT INTEGRITY: You MUST create questions strictly based on the subject "${subject}".
   - If the subject is "English", questions MUST be about English language, grammar (e.g. Verbs, Tenses, Voice, Speech, Prepositions, Syntax, Vocabulary, or Literature) as requested by the topic "${topic}". NEVER generate science or math questions for an English test.
   - If the subject is "Mathematics", questions MUST be about mathematical equations, theorems, properties, or calculations for "${topic}".
   - If the subject is "Social Science", questions MUST be about History, Civics, Geography, or Economics.
   - If the subject is "Physics", "Chemistry", or "Biology", questions MUST be about that respective science.
3. DIVERSITY & RANDOMIZATION: Generate fresh, distinct, non-repetitive questions on every request.
4. GRADE APPROPRIATENESS: Target the cognitive level of ${grade} students with ${difficulty} difficulty.
5. OPTIONS: Each question must have exactly 4 plausible, distinct options.
6. Provide the exact string matching one option for "answer".
7. Provide an educational explanation for the answer.
${includeDiagrams ? '8. DIAGRAM-BASED QUESTIONS: The user has requested diagram-based questions. If the topic involves visual or experimental science concepts (such as reflection, lenses, prism, cell structure, virus anatomy, human heart, circulation, electric circuits, digestive system), include questions with visual descriptions and labelled parts [A], [B], [C], [D].' : ''}

Output STRICT JSON matching:
{
  "topic": "${topic}",
  "subject": "${subject}",
  "grade": "${grade}",
  "board": "${board}",
  "mcqs": [
    {
      "id": 1,
      "question": "Question text...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "Option A",
      "explanation": "Why this answer is correct..."
    }
  ]
}`;

      let rawJson = '';
      try {
        let userPrompt = `Generate ${count} ${difficulty} level MCQs strictly for ${board} board curriculum in subject "${subject}" on the topic "${topic}" for ${grade} students. Ensure questions reflect ${subject} pedagogy. Return strict JSON.`;
        if (includeDiagrams) {
          userPrompt += `\nInclude diagram-based questions referencing visual figures and labelled parts [A], [B], [C], [D] for visual concepts.`;
        }
        if (contextText && contextText.trim()) {
          userPrompt += `\n\nGROUNDED DOCUMENT CONTEXT (FROM UPLOADED PDF):\n${contextText.trim().slice(0, 15000)}\n\nStrictly create questions directly grounded in this document content for the ticked topics: "${topic}".`;
        }

        rawJson = await callGeminiApi({
          apiKey: config.GEMINI_API_KEY,
          model: mcqModel,
          contents: [
            {
              role: 'user',
              parts: [{ text: userPrompt }],
            },
          ],
          systemInstruction,
          temperature: 0.7,
          responseMimeType: 'application/json',
        });
      } catch (err) {
        console.warn('Gemini MCQ attempt failed, using local topic generator...', err.message);
        const localMcqs = generateServerFallbackMcqs({
          topic,
          subject,
          grade,
          board,
          count,
          difficulty,
        });
        return sendJson(res, 200, {
          ok: true,
          fallback: true,
          topic,
          subject,
          grade,
          board,
          mcqs: localMcqs,
          message: `Generated MCQs using local ${board} topic engine (${err.message})`,
        });
      }

      const parsed = cleanAndParseJson(rawJson);
      return sendJson(res, 200, {
        ok: true,
        ...parsed,
      });
    }

    // 404 for unknown endpoints
    return sendJson(res, 404, { ok: false, error: 'Endpoint not found' });
  } catch (err) {
    console.error(`API Error on [${req.method} ${pathname}]:`, err);
    return sendJson(res, 500, {
      ok: false,
      error: 'SERVER_ERROR',
      message: err.message || 'An unexpected server error occurred',
    });
  }
}
