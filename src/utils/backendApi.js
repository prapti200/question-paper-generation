/**
 * Backend API Client
 * Interfaces with the backend endpoints without ever exposing the Gemini API key in frontend code.
 */

export async function fetchApiConfig() {
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Could not fetch API config from server:', err);
  }
  return { ok: false, hasApiKey: false };
}

export async function saveApiConfig(settings) {
  const res = await fetch('/api/save-config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to save configuration: ${errorText}`);
  }

  return await res.json();
}

/**
 * Extract all authentic raw embedded images from PDF using PyMuPDF backend
 */
export async function extractImagesFromPdfFile(file) {
  try {
    const reader = new FileReader();
    const base64Promise = new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const base64 = await base64Promise;

    const res = await fetch('/api/extract-images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pdfBase64: base64, filename: file.name }),
    });

    if (res.ok) {
      const data = await res.json();
      return data.figures || [];
    }
  } catch (err) {
    console.warn('PyMuPDF image extraction notice:', err.message);
  }
  return [];
}

/**
 * Scan PDF pages using multimodal Gemini Flash on backend
 * Returns { chapters, figures, cached }
 */
export async function scanPdfMultimodal({ pdfHash, pages }) {
  // Format pages for payload: send page number, text, and base64 image data
  // For large PDFs (>25 pages), send text for all pages, and include image data for first 15 pages + every 2nd page
  const payloadPages = pages.map((p, idx) => {
    const includeImage = pages.length <= 25 || idx < 15 || idx % 2 === 0 || p.isImageOnly;
    return {
      pageNumber: p.pageNumber,
      text: p.text || '',
      imageBase64: includeImage ? (p.dataUrl || '') : '',
      mimeType: (p.dataUrl && p.dataUrl.includes('image/png')) ? 'image/png' : 'image/jpeg',
    };
  });

  const res = await fetch('/api/scan-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pdfHash,
      pages: payloadPages,
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || `Scan failed with status ${res.status}`);
  }

  return await res.json();
}

/**
 * Generate full question paper using configured model on backend
 */
export async function generatePaperFromModel({
  selectedTopics = [],
  selectedPages = [],
  questionSettings = {},
  figures = [],
  headerConfig = {},
}) {
  const payloadPages = selectedPages.map((p) => ({
    pageNumber: p.pageNumber,
    text: p.text || '',
    imageBase64: p.dataUrl || '',
    mimeType: 'image/png',
  }));

  const res = await fetch('/api/generate-paper', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      selectedTopics,
      selectedPages: payloadPages,
      questionSettings,
      figures,
      headerConfig,
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || `Paper generation failed with status ${res.status}`);
  }

  return await res.json();
}

/**
 * Generate MCQs from topic directly
 */
export async function generateMcqsFromTopic({
  topic,
  subject,
  grade,
  board = 'CBSE',
  count = 5,
  difficulty = 'Medium',
  contextText = '',
  includeDiagrams = false,
}) {
  const res = await fetch('/api/generate-mcqs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topic,
      subject,
      grade,
      board,
      count,
      difficulty,
      contextText,
      includeDiagrams,
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || `MCQ generation failed with status ${res.status}`);
  }

  return await res.json();
}
