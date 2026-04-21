// SkyRush logo — inline SVG-based version that matches the uploaded red logo
// Used as <img src={skyRushLogo} /> across the app

// The logo is referenced as an imported PNG from the user's file.
// Place the actual logo PNG at: client/src/assets/skyrush-logo.png
// Then import it: import skyRushLogo from '../assets/skyrush-logo.png'

// This module exports a fallback inline SVG that closely mimics the SkyRush logo
const SkyRushLogoSVG = ({ width = 120, height = 60, className = '' }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 240 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Plane body */}
    <g transform="translate(60, 8) rotate(-15, 80, 30)">
      {/* Fuselage */}
      <ellipse cx="80" cy="30" rx="42" ry="12" fill="#e01020" />
      {/* Nose */}
      <path d="M122 30 L138 26 L138 34 Z" fill="#c00010" />
      {/* Cockpit window */}
      <ellipse cx="108" cy="25" rx="10" ry="7" fill="white" opacity="0.9" />
      <text x="103" y="29" fontSize="9" fontWeight="900" fill="#e01020" fontFamily="Arial">2X</text>
      {/* Main wing */}
      <path d="M75 30 L55 58 L40 58 L60 30 Z" fill="#e01020" />
      {/* Wing underside */}
      <path d="M75 30 L62 8 L50 8 L63 30 Z" fill="#c00010" />
      {/* Tail fin */}
      <path d="M38 30 L28 14 L35 14 L45 30 Z" fill="#e01020" />
      {/* Horizontal stabilizer */}
      <path d="M42 32 L28 42 L33 38 L46 32 Z" fill="#c00010" />
      {/* Propeller hub */}
      <circle cx="138" cy="30" r="5" fill="#c00010" />
      {/* Propeller blades */}
      <path d="M138 30 C136 18, 140 8, 142 2 C144 8, 140 18, 138 30 Z" fill="#e01020" />
      <path d="M138 30 C140 42, 136 52, 134 58 C132 52, 136 42, 138 30 Z" fill="#e01020" />
    </g>

    {/* SkyRush text */}
    <text
      x="120"
      y="96"
      textAnchor="middle"
      fontSize="32"
      fontWeight="900"
      fontFamily="'Arial Black', Arial, sans-serif"
      fontStyle="italic"
      fill="#e01020"
      letterSpacing="-0.5"
    >
      SkyRush
    </text>

    {/* Underlines */}
    <rect x="58" y="104" width="88" height="3.5" rx="2" fill="#e01020" />
    <rect x="74" y="111" width="56" height="2.5" rx="1.5" fill="#e01020" />
  </svg>
)

export default SkyRushLogoSVG
