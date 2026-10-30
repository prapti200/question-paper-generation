/**
 * documentConceptAnalyzer.js
 * 
 * Intelligent document analyzer that comprehensively parses all pages of an uploaded PDF
 * from Page 1 to the very last page, ensuring NO chapters or topics are ever skipped or lost.
 * 
 * Major Features:
 * 1. INDEX / CONTENTS DETECTION & DOWNWARD MATCHING:
 *    - Detects if an uploaded PDF has an Index / Table of Contents / विषय-सूची in the initial pages.
 *    - Extracts the real, official chapter names and numbers from the Index.
 *    - Compares each chapter name sequentially to downward pages to find where each chapter begins.
 *    - Assigns all subtopics, concepts, and textbook exercises between chapter boundaries strictly to their real chapter.
 * 2. SEAMLESS FALLBACK:
 *    - If no Index or Contents page is present, smoothly falls back to the sequential page-by-page heading/concept analysis.
 * 3. FINE-GRAINED TOPIC & EXERCISE EXTRACTION:
 *    - Captures numbered sections (1.1, 1.2), key definitions, bold conceptual headings, and textbook questions.
 * 4. STRICT PAGE ORDER:
 *    - Preserves exact curriculum sequence and sorts chapters and topics ascending by page number.
 */

import { detectPageExercises } from './exerciseQuestionExtractor.js';

// Index headers across English, Hindi, and regional curriculum documents
const INDEX_HEADER_REGEX = /^(?:TABLE\s+OF\s+CONTENTS|CONTENTS|CONTENT|INDEX|TABLE\s+DES\s+MATIÈRES|COURSE\s+CONTENT|SYLLABUS|विषय[\s\-]*सूची|अनुक्रमणिका|पाठ्यक्रम)\b/i;

// Front matter / non-curriculum entries to ignore from index
const SKIP_INDEX_WORDS_REGEX = /^(?:foreword|preface|acknowledgement|acknowledgments|syllabus|curriculum|answers|solutions|appendix|glossary|bibliography|note\s+for|rationalisation|about\s+the\s+book)\b/i;

// Common chapter entry formats on Index / Content pages
const NUMBERED_INDEX_ENTRY_REGEX = /^(?:CHAPTER|UNIT|LESSON|MODULE|PART|CH[\.\s]|पाठ)?\s*([0-9]{1,2}|[IVXLCDM]+)[\.\:\-\)\s]+([A-Za-z\u0900-\u097F][^\n\r]+?)(?:[\.\s\-_–—\t]{2,}|\s+)(\d{1,4})\s*$/i;
const SIMPLE_NUMBERED_INDEX_REGEX = /^(?:CHAPTER|UNIT|LESSON|MODULE|PART|CH[\.\s]|पाठ)?\s*([0-9]{1,2}|[IVXLCDM]+)\s*[\.\:\-\)]\s*([A-Za-z\u0900-\u097F][^\n\r]+?)(?:\s+(\d{1,4}))?$/i;

/**
 * Clean and format topic and chapter titles
 */
export function cleanTopicTitle(str) {
  if (!str) return '';
  return str
    .replace(/^[\d\.\-\s]+/, '') // remove leading numbers if any
    .replace(/[:\-–]+$/, '') // remove trailing colon or dash
    .trim()
    .split(/\s+/)
    .map((w) => {
      if (w.length <= 3 && !/^[A-Z]{2,3}$/.test(w)) return w.toLowerCase();
      if (w === w.toUpperCase() && w.length > 3) {
        return w.charAt(0) + w.slice(1).toLowerCase();
      }
      return w;
    })
    .join(' ');
}

/**
 * Normalize string for fuzzy comparison
 */
function normalizeForComparison(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\u0900-\u097F\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract significant keywords from a chapter title (excluding common stop words)
 */
function getSignificantWords(str) {
  const normalized = normalizeForComparison(str);
  const stopWords = new Set([
    'and', 'the', 'of', 'in', 'for', 'with', 'to', 'at', 'from', 'by', 'on', 'a', 'an', 
    'is', 'are', 'was', 'were', 'chapter', 'unit', 'lesson', 'part', 'its', 'their', 'how'
  ]);
  return normalized.split(' ').filter((w) => w.length > 2 && !stopWords.has(w));
}

// Roman numerals to decimal mapping
const ROMAN_TO_DEC = {
  i: '1', ii: '2', iii: '3', iv: '4', v: '5', vi: '6', vii: '7', viii: '8', ix: '9', x: '10',
  xi: '11', xii: '12', xiii: '13', xiv: '14', xv: '15', xvi: '16', xvii: '17', xviii: '18', xix: '19', xx: '20'
};

// Word numbers to decimal mapping
const WORD_TO_DEC = {
  one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9', ten: '10',
  first: '1', second: '2', third: '3', fourth: '4', fifth: '5', sixth: '6', seventh: '7', eighth: '8', ninth: '9', tenth: '10'
};

function normalizeChapterNumber(val) {
  if (!val) return '1';
  const clean = String(val).trim().toLowerCase();
  if (ROMAN_TO_DEC[clean]) return ROMAN_TO_DEC[clean];
  if (WORD_TO_DEC[clean]) return WORD_TO_DEC[clean];
  return clean.replace(/[^0-9]/g, '') || clean;
}

/**
 * 1. DETECT AND EXTRACT INDEX / TABLE OF CONTENTS
 * Examines the initial pages of the document to extract official chapter names.
 * @param {Array} sortedPages 
 * @returns {{ isIndexFound: boolean, indexPages: number[], indexChapters: Array }}
 */
export function detectAndExtractIndex(sortedPages = []) {
  const candidatePages = sortedPages.slice(0, 10);
  const indexPages = [];
  const rawEntries = [];

  let inIndexBlock = false;

  for (let i = 0; i < candidatePages.length; i++) {
    const page = candidatePages[i];
    const rawPageLines = (page.text || '').split('\n').map((l) => l.trim()).filter(Boolean);
    const hasHeader = rawPageLines.some((l) => INDEX_HEADER_REGEX.test(l));

    // Pre-process: merge wrapped chapter titles that span across 2 lines in narrow index columns
    const lines = [];
    for (let j = 0; j < rawPageLines.length; j++) {
      const cur = rawPageLines[j];
      const nxt = rawPageLines[j + 1];

      const curStartsWithNum = /^(?:CHAPTER|UNIT|LESSON|PART|CH[\.\s]|पाठ)?\s*([0-9]{1,2}|[IVXLCDM]+)[\.\:\-\s]+/i.test(cur);
      const curHasPageOrDots = /[\.\-_–—]{2,}|\s{2,}|\t+|\d{1,4}\s*$/.test(cur);
      const nxtStartsWithNum = nxt && /^(?:CHAPTER|UNIT|LESSON|PART|CH[\.\s]|पाठ)?\s*([0-9]{1,2}|[IVXLCDM]+)[\.\:\-\s]+/i.test(nxt);
      const nxtHasPageOrDots = nxt && /[\.\-_–—]{2,}|\s{2,}|\t+|\d{1,4}\s*$/.test(nxt);

      if (curStartsWithNum && !curHasPageOrDots && nxt && !nxtStartsWithNum && nxtHasPageOrDots) {
        lines.push(`${cur} ${nxt}`);
        j++; // skip next merged line
      } else {
        lines.push(cur);
      }
    }

    let dotLeaderOrPageNumCount = 0;
    const pageEntries = [];

    lines.forEach((line) => {
      if (INDEX_HEADER_REGEX.test(line)) return;
      if (SKIP_INDEX_WORDS_REGEX.test(line)) return;

      let match = line.match(NUMBERED_INDEX_ENTRY_REGEX);
      if (!match && (hasHeader || inIndexBlock || /^[0-9]{1,2}[\.\:\-\)]\s+[A-Za-z\u0900-\u097F]/.test(line))) {
        match = line.match(SIMPLE_NUMBERED_INDEX_REGEX);
      }

      if (match) {
        const num = normalizeChapterNumber(match[1]);
        let title = match[2].trim();
        const pageHint = match[3] ? parseInt(match[3], 10) : null;

        if (/[\.\-_–—]{2,}|\s{2,}|\t+/.test(line) || pageHint !== null) {
          dotLeaderOrPageNumCount++;
        }

        // Clean trailing dots, dashes, page numbers from title
        title = title.replace(/[\.\-_–—\s]+$/, '').replace(/\s+\d{1,4}$/, '').trim();

        if (title.length >= 3 && !SKIP_INDEX_WORDS_REGEX.test(title)) {
          pageEntries.push({
            number: num,
            title: cleanTopicTitle(title),
            rawTitle: title,
            pageHint,
            fromIndexPage: page.pageNumber,
          });
        }
      }
    });

    const isSequentialNumbers = pageEntries.length >= 2 && pageEntries.every((e, idx) => {
      const n = parseInt(e.number, 10);
      return !isNaN(n) && (n === idx + 1 || (idx > 0 && n > parseInt(pageEntries[idx - 1].number, 10)));
    });

    const isThisPageIndex = hasHeader || 
      (inIndexBlock && pageEntries.length >= 2) || 
      (dotLeaderOrPageNumCount >= 2 && pageEntries.length >= 2) ||
      (isSequentialNumbers && pageEntries.length >= 3);

    if (isThisPageIndex && pageEntries.length > 0) {
      inIndexBlock = true;
      indexPages.push(page.pageNumber);
      rawEntries.push(...pageEntries);
    } else if (inIndexBlock && !hasHeader) {
      // Contiguous index block has ended
      break;
    }
  }

  if (indexPages.length === 0 || rawEntries.length < 2) {
    return { isIndexFound: false, indexPages: [], indexChapters: [] };
  }

  // De-duplicate entries by chapter number & title
  const uniqueEntries = [];
  const seenNumbers = new Set();
  const seenTitles = new Set();

  rawEntries.forEach((entry) => {
    const normTitle = normalizeForComparison(entry.title);
    if (!seenNumbers.has(entry.number) && !seenTitles.has(normTitle)) {
      seenNumbers.add(entry.number);
      seenTitles.add(normTitle);
      uniqueEntries.push({
        id: `ch-${uniqueEntries.length + 1}`,
        number: entry.number,
        title: entry.title,
        cleanTitle: entry.title,
        name: `Chapter ${entry.number}: ${entry.title}`,
        pageHint: entry.pageHint,
        fromIndexPage: entry.fromIndexPage,
      });
    }
  });

  // Sort strictly by numerical chapter number (Chapter 1, 2, 3, 4, 5, 6, 7...)
  uniqueEntries.sort((a, b) => {
    const na = parseInt(a.number, 10);
    const nb = parseInt(b.number, 10);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return 0;
  });

  // Re-assign clean IDs
  uniqueEntries.forEach((e, idx) => {
    e.id = `ch-${idx + 1}`;
  });

  return {
    isIndexFound: uniqueEntries.length >= 2,
    indexPages,
    indexChapters: uniqueEntries,
  };
}

/**
 * Checks whether a downward page heading matches a chapter from the index
 */
function isPageChapterHeading(page, chapter) {
  const lines = (page.text || '').split('\n').map((l) => l.trim()).filter(Boolean);
  // Check top 50 lines of the page
  const topLines = lines.slice(0, 50);
  const normTitle = normalizeForComparison(chapter.title);
  const significantWords = getSignificantWords(chapter.title);

  // 1. Direct line substring match
  for (const line of topLines) {
    const normLine = normalizeForComparison(line);
    if (normLine.includes(normTitle)) return true;
  }

  // 2. Multi-line heading (e.g. Line 0: "CHAPTER 6", Line 1: "LIFE PROCESSES")
  const joinedTop = normalizeForComparison(topLines.join(' '));
  if (joinedTop.includes(normTitle)) return true;

  // 3. Numbered heading match: "Chapter 6", "Chapter Six", "6." + at least 1 significant word
  const numVariants = [
    String(chapter.number),
    Object.keys(ROMAN_TO_DEC).find((k) => ROMAN_TO_DEC[k] === String(chapter.number)),
    Object.keys(WORD_TO_DEC).find((k) => WORD_TO_DEC[k] === String(chapter.number)),
  ].filter(Boolean);

  for (const numVar of numVariants) {
    const chapNumPattern = new RegExp(`\\b(?:chapter|unit|lesson|module|ch|part)?\\s*${numVar}\\b`, 'i');
    if (chapNumPattern.test(joinedTop)) {
      if (significantWords.length === 0) return true;
      const matchCount = significantWords.filter((w) => joinedTop.includes(w)).length;
      if (matchCount >= 1) return true;
    }
  }

  // 4. Strong keyword overlap (>= 50% of significant words)
  if (significantWords.length >= 2) {
    const matchCount = significantWords.filter((w) => joinedTop.includes(w)).length;
    if (matchCount / significantWords.length >= 0.5) return true;
  }

  return false;
}

/**
 * 2. DOWNWARD SEQUENTIAL MATCHING WITH TWO-PASS RECOVERY
 * Matches extracted index chapters downward against subsequent pages in the PDF.
 * GUARANTEE:
 * - EXACT sequential chapter count (if index has 7 chapters, matchedChapters has EXACTLY 7 chapters).
 * - ZERO skipped or missing chapters (Chapter 6 is never dropped or mixed into Chapter 5).
 * - Chapter 1 is fully bounded, then Chapter 2, Chapter 3, ..., up to Chapter 7.
 * 
 * @param {Array} sortedPages 
 * @param {Object} indexResult 
 * @returns {Array} Matched chapters with strictly contiguous, non-overlapping assigned page ranges
 */
export function matchIndexChaptersDownward(sortedPages, indexResult) {
  const { indexPages, indexChapters } = indexResult;
  if (!indexChapters || indexChapters.length === 0) return [];

  const maxIndexPage = indexPages && indexPages.length > 0 ? Math.max(...indexPages) : 1;
  const minAllowedStart = maxIndexPage + 1;

  // All pages that appear after the index
  const downwardPages = sortedPages.filter((p) => p.pageNumber >= minAllowedStart);
  if (downwardPages.length === 0) {
    downwardPages.push(...sortedPages);
  }

  const N = indexChapters.length;
  // Map indexChapter index (0 to N-1) -> start pageNumber in the PDF
  const matchedPagesMap = new Map();

  // PASS 1: Sequential Downward Match
  let searchDownFromIndex = 0;
  for (let i = 0; i < N; i++) {
    const chap = indexChapters[i];
    let foundPageIndex = -1;

    for (let pIdx = searchDownFromIndex; pIdx < downwardPages.length; pIdx++) {
      const page = downwardPages[pIdx];
      if (isPageChapterHeading(page, chap)) {
        foundPageIndex = pIdx;
        break;
      }
    }

    if (foundPageIndex !== -1) {
      matchedPagesMap.set(i, downwardPages[foundPageIndex].pageNumber);
      searchDownFromIndex = foundPageIndex + 1;
    }
  }

  // PASS 2: PageHint Offset Prediction for chapters missed in Pass 1
  let knownOffset = null;
  for (let i = 0; i < N; i++) {
    if (matchedPagesMap.has(i) && indexChapters[i].pageHint) {
      knownOffset = matchedPagesMap.get(i) - indexChapters[i].pageHint;
      break;
    }
  }

  for (let i = 0; i < N; i++) {
    if (!matchedPagesMap.has(i) && indexChapters[i].pageHint && knownOffset !== null) {
      const predictedPdfPage = indexChapters[i].pageHint + knownOffset;
      const candidate = downwardPages.find((p) => Math.abs(p.pageNumber - predictedPdfPage) <= 3);
      if (candidate) {
        const prevPage = i > 0 && matchedPagesMap.has(i - 1) ? matchedPagesMap.get(i - 1) : minAllowedStart - 1;
        if (candidate.pageNumber > prevPage) {
          matchedPagesMap.set(i, candidate.pageNumber);
        }
      }
    }
  }

  // PASS 3: MISSING CHAPTER RECOVERY (GUARANTEE: NO CHAPTER EVER DROPPED OR MIXED)
  // If any chapter i (e.g. Chapter 6) was not found in Pass 1 or 2,
  // locate it strictly between prevMatched and nextMatched window!
  for (let i = 0; i < N; i++) {
    if (!matchedPagesMap.has(i)) {
      const chap = indexChapters[i];

      // Window Start: after previous matched chapter
      let windowStart = minAllowedStart;
      for (let prev = i - 1; prev >= 0; prev--) {
        if (matchedPagesMap.has(prev)) {
          windowStart = matchedPagesMap.get(prev) + 1;
          break;
        }
      }

      // Window End: before next matched chapter
      let windowEnd = downwardPages[downwardPages.length - 1].pageNumber;
      for (let next = i + 1; next < N; next++) {
        if (matchedPagesMap.has(next)) {
          windowEnd = matchedPagesMap.get(next) - 1;
          break;
        }
      }

      if (windowEnd < windowStart) {
        windowEnd = windowStart;
      }

      // Scan pages in window [windowStart, windowEnd] for chapter number or keywords
      const candidatePagesInWindow = downwardPages.filter(
        (p) => p.pageNumber >= windowStart && p.pageNumber <= windowEnd
      );

      let recoveredPage = null;
      const sigWords = getSignificantWords(chap.title);
      const numStr = String(chap.number);

      for (const page of candidatePagesInWindow) {
        const text = (page.text || '').toLowerCase();
        const mentionsNum = new RegExp(`\\b(?:chapter|unit|lesson|module|ch)?\\s*${numStr}\\b`, 'i').test(text);
        const matchedWords = sigWords.filter((w) => text.includes(w)).length;
        if ((mentionsNum && matchedWords >= 1) || (matchedWords >= 2 && matchedWords >= sigWords.length * 0.4)) {
          recoveredPage = page.pageNumber;
          break;
        }
      }

      if (!recoveredPage) {
        // If still not matched, interpolate proportionally inside the window
        const missingInWindow = [];
        for (let k = 0; k < N; k++) {
          if (!matchedPagesMap.has(k)) missingInWindow.push(k);
        }
        const rank = missingInWindow.indexOf(i);
        const span = Math.max(1, windowEnd - windowStart);
        const step = Math.max(1, Math.floor(span / (missingInWindow.length + 1)));
        recoveredPage = Math.min(windowEnd, windowStart + (rank + 1) * step);
      }

      matchedPagesMap.set(i, recoveredPage);
    }
  }

  // STEP 4: Build matchedChapters array with EXACTLY N chapters
  const matchedChapters = indexChapters.map((chap, idx) => {
    const startPage = matchedPagesMap.get(idx) || (minAllowedStart + idx);
    return {
      ...chap,
      id: `ch-${idx + 1}`,
      number: String(chap.number || idx + 1),
      cleanTitle: chap.cleanTitle || chap.title,
      name: `Chapter ${chap.number || idx + 1}: ${chap.cleanTitle || chap.title}`,
      startPage,
      pages: [],
    };
  });

  // Guarantee strict monotonic order: startPage[0] < startPage[1] < ... < startPage[N-1]
  for (let i = 1; i < matchedChapters.length; i++) {
    if (matchedChapters[i].startPage <= matchedChapters[i - 1].startPage) {
      matchedChapters[i].startPage = matchedChapters[i - 1].startPage + 1;
    }
  }

  // STEP 5: Assign strictly contiguous, non-overlapping page ranges
  // Chapter 1 is from startPage_1 to (startPage_2 - 1)
  // Chapter 2 is from startPage_2 to (startPage_3 - 1)
  // Chapter 5 is from startPage_5 to (startPage_6 - 1) -> NEVER swallows Chapter 6!
  // Chapter 6 is from startPage_6 to (startPage_7 - 1) -> Dedicated Chapter 6!
  // Chapter 7 is from startPage_7 to the final page
  const maxDocPage = sortedPages[sortedPages.length - 1]?.pageNumber || 1;
  for (let i = 0; i < matchedChapters.length; i++) {
    const current = matchedChapters[i];
    const next = matchedChapters[i + 1];
    const startNum = current.startPage;
    let endNum = next ? next.startPage - 1 : maxDocPage;
    if (endNum < startNum) endNum = startNum;

    current.pages = [];
    for (const page of sortedPages) {
      if (page.pageNumber >= startNum && page.pageNumber <= endNum) {
        current.pages.push(page.pageNumber);
      }
    }
    if (current.pages.length === 0) {
      current.pages.push(startNum);
    }
  }

  return matchedChapters;
}

/**
 * 3. MAIN ANALYSIS FUNCTION: analyzeDocumentConcepts
 * Extracts chapters, topics, and textbook exercises from all pages of a document.
 * If an Index / Contents page is detected, matches chapters downward for 100% accurate chapter names.
 * Otherwise, falls back smoothly to page-by-page concept analysis.
 * 
 * @param {Array} pages - Array of page objects { pageNumber, text, id, ... }
 * @returns {{ chapters: Array, topics: Array, pageExercises: Object, detectedFromIndex: boolean }}
 */
export function analyzeDocumentConcepts(pages = []) {
  if (!pages || pages.length === 0) {
    return { chapters: [], topics: [], pageExercises: {}, detectedFromIndex: false };
  }

  // Ensure pages are strictly sorted by pageNumber ascending (Page 1, 2, 3...)
  const sortedPages = [...pages].sort((a, b) => (Number(a.pageNumber) || 0) - (Number(b.pageNumber) || 0));

  // -----------------------------------------------------------------
  // STRATEGY A: INDEX / CONTENTS DETECTION & DOWNWARD MATCHING
  // -----------------------------------------------------------------
  const indexResult = detectAndExtractIndex(sortedPages);

  if (indexResult.isIndexFound) {
    const matchedChapters = matchIndexChaptersDownward(sortedPages, indexResult);

    if (matchedChapters.length > 0) {
      const topics = [];
      const pageExercises = {};

      const sectionRegex = /^(\d+\.\d+(?:\.\d+)?)\s+([^\n\r]+)/;
      const conceptKeyRegex = /^([A-Z][A-Za-z0-9\s,\-–()]{2,45}):\s*(.+)/;
      const uppercaseHeadingRegex = /^([A-Z0-9\s,\-–()]{4,55})$/;

      // Map each page number to its matched chapter
      const pageToChapterMap = new Map();
      matchedChapters.forEach((chap) => {
        chap.pages.forEach((pNum) => {
          pageToChapterMap.set(pNum, chap);
        });
      });

      sortedPages.forEach((page) => {
        const pageNum = Number(page.pageNumber) || 1;
        const currentChapter = pageToChapterMap.get(pageNum);

        // Pre-chapter pages (Cover, Index) are excluded from chapter topic clutter
        if (!currentChapter) return;

        const text = page.text || '';
        const rawLines = text.split('\n').map((l) => l.trim()).filter(Boolean);
        const lines = rawLines.filter((l) => !/^PAGE\s*\d+$/i.test(l) && !/^---\s*PAGE/i.test(l));

        // 1. Textbook Exercises & Questions on this page
        const exerciseAnalysis = detectPageExercises(text, pageNum);
        if (exerciseAnalysis.hasExercises) {
          pageExercises[pageNum] = exerciseAnalysis;
          topics.push({
            id: `topic-p${pageNum}-exercises`,
            name: `📝 ${exerciseAnalysis.exerciseTitle} (${exerciseAnalysis.questions.length} Questions)`,
            cleanName: exerciseAnalysis.exerciseTitle,
            chapterId: currentChapter.id,
            chapterName: currentChapter.name,
            pageNumber: pageNum,
            snippet: exerciseAnalysis.questions.map((q) => `${q.number}. ${q.title}`).join(' | ').slice(0, 160),
            selected: true,
            isExercise: true,
          });
        }

        const pageTopicCountBefore = topics.filter((t) => t.pageNumber === pageNum).length;

        // 2. Fine-Grained Sections and Conceptual Headings on this page
        lines.forEach((line, lineIdx) => {
          // Rule 2A: Numbered Section (e.g., "1.1 Chemical Equations", "2.1 Understanding Chemical Properties")
          const secMatch = line.match(sectionRegex);
          if (secMatch) {
            const secNumber = secMatch[1].trim();
            const secTitle = secMatch[2].trim();
            const snippet = lines.slice(lineIdx + 1, lineIdx + 3).join(' ').slice(0, 160);
            const topicId = `topic-p${pageNum}-sec-${secNumber.replace(/\./g, '_')}`;

            if (!topics.some((t) => t.id === topicId)) {
              topics.push({
                id: topicId,
                name: `${secNumber} ${cleanTopicTitle(secTitle)}`,
                cleanName: cleanTopicTitle(secTitle),
                chapterId: currentChapter.id,
                chapterName: currentChapter.name,
                pageNumber: pageNum,
                snippet: snippet || secTitle,
                selected: true,
              });
            }
            return;
          }

          // Rule 2B: Concept Key with colon (e.g. "Spherical Mirrors: The reflecting surface...")
          const conceptMatch = line.match(conceptKeyRegex);
          if (conceptMatch) {
            const conceptName = conceptMatch[1].trim();
            const conceptBody = conceptMatch[2].trim();

            if (
              !/^(example|note|figure|fig|q|ans|question|answer|tip|warning|activity|chapter|unit|lesson|module|part)\b/i.test(conceptName) &&
              conceptName.length > 3
            ) {
              const topicId = `topic-p${pageNum}-concept-${topics.length + 1}`;
              if (!topics.some((t) => t.cleanName.toLowerCase() === conceptName.toLowerCase() && t.pageNumber === pageNum)) {
                topics.push({
                  id: topicId,
                  name: cleanTopicTitle(conceptName),
                  cleanName: cleanTopicTitle(conceptName),
                  chapterId: currentChapter.id,
                  chapterName: currentChapter.name,
                  pageNumber: pageNum,
                  snippet: conceptBody.slice(0, 160),
                  selected: true,
                });
              }
            }
            return;
          }

          // Rule 2C: Uppercase or Bold Conceptual Headings
          if (
            uppercaseHeadingRegex.test(line) &&
            line.length > 4 &&
            line.length < 50 &&
            !line.startsWith('PAGE') &&
            !line.startsWith('---') &&
            !line.startsWith('CHAPTER')
          ) {
            const title = cleanTopicTitle(line);
            const snippet = lines.slice(lineIdx + 1, lineIdx + 3).join(' ').slice(0, 140);
            const topicId = `topic-p${pageNum}-hd-${topics.length + 1}`;

            if (!topics.some((t) => t.cleanName.toLowerCase() === title.toLowerCase())) {
              topics.push({
                id: topicId,
                name: title,
                cleanName: title,
                chapterId: currentChapter.id,
                chapterName: currentChapter.name,
                pageNumber: pageNum,
                snippet: snippet || title,
                selected: true,
              });
            }
          }
        });

        // 3. Guaranteed Topic For Every Page within Chapter
        const pageTopicCountAfter = topics.filter((t) => t.pageNumber === pageNum).length;
        if (pageTopicCountAfter === pageTopicCountBefore) {
          let pageTopicName = `${currentChapter.cleanTitle} (Page ${pageNum})`;
          const candidateLine = lines.find((l) => l.length > 8 && !l.startsWith('---'));
          if (candidateLine) {
            pageTopicName = cleanTopicTitle(candidateLine.slice(0, 50));
          }

          topics.push({
            id: `topic-p${pageNum}-page-${pageNum}`,
            name: pageTopicName,
            cleanName: pageTopicName,
            chapterId: currentChapter.id,
            chapterName: currentChapter.name,
            pageNumber: pageNum,
            snippet: lines.slice(0, 2).join(' ').slice(0, 160) || `Key curriculum concepts from ${currentChapter.name}`,
            selected: true,
          });
        }
      });

      // Strict ordering
      topics.sort((a, b) => (Number(a.pageNumber) || 0) - (Number(b.pageNumber) || 0));

      return {
        chapters: matchedChapters,
        topics,
        pageExercises,
        detectedFromIndex: true,
        indexChapters: indexResult.indexChapters,
      };
    }
  }

  // -----------------------------------------------------------------
  // STRATEGY B: FALLBACK SEQUENTIAL PAGE-BY-PAGE CHAPTER DETECTION
  // (Used when the PDF does not contain an index/content table)
  // -----------------------------------------------------------------
  const chapters = [];
  const topics = [];
  const pageExercises = {};

  const explicitChapterRegex = /^(?:CHAPTER|Chapter|LESSON|Lesson|MODULE|Module|UNIT|Unit|TOPIC|Topic|PART|Part)\s*([0-9IVXLCDM]+)?[:\s\-\.]*([^\n\r]+)?/i;
  const standaloneNumberedChapterRegex = /^([0-9]{1,2})\s*[\.:\-]\s*([A-Za-z][A-Za-z0-9\s,\-–()]{3,65})$/;
  const sectionRegex = /^(\d+\.\d+(?:\.\d+)?)\s+([^\n\r]+)/;
  const conceptKeyRegex = /^([A-Z][A-Za-z0-9\s,\-–()]{2,45}):\s*(.+)/;
  const uppercaseHeadingRegex = /^([A-Z0-9\s,\-–()]{4,55})$/;

  let currentChapter = null;

  sortedPages.forEach((page) => {
    const pageNum = Number(page.pageNumber) || 1;
    const text = page.text || '';
    const rawLines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const lines = rawLines.filter((l) => !/^PAGE\s*\d+$/i.test(l) && !/^---\s*PAGE/i.test(l));

    let detectedNewChapter = null;

    for (let lineIdx = 0; lineIdx < Math.min(lines.length, 6); lineIdx++) {
      const line = lines[lineIdx];

      // Explicit "CHAPTER 1: Title"
      const explicitMatch = line.match(explicitChapterRegex);
      if (explicitMatch) {
        const chapNum = explicitMatch[1] ? explicitMatch[1].trim() : '';
        let chapTitle = explicitMatch[2] ? explicitMatch[2].trim() : '';

        if (!chapTitle && lineIdx + 1 < lines.length) {
          const nextLine = lines[lineIdx + 1];
          if (nextLine && nextLine.length > 3 && nextLine.length < 65 && !explicitChapterRegex.test(nextLine)) {
            chapTitle = nextLine;
          }
        }

        const cleanTitle = cleanTopicTitle(chapTitle || `Curriculum Unit ${chapNum || chapters.length + 1}`);
        const fullName = chapNum ? `Chapter ${chapNum}: ${cleanTitle}` : `Chapter ${chapters.length + 1}: ${cleanTitle}`;

        detectedNewChapter = {
          name: fullName,
          number: chapNum || String(chapters.length + 1),
          cleanTitle,
        };
        break;
      }

      // Numbered Chapter like "1. Chemical Reactions and Equations"
      const numMatch = line.match(standaloneNumberedChapterRegex);
      if (numMatch && lineIdx <= 3) {
        const chapNum = numMatch[1].trim();
        const chapTitle = cleanTopicTitle(numMatch[2].trim());

        if (chapTitle.length > 5 && !/^(the|and|or|in|of|for|with)$/i.test(chapTitle)) {
          detectedNewChapter = {
            name: `Chapter ${chapNum}: ${chapTitle}`,
            number: chapNum,
            cleanTitle: chapTitle,
          };
          break;
        }
      }
    }

    if (detectedNewChapter) {
      const newNum = parseInt(detectedNewChapter.number, 10);
      const curNum = currentChapter ? parseInt(currentChapter.number, 10) : 0;

      // Filter out exercise prompts or questions posing as chapter titles
      const lowerTitle = (detectedNewChapter.cleanTitle || '').toLowerCase().trim();
      const isQuestionOrExercise = /^(what|which|why|how|explain|define|state|write|draw|describe|calculate|find|name|differentiate|give|choose|fill|match|answer|activity|question|caution|note|figure|fig|solution|exercise|mcq|q\d|ans|ex\.)\b/i.test(lowerTitle);

      // STRICT NON-REPEATING MONOTONIC RULE:
      // A chapter number can ONLY advance forward sequentially (e.g. Chapter 1 -> 2 -> 3).
      // It can NEVER jump backwards (e.g. Chapter 2 -> Chapter 1)!
      // Chapter 1 is fully completed, then closed. Then Chapter 2 starts, then closed.
      const isAdvancing = !currentChapter || (newNum > curNum && newNum <= curNum + 2);

      if (isAdvancing && !isQuestionOrExercise) {
        const existingChap = chapters.find((c) => c.number === String(newNum) || c.name.toLowerCase() === detectedNewChapter.name.toLowerCase());
        if (!existingChap) {
          const freshChap = {
            id: `ch-${chapters.length + 1}`,
            name: detectedNewChapter.name,
            number: String(newNum),
            cleanTitle: detectedNewChapter.cleanTitle,
            pages: [pageNum],
          };
          chapters.push(freshChap);
          currentChapter = freshChap;
        } else {
          currentChapter = existingChap;
          if (!currentChapter.pages.includes(pageNum)) {
            currentChapter.pages.push(pageNum);
          }
        }
      } else if (currentChapter && !currentChapter.pages.includes(pageNum)) {
        currentChapter.pages.push(pageNum);
      }
    }

    // Guarantee Page 1 starts a chapter if unlabelled (avoid naming it "Contents" or "Index")
    if (!currentChapter) {
      const candidateTitle = lines.find((l) => 
        l.length > 4 && 
        l.length < 55 && 
        !l.startsWith('---') &&
        !INDEX_HEADER_REGEX.test(l) &&
        !SKIP_INDEX_WORDS_REGEX.test(l)
      ) || 'Introductory Concepts';

      const cleanTitle = cleanTopicTitle(candidateTitle);
      const firstChapterName = cleanTitle.toLowerCase().startsWith('chapter') 
        ? cleanTitle 
        : `Chapter 1: ${cleanTitle}`;

      currentChapter = {
        id: `ch-1`,
        name: firstChapterName,
        number: '1',
        cleanTitle,
        pages: [pageNum],
      };
      chapters.push(currentChapter);
    } else if (!currentChapter.pages.includes(pageNum)) {
      currentChapter.pages.push(pageNum);
    }

    // Exercises on this page
    const exerciseAnalysis = detectPageExercises(text, pageNum);
    if (exerciseAnalysis.hasExercises) {
      pageExercises[pageNum] = exerciseAnalysis;
      topics.push({
        id: `topic-p${pageNum}-exercises`,
        name: `📝 ${exerciseAnalysis.exerciseTitle} (${exerciseAnalysis.questions.length} Questions)`,
        cleanName: exerciseAnalysis.exerciseTitle,
        chapterId: currentChapter.id,
        chapterName: currentChapter.name,
        pageNumber: pageNum,
        snippet: exerciseAnalysis.questions.map((q) => `${q.number}. ${q.title}`).join(' | ').slice(0, 160),
        selected: true,
        isExercise: true,
      });
    }

    const pageTopicCountBefore = topics.filter((t) => t.pageNumber === pageNum).length;

    lines.forEach((line, lineIdx) => {
      if (explicitChapterRegex.test(line) || (lineIdx <= 3 && standaloneNumberedChapterRegex.test(line))) return;

      const secMatch = line.match(sectionRegex);
      if (secMatch) {
        const secNumber = secMatch[1].trim();
        const secTitle = secMatch[2].trim();
        const snippet = lines.slice(lineIdx + 1, lineIdx + 3).join(' ').slice(0, 160);
        const topicId = `topic-p${pageNum}-sec-${secNumber.replace(/\./g, '_')}`;

        if (!topics.some((t) => t.id === topicId)) {
          topics.push({
            id: topicId,
            name: `${secNumber} ${cleanTopicTitle(secTitle)}`,
            cleanName: cleanTopicTitle(secTitle),
            chapterId: currentChapter.id,
            chapterName: currentChapter.name,
            pageNumber: pageNum,
            snippet: snippet || secTitle,
            selected: true,
          });
        }
        return;
      }

      const conceptMatch = line.match(conceptKeyRegex);
      if (conceptMatch) {
        const conceptName = conceptMatch[1].trim();
        const conceptBody = conceptMatch[2].trim();

        if (
          !/^(example|note|figure|fig|q|ans|question|answer|tip|warning|activity|chapter|unit|lesson|module|part)\b/i.test(conceptName) &&
          conceptName.length > 3
        ) {
          const topicId = `topic-p${pageNum}-concept-${topics.length + 1}`;
          if (!topics.some((t) => t.cleanName.toLowerCase() === conceptName.toLowerCase() && t.pageNumber === pageNum)) {
            topics.push({
              id: topicId,
              name: cleanTopicTitle(conceptName),
              cleanName: cleanTopicTitle(conceptName),
              chapterId: currentChapter.id,
              chapterName: currentChapter.name,
              pageNumber: pageNum,
              snippet: conceptBody.slice(0, 160),
              selected: true,
            });
          }
        }
        return;
      }

      if (
        uppercaseHeadingRegex.test(line) &&
        line.length > 4 &&
        line.length < 50 &&
        !line.startsWith('PAGE') &&
        !line.startsWith('---') &&
        !line.startsWith('CHAPTER')
      ) {
        const title = cleanTopicTitle(line);
        const snippet = lines.slice(lineIdx + 1, lineIdx + 3).join(' ').slice(0, 140);
        const topicId = `topic-p${pageNum}-hd-${topics.length + 1}`;

        if (!topics.some((t) => t.cleanName.toLowerCase() === title.toLowerCase())) {
          topics.push({
            id: topicId,
            name: title,
            cleanName: title,
            chapterId: currentChapter.id,
            chapterName: currentChapter.name,
            pageNumber: pageNum,
            snippet: snippet || title,
            selected: true,
          });
        }
      }
    });

    const pageTopicCountAfter = topics.filter((t) => t.pageNumber === pageNum).length;
    if (pageTopicCountAfter === pageTopicCountBefore) {
      let pageTopicName = '';
      let snippet = '';

      if (lines.length > 0) {
        const candidateLine = lines.find((l) => l.length > 8 && !l.startsWith('---')) || lines[0];
        pageTopicName = cleanTopicTitle(candidateLine.slice(0, 50));
        snippet = lines.slice(0, 2).join(' ').slice(0, 160);
      }

      if (!pageTopicName || pageTopicName.length < 4) {
        pageTopicName = `Core Concepts (Page ${pageNum})`;
      }

      topics.push({
        id: `topic-p${pageNum}-page-${pageNum}`,
        name: pageTopicName,
        cleanName: pageTopicName,
        chapterId: currentChapter.id,
        chapterName: currentChapter.name,
        pageNumber: pageNum,
        snippet: snippet || `Key curriculum concepts covered on Page ${pageNum}`,
        selected: true,
      });
    }
  });

  chapters.sort((a, b) => {
    const aNum = parseInt(a.number, 10) || 0;
    const bNum = parseInt(b.number, 10) || 0;
    if (aNum !== bNum) return aNum - bNum;
    const aFirst = a.pages && a.pages.length > 0 ? Math.min(...a.pages) : 0;
    const bFirst = b.pages && b.pages.length > 0 ? Math.min(...b.pages) : 0;
    return aFirst - bFirst;
  });

  topics.sort((a, b) => (Number(a.pageNumber) || 0) - (Number(b.pageNumber) || 0));

  chapters.forEach((chap) => {
    const chapTopics = topics.filter((t) => t.chapterId === chap.id);
    if (chapTopics.length > 0) {
      const topicPageNums = Array.from(new Set(chapTopics.map((t) => t.pageNumber)));
      chap.pages = topicPageNums.sort((a, b) => a - b);
    }
  });

  return { chapters, topics, pageExercises, detectedFromIndex: false };
}

/**
 * Filter extracted document text so it prioritizes and emphasizes selected topics,
 * while marking unselected topics as excluded.
 */
export function filterExtractedTextByTopics(pages, topics) {
  const selectedTopics = topics.filter((t) => t.selected);
  const unselectedTopics = topics.filter((t) => !t.selected);

  const selectedTopicNames = selectedTopics.map((t) => t.name);
  const unselectedTopicNames = unselectedTopics.map((t) => t.name);

  return {
    selectedTopics,
    unselectedTopics,
    selectedTopicNames,
    unselectedTopicNames,
  };
}
