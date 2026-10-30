/**
 * Diagram Cropper and Management Utility
 * Crops detected bounding boxes from 150 DPI page renders and persists them to figures/<id>.png
 */

/**
 * Normalizes bbox coordinates in case coordinates are in [ymin, xmin, ymax, xmax] or inverted
 */
export function normalizeBbox(bbox) {
  if (!bbox || !Array.isArray(bbox) || bbox.length !== 4) {
    return [0.1, 0.1, 0.9, 0.9];
  }

  const [a, b, c, d] = bbox.map((v) => Math.max(0, Math.min(1, Number(v) || 0)));

  // If the values are passed as [ymin, xmin, ymax, xmax]
  let x1 = Math.min(a, c);
  let x2 = Math.max(a, c);
  let y1 = Math.min(b, d);
  let y2 = Math.max(b, d);

  // If x values appear swapped with y
  if (x2 - x1 < 0.05 && y2 - y1 > 0.1) {
    x1 = Math.min(b, d);
    x2 = Math.max(b, d);
    y1 = Math.min(a, c);
    y2 = Math.max(a, c);
  }

  // Ensure minimum dimensions
  if (x2 - x1 < 0.05) x2 = Math.min(1, x1 + 0.2);
  if (y2 - y1 < 0.05) y2 = Math.min(1, y1 + 0.2);

  return [x1, y1, x2, y2];
}

/**
 * Crop a figure from a 150 DPI page image data URL
 * @param {string} pageDataUrl - Base64 image data URL of full page (150 DPI)
 * @param {Array<number>} bbox - Normalized [x1, y1, x2, y2]
 * @returns {Promise<string>} - Cropped image base64 data URL
 */
export async function cropFigureFromDataUrl(pageDataUrl, bbox) {
  return new Promise((resolve, reject) => {
    if (!pageDataUrl) {
      return reject(new Error('No page image provided for cropping'));
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const [x1, y1, x2, y2] = normalizeBbox(bbox);

        // Add 1.5% margin padding so borders and figure labels aren't cut
        const padX = (x2 - x1) * 0.015;
        const padY = (y2 - y1) * 0.015;

        const cropX = Math.max(0, Math.round((x1 - padX) * img.naturalWidth));
        const cropY = Math.max(0, Math.round((y1 - padY) * img.naturalHeight));
        const cropW = Math.min(
          img.naturalWidth - cropX,
          Math.round((x2 - x1 + 2 * padX) * img.naturalWidth)
        );
        const cropH = Math.min(
          img.naturalHeight - cropY,
          Math.round((y2 - y1 + 2 * padY) * img.naturalHeight)
        );

        if (cropW <= 0 || cropH <= 0) {
          throw new Error('Calculated crop region has zero dimension');
        }

        const canvas = document.createElement('canvas');
        canvas.width = cropW;
        canvas.height = cropH;

        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get 2D canvas context');

        // White background for clean presentation
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, cropW, cropH);

        // Draw cropped section
        ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

        const croppedDataUrl = canvas.toDataURL('image/png', 1.0);
        resolve(croppedDataUrl);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (e) => reject(new Error('Failed to load image for cropping'));
    img.src = pageDataUrl;
  });
}

/**
 * Saves cropped figure to backend server (figures/<id>.png)
 */
export async function saveCroppedFigureToServer(id, dataUrl) {
  try {
    const res = await fetch('/api/save-figure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, dataUrl }),
    });

    if (res.ok) {
      const data = await res.json();
      return data.url || `/figures/${id}.png`;
    }
  } catch (err) {
    console.warn('Could not save figure to server API:', err.message);
  }
  return dataUrl; // fallback to in-memory data URL
}

/**
 * Crop all figures from a PDF scan result and persist them to figures/<id>.png
 * @param {Array} figures - Array of { id, page, caption, bbox, labels_present }
 * @param {Array} pages - Array of extracted pages with dataUrl
 * @returns {Promise<Array>} - Updated figures array with imageUrl and status
 */
export async function cropAndSaveAllFigures(figures = [], pages = []) {
  if (!figures || figures.length === 0) return [];

  const processed = [];

  for (const fig of figures) {
    try {
      const page = pages.find((p) => p.pageNumber === fig.page);
      if (!page || !page.dataUrl) {
        processed.push({ ...fig, imageUrl: '' });
        continue;
      }

      // Crop the figure from the 150 DPI page image
      const croppedDataUrl = await cropFigureFromDataUrl(page.dataUrl, fig.bbox);

      // Save to figures/<id>.png on server
      const serverUrl = await saveCroppedFigureToServer(fig.id, croppedDataUrl);

      processed.push({
        ...fig,
        dataUrl: croppedDataUrl,
        imageUrl: serverUrl || croppedDataUrl,
      });
    } catch (err) {
      console.warn(`Failed to crop figure ${fig.id}:`, err);
      processed.push({ ...fig, imageUrl: '' });
    }
  }

  return processed;
}
