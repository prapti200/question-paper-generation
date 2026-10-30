import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Triggers standard browser print with optimized print styles
 */
export function triggerBrowserPrint() {
  window.print();
}

/**
 * Exports an HTML element (e.g. #printable-question-paper) as a downloadable PDF
 */
export async function downloadElementAsPdf(elementId, filename = 'Question_Paper.pdf') {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id ${elementId} not found.`);
  }

  // Render element to canvas at high scale (scale: 2) for crisp examination text
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: element.scrollWidth,
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  
  // Standard A4 dimensions in mm: 210 x 297
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;

  // Calculate scaled height matching A4 width
  const imgHeight = (canvasHeight * pdfWidth) / canvasWidth;

  let heightLeft = imgHeight;
  let position = 0;

  // First page
  pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight);
  heightLeft -= pdfHeight;

  // Add subsequent pages if document is multi-page
  while (heightLeft > 0) {
    position = position - pdfHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight);
    heightLeft -= pdfHeight;
  }

  pdf.save(filename);
}

/**
 * Exports paper as clean formatted text (compatible with Microsoft Word & Google Docs)
 */
export function exportPaperAsText(paper, headerConfig) {
  let output = '';

  output += `${headerConfig.schoolName}\n`;
  if (headerConfig.affiliation) output += `${headerConfig.affiliation}\n`;
  output += `${headerConfig.examTitle}\n\n`;
  output += `SUBJECT: ${headerConfig.subject} (${headerConfig.subjectCode || ''})\n`;
  output += `CLASS: ${headerConfig.grade}    TIME: ${headerConfig.duration}    MAX. MARKS: ${headerConfig.maxMarks}\n`;
  if (headerConfig.facultyName) output += `FACULTY: ${headerConfig.facultyName}\n`;
  output += `--------------------------------------------------------------------------------\n\n`;

  if (headerConfig.instructions?.length > 0) {
    output += `GENERAL INSTRUCTIONS:\n`;
    headerConfig.instructions.forEach((inst, i) => {
      output += `${i + 1}. ${inst}\n`;
    });
    output += `\n--------------------------------------------------------------------------------\n\n`;
  }

  let qCount = 0;
  paper.sections.forEach((sec) => {
    output += `\n${sec.title}\n(${sec.instruction})\n\n`;

    sec.questions.forEach((q) => {
      qCount += 1;
      output += `Q${qCount}. ${q.question}  [${q.marks} Marks]\n`;

      if (q.type === 'mcq' && q.options) {
        q.options.forEach((opt, idx) => {
          output += `   (${String.fromCharCode(97 + idx)}) ${opt}\n`;
        });
      }

      if (q.type === 'match_following') {
        output += `   Column A                                Column B\n`;
        q.columnA?.forEach((colA, idx) => {
          const colB = q.columnB?.[idx]?.text || '';
          output += `   ${colA.text.padEnd(40)} ${colB}\n`;
        });
      }

      output += `\n`;
    });
  });

  output += `\n*** END OF QUESTION PAPER ***\n`;

  // Download as text file
  const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${headerConfig.subject || 'Question_Paper'}_Exam.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Exports paper as a styled Microsoft Word document (.doc)
 * Fully compatible with Microsoft Word, Google Docs, and LibreOffice.
 */
export function downloadPaperAsWord(paper, headerConfig = {}) {
  const school = headerConfig.schoolName || 'DELHI PUBLIC SCHOOL';
  const exam = headerConfig.examTitle || 'EXAMINATION QUESTION PAPER';
  const subject = headerConfig.subject || 'General Science';
  const grade = headerConfig.grade || 'Class 10';
  const duration = headerConfig.duration || '3 Hours';

  const totalMarks = paper.totalCalculatedMarks || paper.sections.reduce(
    (sum, sec) => sum + (sec.questions || []).reduce((qSum, q) => qSum + (Number(q.marks) || 0), 0),
    0
  );

  let docContent = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>${exam}</title>
  <style>
    body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.4; color: #111; margin: 1in; }
    h1 { font-size: 16pt; font-weight: bold; text-align: center; margin: 0 0 4pt 0; text-transform: uppercase; }
    h2 { font-size: 13pt; font-weight: bold; text-align: center; margin: 0 0 8pt 0; }
    .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 12pt; border-bottom: 1.5pt solid #000; font-family: Arial, sans-serif; font-size: 10pt; }
    .meta-table td { padding: 3pt 0; }
    .instructions { border: 1pt solid #888; background-color: #f7f7f7; padding: 6pt; margin-bottom: 14pt; font-family: Arial, sans-serif; font-size: 9.5pt; }
    .section-title { font-family: Arial, sans-serif; font-size: 11pt; font-weight: bold; text-transform: uppercase; background-color: #eaeaea; padding: 4pt 8pt; margin-top: 14pt; margin-bottom: 6pt; border-top: 1pt solid #000; border-bottom: 1pt solid #000; }
    .section-instruction { font-style: italic; font-size: 9.5pt; color: #444; margin-bottom: 8pt; }
    .question { margin-bottom: 10pt; page-break-inside: avoid; }
    .question-header { font-weight: bold; }
    .marks { float: right; font-weight: bold; font-family: Arial, sans-serif; font-size: 10pt; }
    .options-table { width: 100%; margin-top: 4pt; margin-bottom: 4pt; }
    .options-table td { width: 50%; padding: 2pt 4pt; font-family: Arial, sans-serif; font-size: 10pt; }
    .diagram-container { text-align: center; margin: 10pt 0; }
    .diagram-img { max-height: 250px; border: 1pt solid #bbb; padding: 3pt; }
    .fill-blanks { margin-top: 6pt; font-family: Arial, sans-serif; font-size: 10pt; }
    .footer { text-align: center; font-weight: bold; font-size: 10pt; border-top: 1pt solid #000; padding-top: 8pt; margin-top: 20pt; }
  </style>
</head>
<body>
  <h1>${school}</h1>
  <h2>${exam}</h2>

  <table class="meta-table">
    <tr>
      <td><strong>Subject:</strong> ${subject}</td>
      <td style="text-align: right;"><strong>Class:</strong> ${grade}</td>
    </tr>
    <tr>
      <td><strong>Time Allowed:</strong> ${duration}</td>
      <td style="text-align: right;"><strong>Maximum Marks:</strong> ${totalMarks}</td>
    </tr>
  </table>

  <div class="instructions">
    <strong>General Instructions:</strong>
    <ol style="margin: 4pt 0 0 16pt; padding: 0;">
      ${(headerConfig.instructions || [
        'All questions are compulsory.',
        'Draw neat and labeled diagrams wherever necessary.',
        'Figures to the right indicate maximum marks.',
      ]).map((inst) => `<li>${inst}</li>`).join('')}
    </ol>
  </div>
`;

  let qNumber = 0;
  (paper.sections || []).forEach((sec) => {
    const secMarks = sec.totalSectionMarks || (sec.questions || []).reduce((s, q) => s + (Number(q.marks) || 0), 0);
    docContent += `
  <div class="section-title">
    <span>SECTION ${sec.letter || ''}: ${sec.title} [${secMarks} MARKS]</span>
  </div>
  ${sec.instruction ? `<div class="section-instruction">(${sec.instruction})</div>` : ''}
`;

    (sec.questions || []).forEach((q) => {
      qNumber += 1;
      const qText = q.text || q.question || '';
      const marks = q.marks || 1;

      docContent += `
  <div class="question">
    <div style="display: flex; justify-content: space-between;">
      <span class="question-header">Q${q.number || qNumber}.</span>
      <span style="float: right; font-weight: bold;">[${marks}]</span>
      <div style="margin-left: 20pt;">${qText}</div>
    </div>
`;

      // Render image if present
      if (q.imageUrl) {
        docContent += `
    <div class="diagram-container">
      <img src="${q.imageUrl}" class="diagram-img" alt="Diagram" /><br/>
      <small><i>Figure: ${q.figureCaption || 'Diagram for observation'}</i></small>
    </div>
`;
      }

      // Render MCQ options
      if (q.type === 'mcq' && q.options && q.options.length > 0) {
        docContent += `
    <table class="options-table">
      <tr>
        <td>(A) ${q.options[0] || ''}</td>
        <td>(B) ${q.options[1] || ''}</td>
      </tr>
      ${q.options.length > 2 ? `
      <tr>
        <td>(C) ${q.options[2] || ''}</td>
        <td>(D) ${q.options[3] || ''}</td>
      </tr>` : ''}
    </table>
`;
      }

      // Render diagram labeling lines
      if (q.type === 'label_the_diagram' || q.labels_answer_key) {
        docContent += `
    <div class="fill-blanks">
      Identify and label the indicated parts:<br/>
      <table style="width: 100%; margin-top: 4pt;">
        ${(q.labels_answer_key || [{ pointer: 1 }, { pointer: 2 }, { pointer: 3 }, { pointer: 4 }]).map((item, idx) => `
        <tr>
          <td style="width: 50pt;"><strong>(${item.pointer || idx + 1})</strong></td>
          <td style="border-bottom: 1pt dotted #444;">&nbsp;</td>
        </tr>`).join('')}
      </table>
    </div>
`;
      }

      docContent += `  </div>`;
    });
  });

  docContent += `
  <div class="footer">*** END OF QUESTION PAPER ***</div>
</body>
</html>
`;

  const blob = new Blob(['\ufeff', docContent], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${subject.replace(/[^a-zA-Z0-9_-]/g, '_')}_Examination_Paper.doc`;
  a.click();
  URL.revokeObjectURL(url);
}

