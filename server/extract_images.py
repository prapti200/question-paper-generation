import sys
import os
import json
import pymupdf as fitz

import re

def find_diagram_caption(page_text, page_num):
    # Try finding figure captions like "Fig. 1.2 : Bacteriophage" or "Figure 1.1 Structure of..."
    patterns = [
        r'(?:Fig(?:ure)?\.?|आकृति|चित्र)\s*\d+[\.\:\s]+([^\n\r]{4,80})',
        r'(?:Fig(?:ure)?\.?|आकृति|चित्र)\s*[\.\:\s]+([^\n\r]{4,80})',
    ]
    for pat in patterns:
        m = re.search(pat, page_text, re.IGNORECASE)
        if m:
            clean = m.group(0).strip().replace('\t', ' ')
            return clean[:90]

    # Look for prominent headings on the page
    lines = [l.strip() for l in page_text.split('\n') if len(l.strip()) > 3]
    for line in lines[:8]:
        if not re.search(r'^(page|\d+|standard|class|chapter|unit)\b', line, re.IGNORECASE) and len(line) < 60:
            return f"{line} (Page {page_num})"

    return f"Scientific Diagram (Page {page_num})"

def extract_images_from_pdf(pdf_path, output_dir):
    if not os.path.exists(pdf_path):
        print(json.dumps({"error": f"PDF not found: {pdf_path}"}))
        sys.exit(1)

    os.makedirs(output_dir, exist_ok=True)
    doc = fitz.open(pdf_path)
    extracted_figures = []

    for page_idx in range(len(doc)):
        page = doc[page_idx]
        page_text = page.get_text() or ""
        image_list = page.get_images(full=True)

        for img_idx, img in enumerate(image_list):
            try:
                xref = img[0]
                base_image = doc.extract_image(xref)
                width = base_image.get("width", 0)
                height = base_image.get("height", 0)

                # Skip tiny icons, header bars, or bullets (< 100px or extreme aspect ratio)
                if width < 100 or height < 100:
                    continue
                ratio = max(width, height) / max(1, min(width, height))
                if ratio > 6:
                    continue

                fig_id = f"fig_p{page_idx + 1}_{img_idx + 1}"
                filename = f"{fig_id}.png"
                file_path = os.path.join(output_dir, filename)

                # Always convert to standard web-viewable PNG
                try:
                    pix = fitz.Pixmap(doc, xref)
                    if pix.n >= 5: # e.g. CMYK or complex alpha
                        pix = fitz.Pixmap(fitz.csRGB, pix)
                    pix.save(file_path)
                    pix = None
                except Exception:
                    # Fallback write
                    with open(file_path, "wb") as f:
                        f.write(base_image["image"])

                caption = find_diagram_caption(page_text, page_idx + 1)

                extracted_figures.append({
                    "id": fig_id,
                    "page": page_idx + 1,
                    "caption": caption,
                    "imageUrl": f"/figures/{filename}",
                    "url": f"/figures/{filename}",
                    "filename": filename,
                    "width": width,
                    "height": height,
                    "labels_present": ["Part [A]", "Part [B]", "Part [C]", "Part [D]"]
                })
            except Exception as e:
                continue

    # Also extract full page renders for pages with diagrams if no raster images found
    if len(extracted_figures) == 0:
        for page_idx in range(min(10, len(doc))):
            page = doc[page_idx]
            pix = page.get_pixmap(dpi=150)
            fig_id = f"fig_page_{page_idx + 1}"
            filename = f"{fig_id}.png"
            file_path = os.path.join(output_dir, filename)
            pix.save(file_path)
            extracted_figures.append({
                "id": fig_id,
                "page": page_idx + 1,
                "caption": f"Document Page {page_idx + 1}",
                "imageUrl": f"/figures/{filename}",
                "url": f"/figures/{filename}",
                "filename": filename,
                "width": pix.width,
                "height": pix.height,
                "labels_present": ["Part [A]", "Part [B]", "Part [C]", "Part [D]"]
            })

    print(json.dumps({"figures": extracted_figures, "count": len(extracted_figures)}))

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: python extract_images.py <pdf_path> <output_dir>"}))
        sys.exit(1)
    extract_images_from_pdf(sys.argv[1], sys.argv[2])
