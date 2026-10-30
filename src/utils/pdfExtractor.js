import './polyfills.js';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';

// Configure PDF.js worker with legacy worker asset
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  } catch {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '6.4.299'}/legacy/build/pdf.worker.min.mjs`;
  }
}

/**
 * Render a single PDF page to a canvas and return dataURL + text.
 * Retries at multiple scales so scanned/complex pages still produce a thumbnail.
 */
async function processPdfPage(pdfDoc, pageNum, renderImages = true) {
  const page = await pdfDoc.getPage(pageNum);

  // 1. Text Extraction
  let pageText = '';
  let isImageOnly = false;

  try {
    const textContent = await page.getTextContent();
    const items = textContent.items || [];
    const lines = [];
    let currentLine = '';
    let lastY = null;

    for (const item of items) {
      const str = item.str || '';
      if (!str && !item.hasEOL) continue;

      const currentY = item.transform ? Math.round(item.transform[5]) : null;

      if (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 6) {
        if (currentLine.trim()) lines.push(currentLine.trim());
        currentLine = str;
      } else {
        currentLine += (currentLine && str ? ' ' : '') + str;
      }

      if (item.hasEOL) {
        if (currentLine.trim()) lines.push(currentLine.trim());
        currentLine = '';
        lastY = null;
      } else {
        lastY = currentY;
      }
    }

    if (currentLine.trim()) lines.push(currentLine.trim());

    pageText = lines.join('\n').trim();
    if (!pageText) {
      pageText = items.map((i) => i.str || '').join(' ').trim();
    }

    // Flag pages with barely any text as image-only / scanned
    if (!pageText || pageText.replace(/\s/g, '').length < 10) {
      isImageOnly = true;
      pageText = `[Page ${pageNum}: Image/Scanned content - Gemini Vision API required to read this page]`;
    }
  } catch (err) {
    console.warn(`Text extraction warning on page ${pageNum}:`, err);
    isImageOnly = true;
    pageText = `[Page ${pageNum}: Text extraction failed - visual content only]`;
  }

  // Fast path: If image rendering is disabled (e.g. MCQ topic extraction), skip heavy canvas
  if (!renderImages) {
    return {
      pageNumber: pageNum,
      id: `page-${pageNum}-${Date.now()}`,
      dataUrl: '',
      text: pageText || `(Page ${pageNum} content)`,
      selected: true,
      width: 595,
      height: 842,
      isImageOnly,
      renderError: null,
    };
  }
  let dataUrl = '';
  let width = 595;
  let height = 842;
  let renderError = null;

  // Exact 150 DPI scale: 150 / 72 ≈ 2.0833; fallback to 1.5 and 1.0 if memory is tight
  const scaleAttempts = [150 / 72, 1.5, 1.0];

  for (const scale of scaleAttempts) {
    let canvas = null;
    try {
      const viewport = page.getViewport({ scale });
      width = viewport.width;
      height = viewport.height;

      // Guard: extremely large canvases can crash the browser tab
      const MAX_DIM = 4096;
      if (viewport.width > MAX_DIM || viewport.height > MAX_DIM) {
        throw new Error(`Canvas too large at scale ${scale} (${Math.round(viewport.width)}x${Math.round(viewport.height)})`);
      }

      canvas = document.createElement('canvas');
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);

      const context = canvas.getContext('2d');
      if (!context) throw new Error('Could not get 2D canvas context');

      // Clear with clean white background
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({ canvasContext: context, viewport }).promise;

      // Render as 150 DPI JPEG (0.85) for diagram sharpness with 90% smaller payload than PNG
      let candidate = '';
      try {
        candidate = canvas.toDataURL('image/jpeg', 0.85);
      } catch (e) {
        candidate = canvas.toDataURL('image/png');
      }

      if (candidate && candidate.length > 200) {
        dataUrl = candidate;
        break; // success at 150 DPI
      } else {
        throw new Error('Rendered canvas produced invalid data URL');
      }
    } catch (renderErr) {
      renderError = renderErr.message;
      console.warn(`[pdfExtractor] Scale ${scale} failed for page ${pageNum}:`, renderErr.message);
      dataUrl = '';
    } finally {
      if (canvas) {
        canvas.width = 0;
        canvas.height = 0;
      }
    }
  }

  if (!dataUrl) {
    console.warn(`[pdfExtractor] All render attempts failed for page ${pageNum}. Last error:`, renderError);
  }

  return {
    pageNumber: pageNum,
    id: `page-${pageNum}-${Date.now()}`,
    dataUrl,
    text: pageText || `(Page ${pageNum} content)`,
    selected: true,
    width,
    height,
    isImageOnly,
    renderError: dataUrl ? null : (renderError || 'Rendering failed'),
  };
}

/**
 * Compute unique deterministic hash for PDF caching
 */
export async function computePdfHash(file) {
  try {
    const slice = await file.slice(0, 65536).arrayBuffer();
    const hashBuf = await crypto.subtle.digest('SHA-256', slice);
    const hashArr = Array.from(new Uint8Array(hashBuf));
    const hex = hashArr.map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
    return `pdf_${file.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_${file.size}_${hex}`;
  } catch {
    return `pdf_${file.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_${file.size}_${file.lastModified || '0'}`;
  }
}

/**
 * Extract pages and text from an uploaded PDF file.
 * @param {File} file
 * @param {Function} onProgress  Called with { current, total, status }
 * @param {Object} options  { renderImages: boolean }
 */
export async function extractPdfDocument(file, onProgress = () => {}, options = {}) {
  const renderImages = options.renderImages !== false;
  let pdfBlobUrl = '';
  try {
    pdfBlobUrl = URL.createObjectURL(file);
  } catch (e) {
    console.warn('Could not create object URL for file:', e);
  }

  const arrayBuffer = await file.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({
    data: arrayBuffer,
    cMapUrl: 'https://unpkg.com/pdfjs-dist@6.4.299/cmaps/',
    cMapPacked: true,
    disableFontFace: false,
    useSystemFonts: true,
  });

  const pdfDoc = await loadingTask.promise;
  const totalPages = pdfDoc.numPages;
  const pages = [];

  for (let i = 1; i <= totalPages; i++) {
    onProgress({ 
      current: i, 
      total: totalPages, 
      status: renderImages 
        ? `Rendering page ${i} of ${totalPages} at 150 DPI...` 
        : `Reading text from page ${i} of ${totalPages}...` 
    });
    try {
      const pageData = await processPdfPage(pdfDoc, i, renderImages);
      pages.push(pageData);
    } catch (err) {
      console.warn(`[pdfExtractor] Failed rendering page ${i}:`, err);
      pages.push({
        pageNumber: i,
        id: `page-${i}-${Date.now()}`,
        dataUrl: '',
        text: `[Page ${i}: Could not render - ${err.message}]`,
        selected: true,
        isImageOnly: true,
        renderError: err.message,
      });
    }
  }

    const pdfHash = await computePdfHash(file);

    return {
      filename: file.name,
      fileSize: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      totalPages,
      pages,
      pdfBlobUrl,
      pdfHash,
      rawFile: file,
      arrayBuffer,
    };
  }

  /**
   * Render any single PDF page to a high-resolution data URL on demand
   * @param {File|ArrayBuffer|Blob} fileOrBuffer
   * @param {number} pageNum
   * @param {number} scale
   * @returns {Promise<string|null>}
   */
  export async function renderPdfPageToDataUrl(fileOrBuffer, pageNum, scale = 1.75) {
    if (!fileOrBuffer) return null;
    try {
      const data = fileOrBuffer instanceof ArrayBuffer
        ? fileOrBuffer
        : (fileOrBuffer.arrayBuffer ? await fileOrBuffer.arrayBuffer() : null);
      if (!data) return null;

      const loadingTask = pdfjsLib.getDocument({
        data,
        cMapUrl: 'https://unpkg.com/pdfjs-dist@6.4.299/cmaps/',
        cMapPacked: true,
        disableFontFace: false,
        useSystemFonts: true,
      });

      const pdfDoc = await loadingTask.promise;
      if (pageNum < 1 || pageNum > pdfDoc.numPages) return null;

      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);

      const context = canvas.getContext('2d');
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({ canvasContext: context, viewport }).promise;

      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      canvas.width = 0;
      canvas.height = 0;
      return dataUrl;
    } catch (err) {
      console.warn(`[pdfExtractor] renderPdfPageToDataUrl failed for page ${pageNum}:`, err);
      return null;
    }
  }

  /**
   * Directly extracts / crops high-quality diagram illustration from a rendered PDF page canvas.
   * Isolates the visual graphic / illustration region without needing external AI generation.
   * @param {string} pageDataUrl - 150 DPI page image data URL
   * @returns {Promise<string>} - Cropped high-quality diagram data URL
   */
  export async function extractDiagramFromPageCanvas(pageDataUrl) {
    if (!pageDataUrl) return null;

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          const w = img.naturalWidth || img.width;
          const h = img.naturalHeight || img.height;

          if (w <= 0 || h <= 0) {
            return resolve(pageDataUrl);
          }

          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = w;
          tempCanvas.height = h;
          const ctx = tempCanvas.getContext('2d');
          ctx.drawImage(img, 0, 0);

          // Skip header (top 7%) and footer (bottom 6%)
          const topMargin = Math.round(h * 0.07);
          const bottomMargin = Math.round(h * 0.94);
          const leftMargin = Math.round(w * 0.04);
          const rightMargin = Math.round(w * 0.96);

          let minX = w, maxX = 0, minY = h, maxY = 0;
          let diagramPixelsFound = 0;

          let imgData = null;
          try {
            imgData = ctx.getImageData(0, 0, w, h).data;
          } catch {
            return resolve(pageDataUrl);
          }

          const sampleStep = 4;
          for (let y = topMargin; y < bottomMargin; y += sampleStep) {
            for (let x = leftMargin; x < rightMargin; x += sampleStep) {
              const idx = (y * w + x) * 4;
              const r = imgData[idx];
              const g = imgData[idx + 1];
              const b = imgData[idx + 2];

              // Detect colorful pixels (colored scientific illustrations / biological diagrams)
              const maxVal = Math.max(r, g, b);
              const minVal = Math.min(r, g, b);
              const isColored = (maxVal - minVal) > 22 && maxVal > 40 && minVal < 240;

              // Detect dark line-art illustrations
              const isDrawingTone = (r < 195 && g < 195 && b < 195) && !(r > 245 && g > 245 && b > 245);

              if (isColored || isDrawingTone) {
                diagramPixelsFound++;
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
              }
            }
          }

          // If a prominent diagram region is detected, crop to that region with padding
          let cropX, cropY, cropW, cropH;
          if (diagramPixelsFound > 150 && (maxX - minX) > (w * 0.15) && (maxY - minY) > (h * 0.10)) {
            const padX = Math.round(w * 0.025);
            const padY = Math.round(h * 0.025);
            cropX = Math.max(0, minX - padX);
            cropY = Math.max(0, minY - padY);
            cropW = Math.min(w - cropX, (maxX - minX) + 2 * padX);
            cropH = Math.min(h - cropY, (maxY - minY) + 2 * padY);
          } else {
            // Clean crop of the page content region (excluding headers/footers)
            cropX = Math.round(w * 0.05);
            cropY = Math.round(h * 0.12);
            cropW = Math.round(w * 0.90);
            cropH = Math.round(h * 0.72);
          }

          const cropCanvas = document.createElement('canvas');
          cropCanvas.width = cropW;
          cropCanvas.height = cropH;
          const cropCtx = cropCanvas.getContext('2d');
          cropCtx.fillStyle = '#ffffff';
          cropCtx.fillRect(0, 0, cropW, cropH);
          cropCtx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

          const croppedUrl = cropCanvas.toDataURL('image/jpeg', 0.92);
          resolve(croppedUrl);
        } catch (err) {
          console.warn('Canvas diagram extraction fallback:', err);
          resolve(pageDataUrl);
        }
      };

      img.onerror = () => resolve(pageDataUrl);
      img.src = pageDataUrl;
    });
  }

/**
 * Process uploaded image files (PNG, JPG, WebP) as single-page documents.
 */
export async function processImageFile(file, index = 1) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve({
        pageNumber: index,
        id: `img-${index}-${Date.now()}`,
        dataUrl: e.target.result,
        text: `[Image source: ${file.name}]`,
        selected: true,
        filename: file.name,
        isImage: true,
        isImageOnly: true,
      });
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Extract clean text from all user-selected pages.
 */
export function getExtractedTextFromSelected(pages) {
  return pages
    .filter((p) => p.selected && p.text)
    .map((p) => `--- PAGE ${p.pageNumber} ---\n${p.text}`)
    .join('\n\n');
}

/**
 * Format selected page images as base64 parts for Gemini Vision API.
 */
export function getImagesForGemini(pages, maxPages = 4) {
  const selected = pages.filter((p) => p.selected && p.dataUrl);
  return selected.slice(0, maxPages).map((p) => {
    const base64Data = p.dataUrl.split(',')[1] || '';
    const mimeMatch = p.dataUrl.match(/^data:([^;]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    return {
      mimeType,
      data: base64Data,
      pageNumber: p.pageNumber,
    };
  });
}
