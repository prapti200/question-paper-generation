import { 
  PAGE_DIAGRAM_PRESETS,
  DIAGRAM_REFLECTION_PAGE1, 
  DIAGRAM_LENS_PAGE2, 
  DIAGRAM_POWER_LENS_PAGE3,
  DIAGRAM_PRISM_PAGE4,
  DIAGRAM_BACTERIOPHAGE_PAGE5,
  DIAGRAM_AEDES_PAGE18,
  DIAGRAM_HEART_PAGE21
} from './sampleDiagramSvgs.js';
import { analyzeDocumentConcepts } from './documentConceptAnalyzer.js';

// Helper to convert SVG string to Base64 Data URL
function svgToDataUrl(svgString) {
  const encoded = encodeURIComponent(svgString)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22');
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

// Visual Page 16: Health and Diseases Introduction & Classification
const PAGE_16_SVG = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 650 920" width="650" height="920" style="background:#ffffff; font-family:Arial, sans-serif;">
  <rect width="650" height="920" fill="#ffffff" />
  
  <!-- Header Bar -->
  <rect x="30" y="25" width="590" height="28" fill="#f1f5f9" rx="4" />
  <text x="45" y="44" font-size="11" font-weight="bold" fill="#475569">General Science • Standard Eight</text>
  <text x="590" y="44" font-size="11" font-weight="bold" fill="#475569" text-anchor="end">Chapter 2 • Page 16</text>

  <!-- Chapter Title -->
  <rect x="30" y="65" width="590" height="42" fill="#e0e7ff" rx="8" />
  <text x="325" y="93" font-size="19" font-weight="900" fill="#312e81" text-anchor="middle">2. Health and Diseases</text>

  <!-- Section: Can you recall? -->
  <rect x="30" y="120" width="590" height="75" fill="#fef3c7" stroke="#f59e0b" stroke-width="1.5" rx="8" />
  <text x="45" y="142" font-size="13" font-weight="bold" fill="#b45309">Can you recall ?</text>
  <text x="45" y="162" font-size="11" fill="#78350f">1. Have you ever taken leave from school due to sudden sickness?</text>
  <text x="45" y="180" font-size="11" fill="#78350f">2. What happens exactly when we become sick? Why do we need medicines?</text>

  <!-- Section: Definition of Health -->
  <text x="30" y="222" font-size="15" font-weight="bold" fill="#1e293b">What is Health ?</text>
  <rect x="30" y="232" width="590" height="50" fill="#f0fdf4" stroke="#22c55e" stroke-width="1.5" rx="8" />
  <text x="45" y="255" font-size="11.5" font-weight="bold" fill="#166534">Health is a state of complete physical, mental and social well-beingness and</text>
  <text x="45" y="272" font-size="11.5" font-weight="bold" fill="#166534">not merely the absence of any disease or physical infirmity.</text>

  <!-- Section: What is Disease? -->
  <text x="30" y="308" font-size="15" font-weight="bold" fill="#1e293b">What is Disease ?</text>
  <text x="30" y="328" font-size="11.5" fill="#334155" line-height="1.5">Condition of disturbances in physiological or psychological processes of the body is called as disease.</text>
  <text x="30" y="346" font-size="11.5" fill="#334155">Each disease has its own specific physiological symptoms and diagnostic signs.</text>

  <!-- Disease Classification Tree Diagram -->
  <rect x="30" y="370" width="590" height="260" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" rx="10" />
  <text x="325" y="395" font-size="14" font-weight="bold" fill="#1e293b" text-anchor="middle">Types of Diseases (Classification Chart)</text>

  <!-- Root box -->
  <rect x="250" y="415" width="150" height="32" fill="#4f46e5" rx="6" />
  <text x="325" y="436" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">Types of Diseases</text>

  <!-- Branches -->
  <line x1="325" y1="447" x2="325" y2="470" stroke="#64748b" stroke-width="2" />
  <line x1="175" y1="470" x2="475" y2="470" stroke="#64748b" stroke-width="2" />
  <line x1="175" y1="470" x2="175" y2="490" stroke="#64748b" stroke-width="2" />
  <line x1="475" y1="470" x2="475" y2="490" stroke="#64748b" stroke-width="2" />

  <!-- Left: According to Duration -->
  <rect x="95" y="490" width="160" height="30" fill="#0284c7" rx="5" />
  <text x="175" y="510" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">According to Duration</text>
  <rect x="95" y="530" width="160" height="55" fill="#e0f2fe" rx="5" />
  <text x="175" y="550" font-size="10.5" font-weight="bold" fill="#0369a1" text-anchor="middle">1. Chronic Diseases</text>
  <text x="175" y="568" font-size="10.5" font-weight="bold" fill="#0369a1" text-anchor="middle">2. Acute Diseases</text>

  <!-- Right: According to Reasons -->
  <rect x="395" y="490" width="160" height="30" fill="#7c3aed" rx="5" />
  <text x="475" y="510" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">According to Reasons</text>
  <rect x="395" y="530" width="160" height="85" fill="#ede9fe" rx="5" />
  <text x="475" y="548" font-size="10" font-weight="bold" fill="#5b21b6" text-anchor="middle">Hereditary (Down's syndrome)</text>
  <text x="475" y="566" font-size="10" font-weight="bold" fill="#5b21b6" text-anchor="middle">Acquired Diseases:</text>
  <text x="475" y="584" font-size="9.5" fill="#6d28d9" text-anchor="middle">• Infectious (Flu, Dengue)</text>
  <text x="475" y="600" font-size="9.5" fill="#6d28d9" text-anchor="middle">• Non-infectious (Diabetes)</text>

  <!-- Bottom Paragraph -->
  <text x="30" y="660" font-size="13" font-weight="bold" fill="#1e293b">Mode of Infection and Transmission</text>
  <text x="30" y="682" font-size="11" fill="#475569">Infection spreads from diseased person to healthy person through droplet nuclei in air,</text>
  <text x="30" y="700" font-size="11" fill="#475569">contaminated water, food and vectors such as mosquitoes and flies.</text>

  <!-- Page Footer -->
  <line x1="30" y1="880" x2="620" y2="880" stroke="#e2e8f0" stroke-width="1.5" />
  <text x="325" y="902" font-size="11" font-weight="bold" fill="#64748b" text-anchor="middle">16</text>
</svg>
`);

// Visual Page 17: Table of Infectious Diseases
const PAGE_17_SVG = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 650 920" width="650" height="920" style="background:#ffffff; font-family:Arial, sans-serif;">
  <rect width="650" height="920" fill="#ffffff" />
  
  <rect x="30" y="25" width="590" height="28" fill="#f1f5f9" rx="4" />
  <text x="45" y="44" font-size="11" font-weight="bold" fill="#475569">General Science • Standard Eight</text>
  <text x="590" y="44" font-size="11" font-weight="bold" fill="#475569" text-anchor="end">Chapter 2 • Page 17</text>

  <rect x="30" y="65" width="590" height="34" fill="#fee2e2" rx="6" />
  <text x="45" y="88" font-size="15" font-weight="bold" fill="#991b1b">A. Infectious Diseases</text>

  <text x="30" y="120" font-size="11.5" fill="#334155">
    Diseases spread through contaminated air, water, food or vectors (insects and animals) are called infectious diseases.
  </text>

  <!-- Table of Diseases -->
  <g transform="translate(30, 140)">
    <!-- Header -->
    <rect x="0" y="0" width="590" height="35" fill="#3b82f6" rx="4" />
    <text x="10" y="22" font-size="10.5" font-weight="bold" fill="#ffffff">Disease</text>
    <text x="110" y="22" font-size="10.5" font-weight="bold" fill="#ffffff">Pathogen</text>
    <text x="230" y="22" font-size="10.5" font-weight="bold" fill="#ffffff">Mode of Infection</text>
    <text x="370" y="22" font-size="10.5" font-weight="bold" fill="#ffffff">Symptoms</text>
    <text x="490" y="22" font-size="10.5" font-weight="bold" fill="#ffffff">Prevention</text>

    <!-- Row 1: Tuberculosis -->
    <rect x="0" y="40" width="590" height="55" fill="#f8fafc" stroke="#e2e8f0" />
    <text x="10" y="65" font-size="10.5" font-weight="bold" fill="#1e293b">Tuberculosis</text>
    <text x="110" y="65" font-size="10" fill="#475569">Mycobacterium</text>
    <text x="110" y="80" font-size="10" fill="#475569">tuberculosis</text>
    <text x="230" y="65" font-size="10" fill="#475569">Spitting by patient,</text>
    <text x="230" y="80" font-size="10" fill="#475569">air transmission</text>
    <text x="370" y="65" font-size="10" fill="#475569">Chronic cough,</text>
    <text x="370" y="80" font-size="10" fill="#475569">blood spitting</text>
    <text x="490" y="65" font-size="10" fill="#475569">BCG vaccine,</text>
    <text x="490" y="80" font-size="10" fill="#475569">DOTS treatment</text>

    <!-- Row 2: Hepatitis -->
    <rect x="0" y="100" width="590" height="55" fill="#ffffff" stroke="#e2e8f0" />
    <text x="10" y="125" font-size="10.5" font-weight="bold" fill="#1e293b">Hepatitis (Jaundice)</text>
    <text x="110" y="125" font-size="10" fill="#475569">Hepatitis virus</text>
    <text x="110" y="140" font-size="10" fill="#475569">(A, B, C, D, E)</text>
    <text x="230" y="125" font-size="10" fill="#475569">Contaminated water,</text>
    <text x="230" y="140" font-size="10" fill="#475569">sharing needles</text>
    <text x="370" y="125" font-size="10" fill="#475569">Anorexia, yellow</text>
    <text x="370" y="140" font-size="10" fill="#475569">urine, fatigue</text>
    <text x="490" y="125" font-size="10" fill="#475569">Drinking boiled</text>
    <text x="490" y="140" font-size="10" fill="#475569">water, hygiene</text>

    <!-- Row 3: Dysentery -->
    <rect x="0" y="160" width="590" height="55" fill="#f8fafc" stroke="#e2e8f0" />
    <text x="10" y="185" font-size="10.5" font-weight="bold" fill="#1e293b">Dysentery</text>
    <text x="110" y="185" font-size="10" fill="#475569">Bacteria, virus,</text>
    <text x="110" y="200" font-size="10" fill="#475569">Shigella, Entamoeba</text>
    <text x="230" y="185" font-size="10" fill="#475569">Contaminated</text>
    <text x="230" y="200" font-size="10" fill="#475569">food and water</text>
    <text x="370" y="185" font-size="10" fill="#475569">Watery stool,</text>
    <text x="370" y="200" font-size="10" fill="#475569">abdominal pain</text>
    <text x="490" y="185" font-size="10" fill="#475569">ORS drink,</text>
    <text x="490" y="200" font-size="10" fill="#475569">boiled water</text>

    <!-- Row 4: Cholera -->
    <rect x="0" y="220" width="590" height="55" fill="#ffffff" stroke="#e2e8f0" />
    <text x="10" y="245" font-size="10.5" font-weight="bold" fill="#1e293b">Cholera</text>
    <text x="110" y="245" font-size="10" fill="#475569">Vibrio cholerae</text>
    <text x="110" y="260" font-size="10" fill="#475569">(bacterium)</text>
    <text x="230" y="245" font-size="10" fill="#475569">Contaminated</text>
    <text x="230" y="260" font-size="10" fill="#475569">food and water</text>
    <text x="370" y="245" font-size="10" fill="#475569">Severe diarrhea,</text>
    <text x="370" y="260" font-size="10" fill="#475569">cramps in legs</text>
    <text x="490" y="245" font-size="10" fill="#475569">Vaccination,</text>
    <text x="490" y="260" font-size="10" fill="#475569">avoid open food</text>

    <!-- Row 5: Typhoid -->
    <rect x="0" y="280" width="590" height="55" fill="#f8fafc" stroke="#e2e8f0" />
    <text x="10" y="305" font-size="10.5" font-weight="bold" fill="#1e293b">Typhoid</text>
    <text x="110" y="305" font-size="10" fill="#475569">Salmonella typhi</text>
    <text x="110" y="320" font-size="10" fill="#475569">(bacterium)</text>
    <text x="230" y="305" font-size="10" fill="#475569">Contaminated</text>
    <text x="230" y="320" font-size="10" fill="#475569">food and water</text>
    <text x="370" y="305" font-size="10" fill="#475569">Fever up to 104°F,</text>
    <text x="370" y="320" font-size="10" fill="#475569">anorexia, headache</text>
    <text x="490" y="305" font-size="10" fill="#475569">Clean water,</text>
    <text x="490" y="320" font-size="10" fill="#475569">vaccination</text>
  </g>

  <!-- Section Callout -->
  <rect x="30" y="520" width="590" height="70" fill="#f0f9ff" stroke="#0ea5e9" stroke-width="1.5" rx="8" />
  <text x="45" y="545" font-size="12" font-weight="bold" fill="#0369a1">Internet My Friend :</text>
  <text x="45" y="565" font-size="11" fill="#0c4a6e">1. Search the viral diseases like Corona, Dengue, Swine Flu and their preventive vaccines.</text>
  <text x="45" y="580" font-size="11" fill="#0c4a6e">2. Collect information from nearest Primary Health Centre (PHC) about pulse polio drives.</text>

  <line x1="30" y1="880" x2="620" y2="880" stroke="#e2e8f0" stroke-width="1.5" />
  <text x="325" y="902" font-size="11" font-weight="bold" fill="#64748b" text-anchor="middle">17</text>
</svg>
`);

// Visual Page 19: Diagnosis of Swine Flu & AIDS
const PAGE_19_SVG = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 650 920" width="650" height="920" style="background:#ffffff; font-family:Arial, sans-serif;">
  <rect width="650" height="920" fill="#ffffff" />
  
  <rect x="30" y="25" width="590" height="28" fill="#f1f5f9" rx="4" />
  <text x="45" y="44" font-size="11" font-weight="bold" fill="#475569">General Science • Standard Eight</text>
  <text x="590" y="44" font-size="11" font-weight="bold" fill="#475569" text-anchor="end">Chapter 2 • Page 19</text>

  <!-- Diagnosis Box -->
  <rect x="30" y="65" width="590" height="90" fill="#fef9c3" stroke="#ca8a04" stroke-width="1.5" rx="8" />
  <text x="45" y="90" font-size="13" font-weight="bold" fill="#854d0e">Diagnosis of Swine Flu :</text>
  <text x="45" y="110" font-size="11" fill="#713f12">For diagnosis of swine flu, liquid from throat of patient is sent in laboratory.</text>
  <text x="45" y="128" font-size="11" fill="#713f12">Diagnostic facilities are available in National Institute of Virology (NIV), Pune</text>
  <text x="45" y="144" font-size="11" fill="#713f12">and National Institute of Communicable Diseases (NICD), Delhi.</text>

  <!-- AIDS Section -->
  <rect x="30" y="170" width="590" height="34" fill="#fee2e2" rx="6" />
  <text x="45" y="193" font-size="14" font-weight="bold" fill="#991b1b">AIDS (Acquired Immuno Deficiency Syndrome)</text>
  
  <text x="30" y="225" font-size="11.5" fill="#334155">This disease is caused by HIV (Human Immunodeficiency Virus). In this disease,</text>
  <text x="30" y="243" font-size="11.5" fill="#334155">victim suffers from various diseases due to progressive weakening of natural immunity.</text>

  <!-- HIV Diagram Callout -->
  <rect x="30" y="265" width="590" height="150" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" rx="8" />
  <circle cx="150" cy="340" r="45" fill="#fef2f2" stroke="#dc2626" stroke-width="2.5" />
  <circle cx="150" cy="340" r="30" fill="#fee2e2" stroke="#b91c1c" stroke-width="1.5" />
  <path d="M 135 330 Q 150 315 165 330 T 150 360" fill="none" stroke="#7f1d1d" stroke-width="2.5" />
  <text x="150" y="402" font-size="10.5" font-weight="bold" fill="#991b1b" text-anchor="middle">HIV Structure</text>

  <text x="240" y="300" font-size="12" font-weight="bold" fill="#1e293b">ELISA Test (Diagnosis) :</text>
  <text x="240" y="322" font-size="11" fill="#475569">For diagnosis of AIDS, ELISA (Enzyme-Linked</text>
  <text x="240" y="340" font-size="11" fill="#475569">Immunosorbent Assay) blood test is conducted.</text>
  <text x="240" y="365" font-size="11" font-weight="bold" fill="#dc2626">Important fact :</text>
  <text x="240" y="385" font-size="11" fill="#475569">AIDS does not spread through touch or sharing meals.</text>

  <!-- Animal Infection: Rabies -->
  <rect x="30" y="435" width="590" height="34" fill="#ede9fe" rx="6" />
  <text x="45" y="458" font-size="14" font-weight="bold" fill="#5b21b6">Infection through Animals: Rabies</text>
  <text x="30" y="490" font-size="11" fill="#334155">Rabies is a viral disease. It occurs due to the bite of the infected rabid dog, monkey, cat or rabbit.</text>
  <text x="30" y="508" font-size="11" fill="#334155">Virus enters the brain via neurons. Hydrophobia (extreme fear of water) is the primary symptom.</text>

  <line x1="30" y1="880" x2="620" y2="880" stroke="#e2e8f0" stroke-width="1.5" />
  <text x="325" y="902" font-size="11" font-weight="bold" fill="#64748b" text-anchor="middle">19</text>
</svg>
`);

// Visual Page 20: Non-Infectious Diseases (Cancer & Diabetes)
const PAGE_20_SVG = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 650 920" width="650" height="920" style="background:#ffffff; font-family:Arial, sans-serif;">
  <rect width="650" height="920" fill="#ffffff" />
  
  <rect x="30" y="25" width="590" height="28" fill="#f1f5f9" rx="4" />
  <text x="45" y="44" font-size="11" font-weight="bold" fill="#475569">General Science • Standard Eight</text>
  <text x="590" y="44" font-size="11" font-weight="bold" fill="#475569" text-anchor="end">Chapter 2 • Page 20</text>

  <rect x="30" y="65" width="590" height="34" fill="#f0fdf4" rx="6" />
  <text x="45" y="88" font-size="15" font-weight="bold" fill="#166534">B. Non-Infectious Diseases</text>
  <text x="30" y="118" font-size="11.5" fill="#334155">Diseases which do not occur through bodily infections and pathogen contact are non-infectious.</text>

  <!-- 1. Cancer -->
  <rect x="30" y="140" width="590" height="180" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5" rx="8" />
  <text x="45" y="165" font-size="13.5" font-weight="bold" fill="#0284c7">1. Cancer (Malignant Tumor)</text>
  <text x="45" y="185" font-size="11" fill="#334155">Uncontrolled and abnormal cell growth is called cancer. Group of cells forms malignant tumor.</text>
  <text x="45" y="205" font-size="11" font-weight="bold" fill="#1e293b">Reasons :</text>
  <text x="45" y="222" font-size="11" fill="#475569">Consumption of tobacco, gutkha, smoking, alcoholism, lack of fibers (fruits &amp; leafy vegetables).</text>
  <text x="45" y="245" font-size="11" font-weight="bold" fill="#1e293b">Symptoms :</text>
  <text x="45" y="262" font-size="11" fill="#475569">Chronic cough, hoarse voice, difficulty in swallowing, incurable scar or ulcer, lumps in breast.</text>
  <text x="45" y="285" font-size="11" font-weight="bold" fill="#16a34a">Modern Diagnosis &amp; Treatment :</text>
  <text x="45" y="302" font-size="11" fill="#475569">CT scan, MRI scan, sonography, chemotherapy, radiation therapy, robotic surgery.</text>

  <!-- 2. Diabetes -->
  <rect x="30" y="335" width="590" height="175" fill="#fdf2f8" stroke="#f472b6" stroke-width="1.5" rx="8" />
  <text x="45" y="360" font-size="13.5" font-weight="bold" fill="#be185d">2. Diabetes</text>
  <text x="45" y="380" font-size="11" fill="#334155">Hormone insulin produced in pancreas controls the quantity of glucose / sugar in blood.</text>
  <text x="45" y="398" font-size="11" fill="#334155">If insulin is secreted in low quantity, glucose level cannot be controlled (Hyperglycemia).</text>
  <text x="45" y="420" font-size="11" font-weight="bold" fill="#1e293b">Symptoms :</text>
  <text x="45" y="438" font-size="11" fill="#475569">Frequent urination at night, increased thirst, unexplained weight loss or severe fatigue.</text>
  <text x="45" y="460" font-size="11" font-weight="bold" fill="#1e293b">Reasons :</text>
  <text x="45" y="478" font-size="11" fill="#475569">Heredity, obesity, lack of physical exercise, mental stress.</text>

  <line x1="30" y1="880" x2="620" y2="880" stroke="#e2e8f0" stroke-width="1.5" />
  <text x="325" y="902" font-size="11" font-weight="bold" fill="#64748b" text-anchor="middle">20</text>
</svg>
`);

// ─────────────────────────────────────────────────────────────────────────────
// DATASETS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 1. Default Document: Maharashtra Class 8 General Science - Chapter 2: Health and Diseases
 * Pages 16 to 21 with authentic textbook SVG graphics and diagrams
 */
export function getDefaultSamplePages() {
  return [
    {
      pageNumber: 16,
      id: 'page-16-health-intro',
      dataUrl: PAGE_16_SVG,
      text: `CHAPTER 2: HEALTH AND DISEASES\n2.1 CONCEPT OF HEALTH AND DISEASE\nHealth: Health is a state of complete physical, mental and social well-beingness and not merely the absence of any disease.\n\nWhat is Disease?\nCondition of disturbances in physiological or psychological processes of body is called as disease. Each disease has its own specific symptoms.\n\nTypes of Diseases:\n1. According to Duration: Chronic diseases (long duration), Acute diseases (short duration).\n2. According to Reasons:\n- Hereditary diseases (e.g. Down's syndrome).\n- Acquired diseases: (a) Infectious diseases (e.g. Common cold, Flu, Dengue), (b) Non-infectious diseases (e.g. Diabetes, Heart disease).`,
      selected: true,
    },
    {
      pageNumber: 17,
      id: 'page-17-infectious-table',
      dataUrl: PAGE_17_SVG,
      text: `A. INFECTIOUS DISEASES\nDiseases spread through contaminated air, water, food or vectors (insects and other animals) are called as infectious diseases.\n\nTable of Infectious Diseases:\n1. Tuberculosis: Pathogen: Mycobacterium tuberculosis. Mode: Spitting, air droplets. Symptoms: Chronic cough, bloody sputum, emaciation. Prevention: BCG vaccine, isolation, DOTS.\n2. Hepatitis (Jaundice): Pathogen: Hepatitis virus (A, B, C, D, E). Mode: Contaminated water, sharing needles. Symptoms: Anorexia, yellow urine, general weakness. Prevention: Boiled water, clean hands.\n3. Dysentery: Pathogen: Bacteria, virus, Shigella, Entamoeba histolytica. Symptoms: Watery stool, abdominal pain. Prevention: ORS solution, boiled water.\n4. Cholera: Pathogen: Vibrio cholerae. Symptoms: Severe diarrhea, vomiting, cramps. Prevention: Vaccination, hygienic food.\n5. Typhoid: Pathogen: Salmonella typhi. Symptoms: High fever up to 104°F, anorexia, headache. Prevention: Clean water, vaccination.`,
      selected: false,
    },
    {
      pageNumber: 18,
      id: 'page-18-dengue-swineflu',
      dataUrl: DIAGRAM_AEDES_PAGE18,
      diagramPreset: PAGE_DIAGRAM_PRESETS[18],
      text: `SOME IMPORTANT DISEASES OF PRESENT DAYS\n1. Dengue:\nMosquitoes lay eggs in water-logged places and their population increases. Dengue is caused by DEN-1, 4 virus belonging to Flavivirus genus. Vector: Aedes aegypti mosquito.\nSymptoms of Dengue: Acute fever, severe headache, vomiting. Pain in eye sockets is very prominent symptom. Decrease in platelet count (thrombocytopenia) leads to internal hemorrhages.\n\n2. Swine Flu:\nReasons of infection: Infection occurs through contact with pigs and infected humans. Viruses of swine flu spread through secretions of nose, throat and saliva. Caused by Influenza A (H1N1) virus.\nSymptoms: Difficulty in breathing, sore throat, body pains.`,
      selected: false,
    },
    {
      pageNumber: 19,
      id: 'page-19-aids-rabies',
      dataUrl: PAGE_19_SVG,
      text: `DIAGNOSIS OF SWINE FLU & AIDS\nDiagnosis of Swine Flu: Liquid from throat of patient is sent to National Institute of Virology (NIV), Pune, and NICD Delhi.\n\nAIDS (Acquired Immuno Deficiency Syndrome):\nCaused by HIV (Human Immunodeficiency Virus). Progressive weakening of natural immune system. ELISA (Enzyme-Linked Immunosorbent Assay) blood test is conducted for diagnosis.\n\nInfections through Animals - Rabies:\nViral disease transmitted by bite of rabid animals (dogs, monkeys, cats). Virus enters central nervous system via neurons. Hydrophobia (extreme fear of water) is prominent symptom. Fatal disease, prevented by rabies vaccination before symptoms appear.`,
      selected: false,
    },
    {
      pageNumber: 20,
      id: 'page-20-cancer-diabetes',
      dataUrl: PAGE_20_SVG,
      text: `B. NON-INFECTIOUS DISEASES\nDiseases which do not occur through infections and body contacts are called non-infectious diseases.\n\n1. Cancer:\nUncontrolled and abnormal cell division is called cancer. Cluster of cells forms malignant tumor. Reasons: Tobacco, gutkha, smoking, radiation, lack of fiber. Symptoms: Chronic cough, lumps in body, incurable ulcers. Treatment: Chemotherapy, radiation, robotic surgery.\n\n2. Diabetes:\nHormone insulin produced in pancreas controls blood sugar levels. Low insulin secretion causes excess glucose in blood. Symptoms: Frequent urination at night, weight loss or obesity. Controlled by diet, exercise, insulin injection.`,
      selected: false,
    },
    {
      pageNumber: 21,
      id: 'page-21-heart-disease',
      dataUrl: DIAGRAM_HEART_PAGE21,
      diagramPreset: PAGE_DIAGRAM_PRESETS[21],
      text: `HEART DISEASES & FIRST AID\nEfficiency of heart decreases due to decreased blood supply, oxygen and nutrient supply to myocardium.\nHeart Attack (Myocardial Infarction): Immediate medical assistance needed.\nSymptoms: Severe chest pain, pain in shoulder, neck and left arm, cramps in hand, sweating, restlessness, tremors.\nTreatments: Angioplasty, By-pass surgery, Open heart surgery, Heart transplantation, Stent installation, Pacemaker.\n\nFirst Aid for Heart Attack:\n1. First call 108 for ambulance.\n2. Keep patient in sleeping position on firm surface.\n3. Perform CPR (Cardio-Pulmonary Resuscitation): compress center of thorax at rate of 100 to 120 compressions per minute.`,
      selected: false,
    },
  ];
}

export function getDefaultSampleDoc() {
  const pages = getDefaultSamplePages();
  const { chapters, topics, pageExercises } = analyzeDocumentConcepts(pages);
  const detectedExercisesList = Object.values(pageExercises || {}).flatMap((pe) => pe.questions || []);

  return {
    loaded: true,
    type: 'sample',
    filename: 'Class 8 Science - Health and Diseases.pdf',
    fileSize: '3.80 MB',
    totalPages: pages.length,
    pages,
    chapters,
    topics,
    figures: [
      {
        id: 'fig_health_18',
        page: 18,
        caption: 'Aedes Aegypti Mosquito & Transmission of Dengue',
        bbox: [0.15, 0.35, 0.85, 0.75],
        labels_present: ['Head', 'Thorax', 'Proboscis', 'Striped Abdomen'],
        imageUrl: DIAGRAM_AEDES_PAGE18,
      },
      {
        id: 'fig_health_21',
        page: 21,
        caption: 'Structure & Anatomy of Human Heart',
        bbox: [0.12, 0.30, 0.88, 0.75],
        labels_present: ['Superior Vena Cava', 'Aorta', 'Right Atrium', 'Left Ventricle'],
        imageUrl: DIAGRAM_HEART_PAGE21,
      },
    ],
    pageExercises: pageExercises || {},
    selectedExercises: detectedExercisesList,
    exerciseMode: 'exact',
  };
}

/**
 * 2. Class 10 Physics: Chapter 10 - Light: Reflection and Refraction
 */
export function getPhysicsSampleDoc() {
  const pages = [
    {
      pageNumber: 1,
      id: 'page-1',
      dataUrl: DIAGRAM_REFLECTION_PAGE1,
      diagramPreset: PAGE_DIAGRAM_PRESETS[1],
      text: `CHAPTER 10: LIGHT - REFLECTION AND REFRACTION\n10.1 REFLECTION OF LIGHT\nA highly polished surface, such as a mirror, reflects most of the light falling on it. Laws of reflection:\n(1) The angle of incidence is equal to the angle of reflection (∠i = ∠r).\n(2) The incident ray, the normal to the mirror at the point of incidence and the reflected ray, all lie in the same plane.\nSpherical Mirrors: Concave mirror (curved inward), Convex mirror (curved outward). Principal focus and focal length.`,
      selected: true,
    },
    {
      pageNumber: 2,
      id: 'page-2',
      dataUrl: DIAGRAM_LENS_PAGE2,
      diagramPreset: PAGE_DIAGRAM_PRESETS[2],
      text: `10.2 IMAGE FORMATION BY SPHERICAL LENSES\nDouble convex lens converges rays. Double concave lens diverges rays.\nLens Formula: 1/f = 1/v - 1/u\nMagnification: m = h'/h = v/u. Real and virtual images.`,
      selected: false,
    },
    {
      pageNumber: 3,
      id: 'page-3',
      dataUrl: DIAGRAM_POWER_LENS_PAGE3,
      diagramPreset: PAGE_DIAGRAM_PRESETS[3],
      text: `10.3 POWER OF A LENS\nP = 1/f (in metres). SI unit is Dioptre (D). Convex lens has positive power, concave lens has negative power.`,
      selected: false,
    },
    {
      pageNumber: 4,
      id: 'page-4',
      dataUrl: DIAGRAM_PRISM_PAGE4,
      diagramPreset: PAGE_DIAGRAM_PRESETS[4],
      text: `10.4 REFRACTION THROUGH A GLASS PRISM & DISPERSION\nWhite light splits into seven colours (VIBGYOR). Red bends least, violet bends most. Atmospheric refraction explains twinkling of stars and advanced sunrise.`,
      selected: false,
    },
  ];

  const { chapters, topics, pageExercises } = analyzeDocumentConcepts(pages);
  return {
    loaded: true,
    type: 'sample',
    filename: 'Class 10 Physics - Light Reflection and Refraction.pdf',
    fileSize: '2.45 MB',
    totalPages: pages.length,
    pages,
    chapters,
    topics,
    figures: [
      {
        id: 'fig_physics_1',
        page: 1,
        caption: 'Reflection of Light on Plane Mirror Apparatus',
        bbox: [0.1, 0.25, 0.85, 0.7],
        labels_present: ['Incident Ray', 'Normal', 'Reflected Ray', 'Reflecting Surface'],
        imageUrl: DIAGRAM_REFLECTION_PAGE1,
      },
      {
        id: 'fig_physics_2',
        page: 2,
        caption: 'Ray Diagram: Image Formation by Convex Lens',
        bbox: [0.12, 0.25, 0.88, 0.72],
        labels_present: ['Principal Axis', 'Optical Centre', 'Focus F1', 'Real Inverted Image'],
        imageUrl: DIAGRAM_LENS_PAGE2,
      },
      {
        id: 'fig_physics_4',
        page: 4,
        caption: 'Dispersion of White Light through Glass Prism',
        bbox: [0.12, 0.28, 0.88, 0.72],
        labels_present: ['Incident Beam', 'Glass Prism', 'Red Ray (Least Deviated)', 'Violet Ray (Most Deviated)'],
        imageUrl: DIAGRAM_PRISM_PAGE4,
      },
    ],
    pageExercises: pageExercises || {},
    selectedExercises: Object.values(pageExercises || {}).flatMap((pe) => pe.questions || []),
    exerciseMode: 'exact',
  };
}

/**
 * 3. Class 8 Science: Chapter 1 - Living World and Classification of Microbes
 */
export function getMicrobesSampleDoc() {
  const pages = [
    {
      pageNumber: 5,
      id: 'sample-p5-science8',
      dataUrl: DIAGRAM_BACTERIOPHAGE_PAGE5,
      diagramPreset: PAGE_DIAGRAM_PRESETS[5],
      text: `CHAPTER 1: LIVING WORLD AND CLASSIFICATION OF MICROBES\n\nExercises\n1. Use Whittaker method to classify bacteria, protozoa, fungi, algae, prokaryotic and eukaryotic microbes.\nb. Write the characteristics of viruses.\nc. Explain the nutrition in fungi.\n2. Complete five kingdom method of classification.\n3. Match Column A and Column B.\n4. True or False with reasoning.\n7. Draw neat and labelled diagrams of Bacteriophage virus.`,
      selected: true,
    },
  ];

  const { chapters, topics, pageExercises } = analyzeDocumentConcepts(pages);
  return {
    loaded: true,
    type: 'sample',
    filename: 'Class 8 Science - Living World and Microbes.pdf',
    fileSize: '3.15 MB',
    totalPages: 1,
    pages,
    chapters,
    topics,
    figures: [
      {
        id: 'fig_microbes_5',
        page: 5,
        caption: 'Structural Anatomy of Bacteriophage Virus',
        bbox: [0.15, 0.25, 0.85, 0.75],
        labels_present: ['Hexagonal Protein Head', 'Viral DNA Genome', 'Collar & Sheath', 'Base Plate & Tail Fibres'],
        imageUrl: DIAGRAM_BACTERIOPHAGE_PAGE5,
      },
    ],
    pageExercises: pageExercises || {},
    selectedExercises: Object.values(pageExercises || {}).flatMap((pe) => pe.questions || []),
    exerciseMode: 'exact',
  };
}
