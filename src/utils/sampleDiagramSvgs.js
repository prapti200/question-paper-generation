/**
 * Vector SVG Diagrams for Textbook Academic Pages
 * Clean, high-contrast scientific diagrams with crisp geometry.
 */

// Helper to convert SVG string to Base64 Data URL
function svgToDataUrl(svgString) {
  const encoded = encodeURIComponent(svgString)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22');
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

// 1. Light Reflection & Plane/Spherical Mirror Apparatus (Page 1)
export const DIAGRAM_REFLECTION_PAGE1 = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 420" width="600" height="420" style="background:#ffffff; font-family:Arial, sans-serif;">
  <rect width="600" height="420" fill="#ffffff" />
  
  <!-- Title -->
  <text x="300" y="28" font-size="15" font-weight="bold" fill="#1e293b" text-anchor="middle">Figure 10.1: Experimental Setup of Laws of Reflection</text>
  
  <!-- Mirror Surface -->
  <line x1="80" y1="280" x2="520" y2="280" stroke="#334155" stroke-width="4" stroke-linecap="round" />
  <!-- Hatch lines under mirror -->
  <g stroke="#94a3b8" stroke-width="2">
    <line x1="90" y1="280" x2="80" y2="295" />
    <line x1="130" y1="280" x2="120" y2="295" />
    <line x1="170" y1="280" x2="160" y2="295" />
    <line x1="210" y1="280" x2="200" y2="295" />
    <line x1="250" y1="280" x2="240" y2="295" />
    <line x1="290" y1="280" x2="280" y2="295" />
    <line x1="330" y1="280" x2="320" y2="295" />
    <line x1="370" y1="280" x2="360" y2="295" />
    <line x1="410" y1="280" x2="400" y2="295" />
    <line x1="450" y1="280" x2="440" y2="295" />
    <line x1="490" y1="280" x2="480" y2="295" />
  </g>

  <!-- Normal Line (Dashed) -->
  <line x1="300" y1="70" x2="300" y2="280" stroke="#64748b" stroke-width="2.5" stroke-dasharray="6,5" />

  <!-- Incident Ray -->
  <line x1="130" y1="110" x2="300" y2="280" stroke="#2563eb" stroke-width="3" />
  <!-- Arrow on incident ray -->
  <polygon points="210,190 205,178 220,185" fill="#2563eb" />

  <!-- Reflected Ray -->
  <line x1="300" y1="280" x2="470" y2="110" stroke="#dc2626" stroke-width="3" />
  <!-- Arrow on reflected ray -->
  <polygon points="380,200 395,195 390,210" fill="#dc2626" />

  <!-- Angle arcs -->
  <path d="M 270 240 A 45 45 0 0 1 298 235" fill="none" stroke="#2563eb" stroke-width="2" />
  <text x="275" y="225" font-size="13" font-weight="bold" fill="#2563eb">∠i</text>

  <path d="M 302 235 A 45 45 0 0 1 330 240" fill="none" stroke="#dc2626" stroke-width="2" />
  <text x="315" y="225" font-size="13" font-weight="bold" fill="#dc2626">∠r</text>

  <!-- Point of incidence -->
  <circle cx="300" cy="280" r="5" fill="#0f172a" />
  <text x="300" y="325" font-size="12" font-weight="bold" fill="#475569" text-anchor="middle">Point of Incidence (O)</text>

  <!-- Pin Badges (A), (B), (C), (D) for Student Labeling Questions -->
  <!-- Pin (A): Incident Ray -->
  <g transform="translate(150, 105)">
    <circle cx="0" cy="0" r="16" fill="#4f46e5" stroke="#ffffff" stroke-width="2.5" />
    <text x="0" y="5" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">A</text>
  </g>
  <line x1="166" y1="118" x2="190" y2="150" stroke="#4f46e5" stroke-width="1.5" stroke-dasharray="3,2" />

  <!-- Pin (B): Normal Line -->
  <g transform="translate(300, 65)">
    <circle cx="0" cy="0" r="16" fill="#4f46e5" stroke="#ffffff" stroke-width="2.5" />
    <text x="0" y="5" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">B</text>
  </g>

  <!-- Pin (C): Reflected Ray -->
  <g transform="translate(450, 105)">
    <circle cx="0" cy="0" r="16" fill="#4f46e5" stroke="#ffffff" stroke-width="2.5" />
    <text x="0" y="5" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">C</text>
  </g>
  <line x1="434" y1="118" x2="410" y2="150" stroke="#4f46e5" stroke-width="1.5" stroke-dasharray="3,2" />

  <!-- Pin (D): Reflecting Mirror Surface -->
  <g transform="translate(480, 310)">
    <circle cx="0" cy="0" r="16" fill="#4f46e5" stroke="#ffffff" stroke-width="2.5" />
    <text x="0" y="5" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">D</text>
  </g>
  <line x1="480" y1="294" x2="480" y2="280" stroke="#4f46e5" stroke-width="2" />

  <!-- Footnote -->
  <text x="300" y="385" font-size="12" fill="#64748b" text-anchor="middle" font-style="italic">
    Identify and label parts (A), (B), (C), and (D) in the examination.
  </text>
</svg>
`);

// 2. Refraction through Convex Lens (Page 2)
export const DIAGRAM_LENS_PAGE2 = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400" style="background:#ffffff; font-family:Arial, sans-serif;">
  <rect width="600" height="400" fill="#ffffff" />
  
  <text x="300" y="28" font-size="15" font-weight="bold" fill="#1e293b" text-anchor="middle">Figure 10.2: Ray Diagram of Refraction through a Convex Lens</text>

  <!-- Principal Axis -->
  <line x1="30" y1="200" x2="570" y2="200" stroke="#334155" stroke-width="2" />
  <text x="540" y="190" font-size="11" fill="#475569">Principal Axis</text>

  <!-- Convex Lens (Symmetric double curve) -->
  <path d="M 300 60 Q 340 200 300 340 Q 260 200 300 60 Z" fill="#e0f2fe" stroke="#0284c7" stroke-width="3" opacity="0.85" />
  <!-- Lens centerline -->
  <line x1="300" y1="50" x2="300" y2="350" stroke="#0284c7" stroke-width="1.5" stroke-dasharray="4,4" />

  <!-- Points F1, 2F1, O, F2, 2F2 -->
  <circle cx="160" cy="200" r="4" fill="#0f172a" />
  <text x="160" y="222" font-size="12" font-weight="bold" fill="#1e293b" text-anchor="middle">2F₁</text>

  <circle cx="230" cy="200" r="4" fill="#0f172a" />
  <text x="230" y="222" font-size="12" font-weight="bold" fill="#1e293b" text-anchor="middle">F₁</text>

  <circle cx="300" cy="200" r="4" fill="#0f172a" />
  <text x="300" y="222" font-size="12" font-weight="bold" fill="#1e293b" text-anchor="middle">O</text>

  <circle cx="370" cy="200" r="4" fill="#0f172a" />
  <text x="370" y="222" font-size="12" font-weight="bold" fill="#1e293b" text-anchor="middle">F₂</text>

  <circle cx="440" cy="200" r="4" fill="#0f172a" />
  <text x="440" y="222" font-size="12" font-weight="bold" fill="#1e293b" text-anchor="middle">2F₂</text>

  <!-- Object AB -->
  <line x1="160" y1="200" x2="160" y2="120" stroke="#16a34a" stroke-width="4" stroke-linecap="round" />
  <polygon points="160,110 154,124 166,124" fill="#16a34a" />
  <text x="145" y="125" font-size="13" font-weight="bold" fill="#16a34a">A</text>
  <text x="145" y="215" font-size="13" font-weight="bold" fill="#16a34a">B</text>

  <!-- Incident Ray 1: Parallel to axis, refracts through F2 -->
  <line x1="160" y1="120" x2="300" y2="120" stroke="#2563eb" stroke-width="2.5" />
  <line x1="300" y1="120" x2="440" y2="280" stroke="#2563eb" stroke-width="2.5" />

  <!-- Incident Ray 2: Passes through Optical Centre O unbent -->
  <line x1="160" y1="120" x2="440" y2="280" stroke="#ea580c" stroke-width="2.5" />

  <!-- Real Inverted Image A'B' at 2F2 -->
  <line x1="440" y1="200" x2="440" y2="280" stroke="#dc2626" stroke-width="4" stroke-linecap="round" />
  <polygon points="440,290 434,276 446,276" fill="#dc2626" />
  <text x="455" y="280" font-size="13" font-weight="bold" fill="#dc2626">A'</text>
  <text x="455" y="215" font-size="13" font-weight="bold" fill="#dc2626">B'</text>

  <!-- Pin Badges (A), (B), (C), (D) for Student Labeling Questions -->
  <!-- Pin (A): Optical Centre (O) -->
  <g transform="translate(300, 160)">
    <circle cx="0" cy="0" r="15" fill="#4f46e5" stroke="#ffffff" stroke-width="2.5" />
    <text x="0" y="5" font-size="13" font-weight="bold" fill="#ffffff" text-anchor="middle">A</text>
  </g>

  <!-- Pin (B): Principal Focus (F₂) -->
  <g transform="translate(370, 245)">
    <circle cx="0" cy="0" r="15" fill="#4f46e5" stroke="#ffffff" stroke-width="2.5" />
    <text x="0" y="5" font-size="13" font-weight="bold" fill="#ffffff" text-anchor="middle">B</text>
  </g>

  <!-- Pin (C): Real and Inverted Image -->
  <g transform="translate(485, 275)">
    <circle cx="0" cy="0" r="15" fill="#4f46e5" stroke="#ffffff" stroke-width="2.5" />
    <text x="0" y="5" font-size="13" font-weight="bold" fill="#ffffff" text-anchor="middle">C</text>
  </g>
  <line x1="470" y1="275" x2="445" y2="275" stroke="#4f46e5" stroke-width="1.5" stroke-dasharray="3,2" />

  <!-- Pin (D): Convex Lens Surface -->
  <g transform="translate(325, 75)">
    <circle cx="0" cy="0" r="15" fill="#4f46e5" stroke="#ffffff" stroke-width="2.5" />
    <text x="0" y="5" font-size="13" font-weight="bold" fill="#ffffff" text-anchor="middle">D</text>
  </g>

  <text x="300" y="375" font-size="12" fill="#64748b" text-anchor="middle" font-style="italic">
    Identify and label components (A), (B), (C), and (D).
  </text>
</svg>
`);

// 2.5 Converging Power and Focal Length of Convex Lens (Page 3)
export const DIAGRAM_POWER_LENS_PAGE3 = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400" style="background:#ffffff; font-family:Arial, sans-serif;">
  <rect width="600" height="400" fill="#ffffff" />
  <text x="300" y="28" font-size="15" font-weight="bold" fill="#1e293b" text-anchor="middle">Figure 10.3: Converging Power of a Convex Lens (P = 1/f)</text>
  
  <!-- Principal Axis -->
  <line x1="50" y1="200" x2="550" y2="200" stroke="#64748b" stroke-width="2" stroke-dasharray="5,4" />
  
  <!-- Convex Lens Body -->
  <path d="M 280 60 Q 300 130 300 200 Q 300 270 280 340 Q 320 270 320 200 Q 320 130 280 60 Z" fill="#e0f2fe" stroke="#0284c7" stroke-width="3" opacity="0.95" />
  <line x1="300" y1="50" x2="300" y2="350" stroke="#0284c7" stroke-width="1.5" stroke-dasharray="4,4" />

  <!-- Parallel Incoming Rays -->
  <line x1="80" y1="130" x2="295" y2="130" stroke="#2563eb" stroke-width="2.5" />
  <polygon points="180,130 170,125 170,135" fill="#2563eb" />
  
  <line x1="80" y1="270" x2="295" y2="270" stroke="#2563eb" stroke-width="2.5" />
  <polygon points="180,270 170,265 170,275" fill="#2563eb" />

  <!-- Converging Rays through Principal Focus F2 -->
  <line x1="295" y1="130" x2="450" y2="200" stroke="#dc2626" stroke-width="2.5" />
  <polygon points="380,169 368,162 373,174" fill="#dc2626" />
  
  <line x1="295" y1="270" x2="450" y2="200" stroke="#dc2626" stroke-width="2.5" />
  <polygon points="380,231 373,226 368,238" fill="#dc2626" />

  <!-- Undeviated central ray -->
  <line x1="80" y1="200" x2="530" y2="200" stroke="#0f172a" stroke-width="2" />

  <!-- Focus F2 point -->
  <circle cx="450" cy="200" r="5" fill="#dc2626" />
  <text x="450" y="225" font-size="13" font-weight="bold" fill="#dc2626" text-anchor="middle">F₂ (Focus)</text>

  <!-- Optical Centre O -->
  <circle cx="300" cy="200" r="4" fill="#0f172a" />
  <text x="290" y="220" font-size="12" font-weight="bold" fill="#334155">O</text>

  <!-- Focal Length dimension -->
  <line x1="300" y1="250" x2="450" y2="250" stroke="#047857" stroke-width="2" />
  <polygon points="300,250 310,246 310,254" fill="#047857" />
  <polygon points="450,250 440,246 440,254" fill="#047857" />
  <text x="375" y="270" font-size="13" font-weight="bold" fill="#047857" text-anchor="middle">Focal Length (f)</text>

  <!-- Pins A, B, C, D -->
  <!-- Pin A: Parallel Incident Ray -->
  <g transform="translate(130, 95)">
    <circle cx="0" cy="0" r="16" fill="#4f46e5" stroke="#ffffff" stroke-width="2.5" />
    <text x="0" y="5" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">A</text>
  </g>
  <line x1="130" y1="112" x2="130" y2="130" stroke="#4f46e5" stroke-width="1.5" stroke-dasharray="3,2" />

  <!-- Pin B: Optical Centre (O) -->
  <g transform="translate(260, 160)">
    <circle cx="0" cy="0" r="16" fill="#4f46e5" stroke="#ffffff" stroke-width="2.5" />
    <text x="0" y="5" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">B</text>
  </g>
  <line x1="274" y1="170" x2="300" y2="200" stroke="#4f46e5" stroke-width="1.5" stroke-dasharray="3,2" />

  <!-- Pin C: Principal Focus (F₂) -->
  <g transform="translate(450, 140)">
    <circle cx="0" cy="0" r="16" fill="#4f46e5" stroke="#ffffff" stroke-width="2.5" />
    <text x="0" y="5" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">C</text>
  </g>
  <line x1="450" y1="156" x2="450" y2="195" stroke="#4f46e5" stroke-width="1.5" stroke-dasharray="3,2" />

  <!-- Pin D: Convex Lens Boundary -->
  <g transform="translate(345, 90)">
    <circle cx="0" cy="0" r="16" fill="#4f46e5" stroke="#ffffff" stroke-width="2.5" />
    <text x="0" y="5" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">D</text>
  </g>

  <text x="300" y="380" font-size="12" fill="#64748b" text-anchor="middle" font-style="italic">
    Identify and label optical parts (A), (B), (C), and (D).
  </text>
</svg>
`);

// 3. Dispersion through Glass Prism (Page 4)
export const DIAGRAM_PRISM_PAGE4 = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 420" width="600" height="420" style="background:#ffffff; font-family:Arial, sans-serif;">
  <rect width="600" height="420" fill="#ffffff" />
  
  <text x="300" y="28" font-size="15" font-weight="bold" fill="#1e293b" text-anchor="middle">Figure 10.4: Dispersion of White Light by a Glass Prism</text>

  <!-- Glass Prism Triangle -->
  <polygon points="300,70 170,320 430,320" fill="#f1f5f9" stroke="#0284c7" stroke-width="3" opacity="0.9" />

  <!-- Incident White Light Beam -->
  <line x1="60" y1="240" x2="225" y2="210" stroke="#475569" stroke-width="4" stroke-linecap="round" />
  <polygon points="150,225 138,218 142,232" fill="#475569" />
  <text x="110" y="260" font-size="13" font-weight="bold" fill="#334155">White Light Ray</text>

  <!-- Spectrum Lines exiting prism -->
  <!-- Red ray (Least deviated) -->
  <line x1="225" y1="210" x2="350" y2="230" stroke="#dc2626" stroke-width="2.5" />
  <line x1="350" y1="230" x2="520" y2="180" stroke="#dc2626" stroke-width="3" />
  <text x="530" y="185" font-size="12" font-weight="bold" fill="#dc2626">Red (R)</text>

  <!-- Yellow ray -->
  <line x1="225" y1="210" x2="355" y2="242" stroke="#eab308" stroke-width="2" />
  <line x1="355" y1="242" x2="520" y2="225" stroke="#eab308" stroke-width="2.5" />

  <!-- Green ray -->
  <line x1="225" y1="210" x2="358" y2="252" stroke="#16a34a" stroke-width="2" />
  <line x1="358" y1="252" x2="520" y2="255" stroke="#16a34a" stroke-width="2.5" />

  <!-- Violet ray (Most deviated) -->
  <line x1="225" y1="210" x2="365" y2="270" stroke="#7c3aed" stroke-width="2.5" />
  <line x1="365" y1="270" x2="520" y2="305" stroke="#7c3aed" stroke-width="3" />
  <text x="530" y="310" font-size="12" font-weight="bold" fill="#7c3aed">Violet (V)</text>

  <!-- Spectrum Screen -->
  <line x1="510" y1="150" x2="510" y2="330" stroke="#1e293b" stroke-width="4" stroke-linecap="round" />
  <text x="510" y="350" font-size="11" font-weight="bold" fill="#64748b" text-anchor="middle">White Screen</text>

  <!-- Pin Badges (A), (B), (C), (D) for Student Labeling Questions -->
  <!-- Pin (A): Incident White Light -->
  <g transform="translate(100, 200)">
    <circle cx="0" cy="0" r="16" fill="#4f46e5" stroke="#ffffff" stroke-width="2.5" />
    <text x="0" y="5" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">A</text>
  </g>

  <!-- Pin (B): Glass Prism Body -->
  <g transform="translate(300, 140)">
    <circle cx="0" cy="0" r="16" fill="#4f46e5" stroke="#ffffff" stroke-width="2.5" />
    <text x="0" y="5" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">B</text>
  </g>

  <!-- Pin (C): Red Light Ray (Least bent) -->
  <g transform="translate(450, 165)">
    <circle cx="0" cy="0" r="16" fill="#4f46e5" stroke="#ffffff" stroke-width="2.5" />
    <text x="0" y="5" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">C</text>
  </g>

  <!-- Pin (D): Violet Light Ray (Most bent) -->
  <g transform="translate(450, 315)">
    <circle cx="0" cy="0" r="16" fill="#4f46e5" stroke="#ffffff" stroke-width="2.5" />
    <text x="0" y="5" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">D</text>
  </g>

  <text x="300" y="390" font-size="12" fill="#64748b" text-anchor="middle" font-style="italic">
    Identify and label optical phenomena and components (A), (B), (C), and (D).
  </text>
</svg>
`);

// 4. Class 8 Microbes: Bacteriophage Diagram (Page 5)
export const DIAGRAM_BACTERIOPHAGE_PAGE5 = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 420" width="600" height="420" style="background:#ffffff; font-family:Arial, sans-serif;">
  <rect width="600" height="420" fill="#ffffff" />
  
  <text x="300" y="28" font-size="15" font-weight="bold" fill="#1e293b" text-anchor="middle">Figure 1.7: Structure of a Bacteriophage Virus</text>

  <!-- Icosahedral Head -->
  <polygon points="300,60 360,95 360,165 300,200 240,165 240,95" fill="#f8fafc" stroke="#334155" stroke-width="3" />
  <!-- Internal DNA squiggle -->
  <path d="M 280,105 Q 320,115 285,135 T 315,160" fill="none" stroke="#dc2626" stroke-width="2.5" />

  <!-- Collar -->
  <rect x="280" y="200" width="40" height="15" fill="#64748b" stroke="#334155" stroke-width="2" rx="3" />

  <!-- Sheath (Contractile tail) -->
  <rect x="285" y="215" width="30" height="85" fill="#e2e8f0" stroke="#334155" stroke-width="2" />
  <!-- Rings on sheath -->
  <line x1="285" y1="230" x2="315" y2="230" stroke="#64748b" stroke-width="2" />
  <line x1="285" y1="245" x2="315" y2="245" stroke="#64748b" stroke-width="2" />
  <line x1="285" y1="260" x2="315" y2="260" stroke="#64748b" stroke-width="2" />
  <line x1="285" y1="275" x2="315" y2="275" stroke="#64748b" stroke-width="2" />
  <line x1="285" y1="290" x2="315" y2="290" stroke="#64748b" stroke-width="2" />

  <!-- Base Plate -->
  <polygon points="275,300 325,300 335,312 265,312" fill="#475569" stroke="#1e293b" stroke-width="2" />

  <!-- Tail Fibers (Legs) -->
  <line x1="275" y1="312" x2="230" y2="360" stroke="#334155" stroke-width="3" stroke-linecap="round" />
  <line x1="230" y1="360" x2="210" y2="385" stroke="#334155" stroke-width="3" stroke-linecap="round" />

  <line x1="285" y1="312" x2="260" y2="365" stroke="#334155" stroke-width="3" stroke-linecap="round" />
  <line x1="260" y1="365" x2="250" y2="390" stroke="#334155" stroke-width="3" stroke-linecap="round" />

  <line x1="315" y1="312" x2="340" y2="365" stroke="#334155" stroke-width="3" stroke-linecap="round" />
  <line x1="340" y1="365" x2="350" y2="390" stroke="#334155" stroke-width="3" stroke-linecap="round" />

  <line x1="325" y1="312" x2="370" y2="360" stroke="#334155" stroke-width="3" stroke-linecap="round" />
  <line x1="370" y1="360" x2="390" y2="385" stroke="#334155" stroke-width="3" stroke-linecap="round" />

  <!-- Pin Badges (A), (B), (C), (D) for Student Labeling Questions -->
  <!-- Pin (A): Head / Capsid -->
  <g transform="translate(195, 120)">
    <circle cx="0" cy="0" r="16" fill="#4f46e5" stroke="#ffffff" stroke-width="2.5" />
    <text x="0" y="5" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">A</text>
  </g>
  <line x1="212" y1="120" x2="245" y2="120" stroke="#4f46e5" stroke-width="1.5" stroke-dasharray="3,2" />

  <!-- Pin (B): Viral DNA / Genome -->
  <g transform="translate(405, 120)">
    <circle cx="0" cy="0" r="16" fill="#4f46e5" stroke="#ffffff" stroke-width="2.5" />
    <text x="0" y="5" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">B</text>
  </g>
  <line x1="388" y1="120" x2="320" y2="125" stroke="#4f46e5" stroke-width="1.5" stroke-dasharray="3,2" />

  <!-- Pin (C): Sheath / Tail -->
  <g transform="translate(225, 250)">
    <circle cx="0" cy="0" r="16" fill="#4f46e5" stroke="#ffffff" stroke-width="2.5" />
    <text x="0" y="5" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">C</text>
  </g>
  <line x1="242" y1="250" x2="283" y2="250" stroke="#4f46e5" stroke-width="1.5" stroke-dasharray="3,2" />

  <!-- Pin (D): Tail Fibers -->
  <g transform="translate(425, 345)">
    <circle cx="0" cy="0" r="16" fill="#4f46e5" stroke="#ffffff" stroke-width="2.5" />
    <text x="0" y="5" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">D</text>
  </g>
  <line x1="408" y1="345" x2="360" y2="345" stroke="#4f46e5" stroke-width="1.5" stroke-dasharray="3,2" />

  <text x="300" y="405" font-size="12" fill="#64748b" text-anchor="middle" font-style="italic">
    Identify and label structural parts (A), (B), (C), and (D).
  </text>
</svg>
`);

// 5. Class 8 Health & Diseases: Aedes aegypti & Dengue Flavivirus (Page 18)
export const DIAGRAM_AEDES_PAGE18 = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 420" width="600" height="420" style="background:#ffffff; font-family:Arial, sans-serif;">
  <rect width="600" height="420" fill="#ffffff" />
  
  <text x="300" y="28" font-size="15" font-weight="bold" fill="#1e293b" text-anchor="middle">Figure 2.3: Vector Mosquito (Aedes aegypti) &amp; Dengue Flavivirus</text>

  <!-- Mosquito Body -->
  <!-- Thorax -->
  <ellipse cx="260" cy="190" rx="36" ry="24" fill="#334155" stroke="#0f172a" stroke-width="2.5" />
  <!-- Lyre-shaped white markings on thorax -->
  <path d="M 245 180 Q 260 170 275 180 Q 260 200 245 180" fill="none" stroke="#f8fafc" stroke-width="2.5" />
  
  <!-- Head & Compound Eye -->
  <circle cx="210" cy="190" r="18" fill="#1e293b" stroke="#0f172a" stroke-width="2" />
  <circle cx="206" cy="184" r="6" fill="#0284c7" />

  <!-- Proboscis (piercing mouthpart) -->
  <line x1="195" y1="190" x2="110" y2="205" stroke="#0f172a" stroke-width="3" stroke-linecap="round" />
  <line x1="195" y1="192" x2="135" y2="215" stroke="#64748b" stroke-width="1.5" stroke-linecap="round" />

  <!-- Antennae -->
  <path d="M 200 180 Q 170 160 150 150" fill="none" stroke="#475569" stroke-width="1.8" />
  <path d="M 202 178 Q 175 155 160 140" fill="none" stroke="#475569" stroke-width="1.8" />

  <!-- Abdomen (Striped segments) -->
  <path d="M 296 190 Q 380 205 440 230 Q 380 220 296 195 Z" fill="#1e293b" stroke="#0f172a" stroke-width="2" />
  <!-- White stripes on abdomen -->
  <line x1="330" y1="193" x2="335" y2="204" stroke="#ffffff" stroke-width="3" />
  <line x1="365" y1="200" x2="370" y2="212" stroke="#ffffff" stroke-width="3" />
  <line x1="400" y1="209" x2="405" y2="221" stroke="#ffffff" stroke-width="3" />

  <!-- Translucent Wings -->
  <ellipse cx="295" cy="135" rx="75" ry="24" fill="#e0f2fe" stroke="#38bdf8" stroke-width="2" opacity="0.8" transform="rotate(-20 295 135)" />
  <ellipse cx="280" cy="145" rx="65" ry="20" fill="#e0f2fe" stroke="#38bdf8" stroke-width="1.5" opacity="0.6" transform="rotate(-30 280 145)" />

  <!-- Striped Legs -->
  <!-- Foreleg -->
  <polyline points="240,195 210,250 170,300 130,340" fill="none" stroke="#1e293b" stroke-width="2.5" />
  <circle cx="210" cy="250" r="3" fill="#ffffff" />
  <circle cx="170" cy="300" r="3" fill="#ffffff" />

  <!-- Midleg -->
  <polyline points="265,200 270,270 260,330 240,380" fill="none" stroke="#1e293b" stroke-width="2.5" />
  <circle cx="270" cy="270" r="3" fill="#ffffff" />
  <circle cx="260" cy="330" r="3" fill="#ffffff" />

  <!-- Hindleg -->
  <polyline points="285,198 330,250 370,310 410,360" fill="none" stroke="#1e293b" stroke-width="2.5" />
  <circle cx="330" cy="250" r="3" fill="#ffffff" />
  <circle cx="370" cy="310" r="3" fill="#ffffff" />

  <!-- Inset: Dengue Flavivirus structure -->
  <g transform="translate(485, 115)">
    <circle cx="0" cy="0" r="42" fill="#fef2f2" stroke="#ef4444" stroke-width="2.5" stroke-dasharray="4,3" />
    <circle cx="0" cy="0" r="32" fill="#fee2e2" stroke="#dc2626" stroke-width="2" />
    <path d="M -15,-10 Q 0,-20 12,-8 T 10,14" fill="none" stroke="#b91c1c" stroke-width="2.5" />
    <text x="0" y="56" font-size="10" font-weight="bold" fill="#b91c1c" text-anchor="middle">DEN-1,4 Flavivirus</text>
  </g>

  <!-- Pin Badges (A), (B), (C), (D) for Student Labeling Questions -->
  <!-- Pin (A): Proboscis -->
  <g transform="translate(80, 205)">
    <circle cx="0" cy="0" r="16" fill="#4f46e5" stroke="#ffffff" stroke-width="2.5" />
    <text x="0" y="5" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">A</text>
  </g>
  <line x1="97" y1="205" x2="115" y2="205" stroke="#4f46e5" stroke-width="1.5" stroke-dasharray="3,2" />

  <!-- Pin (B): Thorax / White Markings -->
  <g transform="translate(260, 115)">
    <circle cx="0" cy="0" r="16" fill="#4f46e5" stroke="#ffffff" stroke-width="2.5" />
    <text x="0" y="5" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">B</text>
  </g>
  <line x1="260" y1="132" x2="260" y2="165" stroke="#4f46e5" stroke-width="1.5" stroke-dasharray="3,2" />

  <!-- Pin (C): Striped Jointed Legs -->
  <g transform="translate(440, 360)">
    <circle cx="0" cy="0" r="16" fill="#4f46e5" stroke="#ffffff" stroke-width="2.5" />
    <text x="0" y="5" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">C</text>
  </g>
  <line x1="423" y1="360" x2="410" y2="360" stroke="#4f46e5" stroke-width="1.5" stroke-dasharray="3,2" />

  <!-- Pin (D): Flavivirus Particle -->
  <g transform="translate(555, 65)">
    <circle cx="0" cy="0" r="16" fill="#4f46e5" stroke="#ffffff" stroke-width="2.5" />
    <text x="0" y="5" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">D</text>
  </g>
  <line x1="540" y1="75" x2="515" y2="95" stroke="#4f46e5" stroke-width="1.5" stroke-dasharray="3,2" />

  <text x="300" y="405" font-size="12" fill="#64748b" text-anchor="middle" font-style="italic">
    Identify and label anatomical parts (A), (B), (C), and (D).
  </text>
</svg>
`);

// 6. Class 8 Health & Diseases: Human Heart Structure (Page 21)
export const DIAGRAM_HEART_PAGE21 = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 430" width="600" height="430" style="background:#ffffff; font-family:Arial, sans-serif;">
  <rect width="600" height="430" fill="#ffffff" />
  
  <text x="300" y="28" font-size="15" font-weight="bold" fill="#1e293b" text-anchor="middle">Figure 2.8: Internal Structure of Human Heart &amp; Major Blood Vessels</text>

  <!-- Heart Muscle Walls -->
  <!-- Left Ventricle thick wall & Right Ventricle -->
  <path d="M 230 140 C 180 160 160 250 200 320 C 240 370 300 395 330 400 C 360 395 440 340 450 260 C 460 180 410 140 360 140 C 330 140 310 160 300 170 C 290 160 260 140 230 140 Z" fill="#fee2e2" stroke="#b91c1c" stroke-width="4" />
  
  <!-- Septum dividing ventricles -->
  <path d="M 305 180 Q 295 280 325 390" fill="none" stroke="#b91c1c" stroke-width="12" stroke-linecap="round" />

  <!-- Superior Vena Cava (Blue - Right atrium input) -->
  <path d="M 215 50 L 215 150 L 245 150 L 245 50 Z" fill="#93c5fd" stroke="#1d4ed8" stroke-width="3" />
  <text x="180" y="70" font-size="11" font-weight="bold" fill="#1d4ed8">Vena Cava</text>

  <!-- Aortic Arch (Red - systemic output) -->
  <path d="M 275 140 C 275 65 370 65 370 140" fill="none" stroke="#ef4444" stroke-width="22" stroke-linecap="round" />
  <path d="M 300 70 L 300 45" stroke="#ef4444" stroke-width="8" stroke-linecap="round" />
  <path d="M 325 65 L 330 45" stroke="#ef4444" stroke-width="8" stroke-linecap="round" />
  <path d="M 350 72 L 360 48" stroke="#ef4444" stroke-width="8" stroke-linecap="round" />
  <text x="390" y="65" font-size="12" font-weight="bold" fill="#dc2626">Aorta</text>

  <!-- Pulmonary Artery (Blue/Purple cross) -->
  <path d="M 270 120 Q 320 135 380 115" fill="none" stroke="#60a5fa" stroke-width="14" stroke-linecap="round" />

  <!-- Chambers Interior Labels -->
  <!-- Right Atrium -->
  <rect x="200" y="180" width="55" height="40" rx="8" fill="#dbeafe" stroke="#3b82f6" stroke-width="1.5" />
  <text x="227" y="198" font-size="10" font-weight="bold" fill="#1e40af" text-anchor="middle">Right</text>
  <text x="227" y="212" font-size="10" font-weight="bold" fill="#1e40af" text-anchor="middle">Atrium</text>

  <!-- Left Atrium -->
  <rect x="350" y="175" width="55" height="40" rx="8" fill="#fce7f3" stroke="#ec4899" stroke-width="1.5" />
  <text x="377" y="193" font-size="10" font-weight="bold" fill="#9d174d" text-anchor="middle">Left</text>
  <text x="377" y="207" font-size="10" font-weight="bold" fill="#9d174d" text-anchor="middle">Atrium</text>

  <!-- Right Ventricle -->
  <rect x="220" y="260" width="60" height="45" rx="8" fill="#dbeafe" stroke="#3b82f6" stroke-width="1.5" />
  <text x="250" y="278" font-size="10" font-weight="bold" fill="#1e40af" text-anchor="middle">Right</text>
  <text x="250" y="294" font-size="10" font-weight="bold" fill="#1e40af" text-anchor="middle">Ventricle</text>

  <!-- Left Ventricle -->
  <rect x="330" y="260" width="65" height="45" rx="8" fill="#fce7f3" stroke="#ec4899" stroke-width="1.5" />
  <text x="362" y="278" font-size="10" font-weight="bold" fill="#9d174d" text-anchor="middle">Left</text>
  <text x="362" y="294" font-size="10" font-weight="bold" fill="#9d174d" text-anchor="middle">Ventricle</text>

  <!-- Tricuspid & Bicuspid Valves -->
  <path d="M 235 230 L 255 245" stroke="#475569" stroke-width="2.5" />
  <path d="M 360 230 L 345 245" stroke="#475569" stroke-width="2.5" />

  <!-- Pin Badges (A), (B), (C), (D) for Student Labeling Questions -->
  <!-- Pin (A): Superior Vena Cava -->
  <g transform="translate(150, 50)">
    <circle cx="0" cy="0" r="16" fill="#4f46e5" stroke="#ffffff" stroke-width="2.5" />
    <text x="0" y="5" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">A</text>
  </g>
  <line x1="167" y1="50" x2="210" y2="50" stroke="#4f46e5" stroke-width="1.5" stroke-dasharray="3,2" />

  <!-- Pin (B): Aorta Arch -->
  <g transform="translate(325, 25)">
    <circle cx="0" cy="0" r="16" fill="#4f46e5" stroke="#ffffff" stroke-width="2.5" />
    <text x="0" y="5" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">B</text>
  </g>
  <line x1="325" y1="42" x2="325" y2="60" stroke="#4f46e5" stroke-width="1.5" stroke-dasharray="3,2" />

  <!-- Pin (C): Right Ventricle -->
  <g transform="translate(145, 282)">
    <circle cx="0" cy="0" r="16" fill="#4f46e5" stroke="#ffffff" stroke-width="2.5" />
    <text x="0" y="5" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">C</text>
  </g>
  <line x1="162" y1="282" x2="218" y2="282" stroke="#4f46e5" stroke-width="1.5" stroke-dasharray="3,2" />

  <!-- Pin (D): Left Ventricle -->
  <g transform="translate(460, 282)">
    <circle cx="0" cy="0" r="16" fill="#4f46e5" stroke="#ffffff" stroke-width="2.5" />
    <text x="0" y="5" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">D</text>
  </g>
  <line x1="443" y1="282" x2="396" y2="282" stroke="#4f46e5" stroke-width="1.5" stroke-dasharray="3,2" />

  <text x="300" y="415" font-size="12" fill="#64748b" text-anchor="middle" font-style="italic">
    Identify and label circulatory chambers and blood vessels (A), (B), (C), and (D).
  </text>
</svg>
`);

// Preset label configurations mapped by page
export const PAGE_DIAGRAM_PRESETS = {
  1: {
    title: 'Figure 10.1: Experimental Setup of Laws of Reflection',
    dataUrl: DIAGRAM_REFLECTION_PAGE1,
    labels: [
      { letter: 'A', name: 'Incident Light Ray', defaultMarks: 1 },
      { letter: 'B', name: 'Normal at Point of Incidence', defaultMarks: 1 },
      { letter: 'C', name: 'Reflected Light Ray', defaultMarks: 1 },
      { letter: 'D', name: 'Reflecting Surface (Plane/Spherical Mirror)', defaultMarks: 1 },
    ],
  },
  2: {
    title: 'Figure 10.2: Ray Diagram of Refraction through a Convex Lens',
    dataUrl: DIAGRAM_LENS_PAGE2,
    labels: [
      { letter: 'A', name: 'Optical Centre (O)', defaultMarks: 1 },
      { letter: 'B', name: 'Principal Focus (F₂)', defaultMarks: 1 },
      { letter: 'C', name: 'Real, Inverted Image (A\'B\')', defaultMarks: 1 },
      { letter: 'D', name: 'Convex Lens Curved Surface', defaultMarks: 1 },
    ],
  },
  3: {
    title: 'Figure 10.3: Converging Power of a Convex Lens (P = 1/f)',
    dataUrl: DIAGRAM_POWER_LENS_PAGE3,
    labels: [
      { letter: 'A', name: 'Parallel Incident Ray', defaultMarks: 1 },
      { letter: 'B', name: 'Optical Centre (O)', defaultMarks: 1 },
      { letter: 'C', name: 'Principal Focus (F₂)', defaultMarks: 1 },
      { letter: 'D', name: 'Convex Lens Curved Boundary', defaultMarks: 1 },
    ],
  },
  4: {
    title: 'Figure 10.4: Dispersion of White Light by a Glass Prism',
    dataUrl: DIAGRAM_PRISM_PAGE4,
    labels: [
      { letter: 'A', name: 'Incident White Light Beam', defaultMarks: 1 },
      { letter: 'B', name: 'Triangular Glass Prism', defaultMarks: 1 },
      { letter: 'C', name: 'Red Light (Least Deviated Component)', defaultMarks: 1 },
      { letter: 'D', name: 'Violet Light (Most Deviated Component)', defaultMarks: 1 },
    ],
  },
  5: {
    title: 'Figure 1.7: Structure of a Bacteriophage Virus',
    dataUrl: DIAGRAM_BACTERIOPHAGE_PAGE5,
    labels: [
      { letter: 'A', name: 'Icosahedral Head (Capsid)', defaultMarks: 1 },
      { letter: 'B', name: 'Viral Genetic Material (DNA)', defaultMarks: 1 },
      { letter: 'C', name: 'Contractile Sheath (Tail)', defaultMarks: 1 },
      { letter: 'D', name: 'Tail Fibers / Base Plate', defaultMarks: 1 },
    ],
  },
  18: {
    title: 'Figure 2.3: Vector Mosquito (Aedes aegypti) & Dengue Flavivirus',
    dataUrl: DIAGRAM_AEDES_PAGE18,
    labels: [
      { letter: 'A', name: 'Proboscis (Piercing Mouthpart)', defaultMarks: 1 },
      { letter: 'B', name: 'Thorax with White Lyre Markings', defaultMarks: 1 },
      { letter: 'C', name: 'Striped Jointed Legs', defaultMarks: 1 },
      { letter: 'D', name: 'Dengue Flavivirus Particle', defaultMarks: 1 },
    ],
  },
  21: {
    title: 'Figure 2.8: Internal Structure of Human Heart & Major Blood Vessels',
    dataUrl: DIAGRAM_HEART_PAGE21,
    labels: [
      { letter: 'A', name: 'Superior Vena Cava', defaultMarks: 1 },
      { letter: 'B', name: 'Aorta (Systemic Artery Arch)', defaultMarks: 1 },
      { letter: 'C', name: 'Right Ventricle', defaultMarks: 1 },
      { letter: 'D', name: 'Left Ventricle', defaultMarks: 1 },
    ],
  },
};

// 7. Electric Circuit with Resistor, Voltmeter, Ammeter, Cell, Key
export const DIAGRAM_CIRCUIT = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400" style="background:#ffffff; font-family:Arial, sans-serif;">
  <rect width="600" height="400" fill="#ffffff" />
  <text x="300" y="28" font-size="15" font-weight="bold" fill="#1e293b" text-anchor="middle">Figure 12.1: Schematic Electric Circuit with Voltmeter and Ammeter</text>

  <!-- Main Loop Wires -->
  <line x1="120" y1="120" x2="230" y2="120" stroke="#1e293b" stroke-width="3" />
  <!-- Resistor Zigzag -->
  <polyline points="230,120 240,105 255,135 270,105 285,135 300,105 315,135 330,105 340,120" fill="none" stroke="#2563eb" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
  <line x1="340" y1="120" x2="420" y2="120" stroke="#1e293b" stroke-width="3" />

  <!-- Ammeter in Series -->
  <circle cx="450" cy="120" r="24" fill="#f8fafc" stroke="#dc2626" stroke-width="2.5" />
  <text x="450" y="127" font-size="16" font-weight="bold" fill="#dc2626" text-anchor="middle">A</text>
  <line x1="474" y1="120" x2="500" y2="120" stroke="#1e293b" stroke-width="3" />

  <!-- Right side down -->
  <line x1="500" y1="120" x2="500" y2="280" stroke="#1e293b" stroke-width="3" />

  <!-- Bottom: Battery and Key -->
  <line x1="500" y1="280" x2="380" y2="280" stroke="#1e293b" stroke-width="3" />
  <!-- Switch / Plug Key -->
  <circle cx="360" cy="280" r="14" fill="#f8fafc" stroke="#475569" stroke-width="2" />
  <circle cx="360" cy="280" r="4" fill="#0f172a" />
  <text x="360" y="315" font-size="11" font-weight="bold" fill="#475569" text-anchor="middle">Plug Key (K)</text>
  <line x1="346" y1="280" x2="270" y2="280" stroke="#1e293b" stroke-width="3" />

  <!-- Battery / Cells -->
  <!-- Positive long line -->
  <line x1="250" y1="260" x2="250" y2="300" stroke="#1e293b" stroke-width="3.5" />
  <text x="245" y="255" font-size="14" font-weight="bold" fill="#16a34a">+</text>
  <!-- Negative short thick line -->
  <line x1="240" y1="268" x2="240" y2="292" stroke="#1e293b" stroke-width="5" />
  <text x="235" y="255" font-size="14" font-weight="bold" fill="#dc2626">-</text>

  <line x1="240" y1="280" x2="120" y2="280" stroke="#1e293b" stroke-width="3" />
  <line x1="120" y1="280" x2="120" y2="120" stroke="#1e293b" stroke-width="3" />

  <!-- Parallel Branch for Voltmeter -->
  <line x1="200" y1="120" x2="200" y2="60" stroke="#64748b" stroke-width="2" stroke-dasharray="4,3" />
  <line x1="200" y1="60" x2="260" y2="60" stroke="#64748b" stroke-width="2" stroke-dasharray="4,3" />

  <circle cx="285" cy="60" r="24" fill="#f8fafc" stroke="#0284c7" stroke-width="2.5" />
  <text x="285" y="67" font-size="16" font-weight="bold" fill="#0284c7" text-anchor="middle">V</text>

  <line x1="310" y1="60" x2="370" y2="60" stroke="#64748b" stroke-width="2" stroke-dasharray="4,3" />
  <line x1="370" y1="60" x2="370" y2="120" stroke="#64748b" stroke-width="2" stroke-dasharray="4,3" />

  <!-- Pin Badges (A), (B), (C), (D) -->
  <!-- Pin (A): Voltmeter in parallel -->
  <g transform="translate(285, 20)">
    <circle cx="0" cy="0" r="14" fill="#4f46e5" stroke="#ffffff" stroke-width="2" />
    <text x="0" y="5" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">A</text>
  </g>

  <!-- Pin (B): Resistor R -->
  <g transform="translate(285, 160)">
    <circle cx="0" cy="0" r="14" fill="#4f46e5" stroke="#ffffff" stroke-width="2" />
    <text x="0" y="5" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">B</text>
  </g>

  <!-- Pin (C): Ammeter in series -->
  <g transform="translate(450, 70)">
    <circle cx="0" cy="0" r="14" fill="#4f46e5" stroke="#ffffff" stroke-width="2" />
    <text x="0" y="5" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">C</text>
  </g>

  <!-- Pin (D): Battery Source -->
  <g transform="translate(245, 340)">
    <circle cx="0" cy="0" r="14" fill="#4f46e5" stroke="#ffffff" stroke-width="2" />
    <text x="0" y="5" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">D</text>
  </g>

  <text x="300" y="380" font-size="12" fill="#64748b" text-anchor="middle" font-style="italic">
    Identify circuit elements and connection polarities (A), (B), (C), and (D).
  </text>
</svg>
`);

// 8. Plant Cell Structure with Organelles
export const DIAGRAM_PLANT_CELL = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 420" width="600" height="420" style="background:#ffffff; font-family:Arial, sans-serif;">
  <rect width="600" height="420" fill="#ffffff" />
  <text x="300" y="28" font-size="15" font-weight="bold" fill="#1e293b" text-anchor="middle">Figure 8.4: Microscopic Structure of a Plant Cell</text>

  <!-- Outer Cell Wall (Hexagonal / Rounded polygon) -->
  <polygon points="120,80 480,80 540,210 480,340 120,340 60,210" fill="#dcfce7" stroke="#16a34a" stroke-width="6" />
  <!-- Plasma Membrane inside -->
  <polygon points="125,87 475,87 532,210 475,333 125,333 68,210" fill="#f0fdf4" stroke="#22c55e" stroke-width="2.5" />

  <!-- Large Central Vacuole -->
  <ellipse cx="270" cy="210" rx="110" ry="75" fill="#e0f2fe" stroke="#38bdf8" stroke-width="2.5" />
  <text x="270" y="215" font-size="12" font-weight="bold" fill="#0284c7" text-anchor="middle">Central Vacuole</text>

  <!-- Nucleus and Nucleolus -->
  <circle cx="430" cy="180" r="35" fill="#fce7f3" stroke="#db2777" stroke-width="2.5" />
  <circle cx="430" cy="180" r="14" fill="#db2777" />
  <text x="430" y="235" font-size="11" font-weight="bold" fill="#9d174d" text-anchor="middle">Nucleus</text>

  <!-- Chloroplasts (Oval green bodies) -->
  <g transform="translate(140, 140)">
    <ellipse cx="0" cy="0" rx="24" ry="14" fill="#86efac" stroke="#15803d" stroke-width="2" transform="rotate(-25)" />
    <line x1="-12" y1="-2" x2="12" y2="-2" stroke="#15803d" stroke-width="1.5" />
    <line x1="-10" y1="4" x2="10" y2="4" stroke="#15803d" stroke-width="1.5" />
  </g>

  <g transform="translate(180, 290)">
    <ellipse cx="0" cy="0" rx="24" ry="14" fill="#86efac" stroke="#15803d" stroke-width="2" transform="rotate(30)" />
    <line x1="-12" y1="-2" x2="12" y2="-2" stroke="#15803d" stroke-width="1.5" />
    <line x1="-10" y1="4" x2="10" y2="4" stroke="#15803d" stroke-width="1.5" />
  </g>

  <!-- Mitochondria -->
  <ellipse cx="400" cy="285" rx="22" ry="12" fill="#fed7aa" stroke="#ea580c" stroke-width="2" transform="rotate(-15 400 285)" />

  <!-- Pin Badges (A), (B), (C), (D) -->
  <!-- Pin (A): Rigid Cell Wall -->
  <g transform="translate(50, 120)">
    <circle cx="0" cy="0" r="15" fill="#4f46e5" stroke="#ffffff" stroke-width="2" />
    <text x="0" y="5" font-size="13" font-weight="bold" fill="#ffffff" text-anchor="middle">A</text>
  </g>
  <line x1="65" y1="120" x2="90" y2="120" stroke="#4f46e5" stroke-width="1.5" stroke-dasharray="3,2" />

  <!-- Pin (B): Large Central Vacuole -->
  <g transform="translate(270, 105)">
    <circle cx="0" cy="0" r="15" fill="#4f46e5" stroke="#ffffff" stroke-width="2" />
    <text x="0" y="5" font-size="13" font-weight="bold" fill="#ffffff" text-anchor="middle">B</text>
  </g>

  <!-- Pin (C): Chloroplast -->
  <g transform="translate(100, 260)">
    <circle cx="0" cy="0" r="15" fill="#4f46e5" stroke="#ffffff" stroke-width="2" />
    <text x="0" y="5" font-size="13" font-weight="bold" fill="#ffffff" text-anchor="middle">C</text>
  </g>
  <line x1="115" y1="260" x2="160" y2="280" stroke="#4f46e5" stroke-width="1.5" stroke-dasharray="3,2" />

  <!-- Pin (D): Nucleus -->
  <g transform="translate(500, 140)">
    <circle cx="0" cy="0" r="15" fill="#4f46e5" stroke="#ffffff" stroke-width="2" />
    <text x="0" y="5" font-size="13" font-weight="bold" fill="#ffffff" text-anchor="middle">D</text>
  </g>
  <line x1="485" y1="145" x2="455" y2="165" stroke="#4f46e5" stroke-width="1.5" stroke-dasharray="3,2" />

  <text x="300" y="390" font-size="12" fill="#64748b" text-anchor="middle" font-style="italic">
    Identify cellular organelles and wall structures (A), (B), (C), and (D).
  </text>
</svg>
`);

/**
 * Standard authentic diagram questions mapped by curriculum keywords
 */
export const DIAGRAM_MCQ_BANK = [
  {
    id: 'diag-reflection-1',
    keywords: ['reflect', 'mirror', 'angle of incidence', 'plane mirror', 'spherical mirror', 'light reflection'],
    imageUrl: DIAGRAM_REFLECTION_PAGE1,
    figureCaption: 'Figure: Experimental Setup of Laws of Reflection',
    q: 'Refer to the given experimental ray diagram of laws of reflection. Which component is indicated by label [B]?',
    options: [
      'Normal line drawn perpendicular at point of incidence',
      'Incident light ray',
      'Reflected light ray',
      'Reflecting plane mirror surface'
    ],
    answer: 'Normal line drawn perpendicular at point of incidence',
    explanation: 'Label [B] points to the dashed normal line constructed perpendicular to the mirror surface at the point of incidence O.',
    labels_answer_key: { A: 'Incident Light Ray', B: 'Normal Line', C: 'Reflected Light Ray', D: 'Reflecting Surface' }
  },
  {
    id: 'diag-reflection-2',
    keywords: ['reflect', 'mirror', 'laws of reflection'],
    imageUrl: DIAGRAM_REFLECTION_PAGE1,
    figureCaption: 'Figure: Experimental Setup of Laws of Reflection',
    q: 'According to the fundamental law of reflection shown in the diagram, what is the relationship between angle of incidence ∠i and angle of reflection ∠r?',
    options: [
      '∠i is always equal to ∠r (∠i = ∠r)',
      '∠i is always greater than ∠r',
      '∠i + ∠r = 180°',
      '∠r depends inversely on mirror thickness'
    ],
    answer: '∠i is always equal to ∠r (∠i = ∠r)',
    explanation: 'The first law of reflection strictly states that the angle of incidence is equal to the angle of reflection (∠i = ∠r).',
    labels_answer_key: { A: 'Incident Ray', B: 'Normal', C: 'Reflected Ray', D: 'Reflecting Surface' }
  },
  {
    id: 'diag-lens-1',
    keywords: ['lens', 'convex', 'concave', 'refract', 'focal', 'focu', 'image formation'],
    imageUrl: DIAGRAM_LENS_PAGE2,
    figureCaption: 'Figure: Ray Diagram of Refraction through a Convex Lens',
    q: 'In the given ray diagram of a convex lens, which optical component is indicated by label [B]?',
    options: [
      'Principal Focus (F₂)',
      'Optical Centre (O)',
      'Real and Inverted Image (A\'B\')',
      'Centre of Curvature (2F₁)'
    ],
    answer: 'Principal Focus (F₂)',
    explanation: 'Label [B] indicates the principal focus F₂ on the principal axis where rays parallel to the axis converge after refraction.',
    labels_answer_key: { A: 'Optical Centre (O)', B: 'Principal Focus (F₂)', C: 'Real and Inverted Image (A\'B\')', D: 'Convex Lens Surface' }
  },
  {
    id: 'diag-power-1',
    keywords: ['power', 'converging', 'focal length', 'dioptre', 'diopter', 'lens power'],
    imageUrl: DIAGRAM_POWER_LENS_PAGE3,
    figureCaption: 'Figure: Converging Power of a Convex Lens (P = 1/f)',
    q: 'In the converging lens setup shown, which mathematical relation correctly defines the optical power (P) of the lens with focal length (f in metres)?',
    options: [
      'P = 1 / f',
      'P = f / 2',
      'P = 2 / f',
      'P = f²'
    ],
    answer: 'P = 1 / f',
    explanation: 'The power of a lens is reciprocal of its focal length in metres (P = 1/f) and is measured in Dioptres (D).',
    labels_answer_key: { A: 'Parallel Incident Ray', B: 'Optical Centre (O)', C: 'Principal Focus (F₂)', D: 'Convex Lens Boundary' }
  },
  {
    id: 'diag-prism-1',
    keywords: ['prism', 'dispersion', 'spectrum', 'vibgyor', 'rainbow', 'wavelength', 'white light'],
    imageUrl: DIAGRAM_PRISM_PAGE4,
    figureCaption: 'Figure: Dispersion of White Light by a Glass Prism',
    q: 'In the given diagram illustrating dispersion of white light through a triangular glass prism, which component of the visible spectrum is marked as ray [C]?',
    options: [
      'Red Light (least deviated component)',
      'Violet Light (most deviated component)',
      'Green Light',
      'Yellow Light'
    ],
    answer: 'Red Light (least deviated component)',
    explanation: 'Red light has the longest wavelength in the visible spectrum, travels fastest through glass, and undergoes the least deviation (marked as [C]).',
    labels_answer_key: { A: 'Incident White Light Beam', B: 'Triangular Glass Prism', C: 'Red Light (Least Deviated)', D: 'Violet Light (Most Deviated)' }
  },
  {
    id: 'diag-bacteriophage-1',
    keywords: ['virus', 'bacteriophage', 'microbe', 'microorganism', 'bacteria', 'capsid', 'sheath', 'genetic'],
    imageUrl: DIAGRAM_BACTERIOPHAGE_PAGE5,
    figureCaption: 'Figure: Structure of a Bacteriophage Virus',
    q: 'In the given structural diagram of a bacteriophage virus, identify the part designated as [A]:',
    options: [
      'Icosahedral Head (Protein Capsid)',
      'Contractile Sheath (Tail)',
      'Viral Genetic Material (DNA)',
      'Tail Fibers'
    ],
    answer: 'Icosahedral Head (Protein Capsid)',
    explanation: 'Label [A] indicates the polyhedral/icosahedral protein capsid (head) enclosing the viral genetic genome.',
    labels_answer_key: { A: 'Icosahedral Head (Capsid)', B: 'Viral DNA Genome', C: 'Contractile Sheath', D: 'Tail Fibers' }
  },
  {
    id: 'diag-aedes-1',
    keywords: ['mosquito', 'aedes', 'dengue', 'malaria', 'vector', 'disease', 'health', 'flavivirus'],
    imageUrl: DIAGRAM_AEDES_PAGE18,
    figureCaption: 'Figure: Vector Mosquito (Aedes aegypti) & Dengue Flavivirus',
    q: 'In the given morphological diagram of the disease vector, identify the piercing and sucking mouthpart indicated by label [A]:',
    options: [
      'Proboscis',
      'White Lyre Markings on Thorax',
      'Striped Jointed Legs',
      'Translucent Wings'
    ],
    answer: 'Proboscis',
    explanation: 'Label [A] points to the proboscis, the specialized needle-like mouthpart used by female mosquitoes to pierce skin and withdraw blood.',
    labels_answer_key: { A: 'Proboscis (Piercing Mouthpart)', B: 'Thorax with White Lyre Markings', C: 'Striped Jointed Legs', D: 'Dengue Flavivirus Particle' }
  },
  {
    id: 'diag-heart-1',
    keywords: ['heart', 'circulat', 'cardiac', 'blood', 'artery', 'ventricle', 'atrium', 'aorta', 'vena cava', 'life process'],
    imageUrl: DIAGRAM_HEART_PAGE21,
    figureCaption: 'Figure: Internal Structure of Human Heart & Major Blood Vessels',
    q: 'Refer to the anatomical diagram of the human heart. Which major systemic artery distributing oxygenated blood to the body is indicated by label [B]?',
    options: [
      'Aorta (Systemic Artery Arch)',
      'Superior Vena Cava',
      'Right Ventricle',
      'Left Ventricle'
    ],
    answer: 'Aorta (Systemic Artery Arch)',
    explanation: 'Label [B] points to the aortic arch, the largest systemic artery carrying oxygenated blood from the left ventricle to the entire body.',
    labels_answer_key: { A: 'Superior Vena Cava', B: 'Aorta (Systemic Artery Arch)', C: 'Right Ventricle', D: 'Left Ventricle' }
  },
  {
    id: 'diag-circuit-1',
    keywords: ['circuit', 'electric', 'current', 'resistor', 'ohm', 'voltage', 'potential difference', 'ammeter', 'voltmeter'],
    imageUrl: DIAGRAM_CIRCUIT,
    figureCaption: 'Figure: Schematic Electric Circuit with Voltmeter and Ammeter',
    q: 'In the given electrical circuit schematic, which instrument is connected in parallel across the resistor [B] to measure potential difference?',
    options: [
      'Voltmeter marked as [A]',
      'Ammeter marked as [C]',
      'Battery source marked as [D]',
      'Plug key switch'
    ],
    answer: 'Voltmeter marked as [A]',
    explanation: 'A voltmeter has very high electrical resistance and is connected in parallel across the resistor (labelled [A]) to measure the voltage drop.',
    labels_answer_key: { A: 'Voltmeter in Parallel', B: 'Resistor (R)', C: 'Ammeter in Series', D: 'Battery / DC Source' }
  },
  {
    id: 'diag-plant-cell-1',
    keywords: ['plant cell', 'cell', 'chloroplast', 'vacuole', 'cell wall', 'organelle', 'photosynthesis', 'tissues'],
    imageUrl: DIAGRAM_PLANT_CELL,
    figureCaption: 'Figure: Microscopic Structure of a Plant Cell',
    q: 'In the given diagram of a eukaryotic plant cell, which organelle responsible for capturing solar energy for photosynthesis is marked as [C]?',
    options: [
      'Chloroplast (containing chlorophyll)',
      'Rigid Cellulose Cell Wall [A]',
      'Large Central Vacuole [B]',
      'Nucleus and Nucleolus [D]'
    ],
    answer: 'Chloroplast (containing chlorophyll)',
    explanation: 'Label [C] points to the chloroplasts containing green chlorophyll pigments that drive light-dependent photosynthetic reactions.',
    labels_answer_key: { A: 'Cellulose Cell Wall', B: 'Large Central Vacuole', C: 'Chloroplast Organelle', D: 'Nucleus' }
  }
];

/**
 * Helper to retrieve matched diagram MCQs for any given topic string or curriculum unit.
 * Strictly returns only MCQs whose keywords match the topic.
 * NEVER blindly fallbacks to an unrelated diagram.
 */
export function getDiagramMcqsForTopic(topicString = '', count = 2) {
  const lower = (topicString || '').toLowerCase().trim();
  if (!lower) return [];

  // Match words from topic string against question keywords
  const topicTokens = lower.split(/[\s,.;:/-]+/).filter((t) => t.length >= 3);

  const matched = DIAGRAM_MCQ_BANK.filter((item) => {
    // 1. Direct substring in full topic
    if (item.keywords.some((kw) => lower.includes(kw))) return true;
    // 2. Token match
    return item.keywords.some((kw) => topicTokens.some((tok) => kw.includes(tok) || tok.includes(kw)));
  });

  // Only return genuine matches. If no diagram matches the topic, return empty array!
  return matched.slice(0, Math.max(1, count));
}


