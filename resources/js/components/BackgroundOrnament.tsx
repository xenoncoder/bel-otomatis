export default function BackgroundOrnament({ variant = "normal" }: { variant?: "normal" | "ringing" }) {
  if (variant === "ringing") {
    return (
      <div
        className="sw-ornament-root sw-ornament-ringing"
        style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0, color: "#000" }}
      >
        {/* Radial glow */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, rgba(255,255,255,0.15) 0%, transparent 60%)" }} />

        {/* SVG — radial burst */}
        <svg className="sw-ornament-svg" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "100vmin", height: "100vmin", opacity: 0.1 }} viewBox="0 0 800 800">
          {Array.from({ length: 16 }).map((_, i) => (
            <line key={i} x1="400" y1="400" x2={400 + 380 * Math.cos((i * 22.5 * Math.PI) / 180)} y2={400 + 380 * Math.sin((i * 22.5 * Math.PI) / 180)} stroke="currentColor" strokeWidth="2" />
          ))}
          <circle cx="400" cy="400" r="200" fill="none" stroke="currentColor" strokeWidth="3" />
          <circle cx="400" cy="400" r="300" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="8 12" />
          <circle cx="400" cy="400" r="380" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 8" />
        </svg>

        {/* Musical notes */}
        <svg className="sw-ornament-svg" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.12 }}>
          {[
            { x: 120, y: 200, s: 1, r: 0 }, { x: 900, y: 150, s: 0.8, r: -15 },
            { x: 180, y: 750, s: 0.9, r: 10 }, { x: 950, y: 700, s: 1.1, r: -5 },
            { x: 560, y: 120, s: 0.7, r: 20 }, { x: 300, y: 500, s: 0.6, r: -10 },
          ].map((n, i) => (
            <g key={i} transform={`translate(${n.x}, ${n.y}) rotate(${n.r}) scale(${n.s})`} fill="currentColor" stroke="currentColor">
              <ellipse cx="0" cy="0" rx="8" ry="6" transform="rotate(-20)" />
              <line x1="7" y1="-2" x2="7" y2="-35" strokeWidth="2" />
              <path d="M7 -35 Q 20 -30 20 -20 Q 15 -25 7 -25" />
            </g>
          ))}
        </svg>

        {/* Pulsing rings */}
        <div className="sw-pulse sw-ornament-ring" style={{ position: "absolute", top: "50%", left: "50%", width: 450, height: 450, borderRadius: "50%", border: "3px solid currentColor", opacity: 0.12, transform: "translate(-50%, -50%)" }} />
        <div className="sw-pulse sw-ornament-ring" style={{ position: "absolute", top: "50%", left: "50%", width: 650, height: 650, borderRadius: "50%", border: "3px solid currentColor", opacity: 0.08, transform: "translate(-50%, -50%)", animationDelay: "0.4s" }} />
      </div>
    );
  }

  return (
    <div
      className="sw-ornament-root sw-ornament-normal"
      style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}
    >
      {/* Theme-aware radial gradients */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 25%, var(--sw-purple-light) 0%, transparent 55%)", opacity: 0.12 }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 85% 75%, var(--sw-green-normal) 0%, transparent 50%)", opacity: 0.08 }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 12% 65%, var(--sw-pink-normal) 0%, transparent 45%)", opacity: 0.06 }} />

      {/* === SVG BELL ICONS — scattered watermark === */}
      {/* Large bell — top left */}
      <svg className="sw-ornament-svg" style={{ position: "absolute", top: "5%", left: "4%", width: "140px", height: "140px", opacity: 0.06, transform: "rotate(-12deg)" }} viewBox="0 0 24 24" fill="none" stroke="var(--sw-purple-normal)" strokeWidth="1.2">
        <path d="M12 2C10.3431 2 9 3.34315 9 5V5.5C6.5 6.5 5 9 5 12V17L3 19V20H21V19L19 17V12C19 9 17.5 6.5 15 5.5V5C15 3.34315 13.6569 2 12 2Z" />
        <path d="M10 20C10 21.1046 10.8954 22 12 22C13.1046 22 14 21.1046 14 20" />
        <line x1="12" y1="2" x2="12" y2="5" />
      </svg>

      {/* Medium bell — bottom right */}
      <svg className="sw-ornament-svg" style={{ position: "absolute", bottom: "8%", right: "5%", width: "100px", height: "100px", opacity: 0.05, transform: "rotate(15deg)" }} viewBox="0 0 24 24" fill="none" stroke="var(--sw-purple-normal)" strokeWidth="1.2">
        <path d="M12 2C10.3431 2 9 3.34315 9 5V5.5C6.5 6.5 5 9 5 12V17L3 19V20H21V19L19 17V12C19 9 17.5 6.5 15 5.5V5C15 3.34315 13.6569 2 12 2Z" />
        <path d="M10 20C10 21.1046 10.8954 22 12 22C13.1046 22 14 21.1046 14 20" />
      </svg>

      {/* Small bell — mid right */}
      <svg className="sw-ornament-svg" style={{ position: "absolute", top: "45%", right: "8%", width: "60px", height: "60px", opacity: 0.04, transform: "rotate(-8deg)" }} viewBox="0 0 24 24" fill="none" stroke="var(--sw-purple-normal)" strokeWidth="1.5">
        <path d="M12 2C10.3431 2 9 3.34315 9 5V5.5C6.5 6.5 5 9 5 12V17L3 19V20H21V19L19 17V12C19 9 17.5 6.5 15 5.5V5C15 3.34315 13.6569 2 12 2Z" />
        <path d="M10 20C10 21.1046 10.8954 22 12 22C13.1046 22 14 21.1046 14 20" />
      </svg>

      {/* === SVG SCHOOL ICON — top right === */}
      <svg className="sw-ornament-svg" style={{ position: "absolute", top: "10%", right: "6%", width: "90px", height: "90px", opacity: 0.05, transform: "rotate(8deg)" }} viewBox="0 0 24 24" fill="none" stroke="var(--sw-green-normal)" strokeWidth="1.2">
        <path d="M12 3L1 9L5 11.18V17.18L12 21L19 17.18V11.18L21 10.09V17H23V9L12 3Z" />
        <path d="M12 12L6 8.5L6 14L12 17.5L18 14V8.5L12 12Z" />
      </svg>

      {/* === SVG SCHOOL ICON — bottom left === */}
      <svg className="sw-ornament-svg" style={{ position: "absolute", bottom: "10%", left: "6%", width: "75px", height: "75px", opacity: 0.04, transform: "rotate(-10deg)" }} viewBox="0 0 24 24" fill="none" stroke="var(--sw-pink-normal)" strokeWidth="1.3">
        <path d="M12 3L1 9L5 11.18V17.18L12 21L19 17.18V11.18L21 10.09V17H23V9L12 3Z" />
        <path d="M12 12L6 8.5L6 14L12 17.5L18 14V8.5L12 12Z" />
      </svg>

      {/* === SVG CLOCK ICON — mid left === */}
      <svg className="sw-ornament-svg" style={{ position: "absolute", top: "50%", left: "3%", width: "80px", height: "80px", opacity: 0.05 }} viewBox="0 0 24 24" fill="none" stroke="var(--sw-purple-normal)" strokeWidth="1.2">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12,6 12,12 16,14" />
      </svg>

      {/* === SVG — top waves === */}
      <svg className="sw-ornament-svg" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "160px", opacity: 0.07 }} viewBox="0 0 1200 160" preserveAspectRatio="none">
        {Array.from({ length: 4 }).map((_, i) => (
          <path key={i} d={`M0 ${20 + i * 30} Q 150 ${5 + i * 30} 300 ${20 + i * 30} T 600 ${20 + i * 30} T 900 ${20 + i * 30} T 1200 ${20 + i * 30}`} fill="none" stroke="var(--sw-purple-normal)" strokeWidth="2" />
        ))}
      </svg>

      {/* === SVG — bottom waves === */}
      <svg className="sw-ornament-svg" style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: "160px", opacity: 0.07 }} viewBox="0 0 1200 160" preserveAspectRatio="none">
        {Array.from({ length: 4 }).map((_, i) => (
          <path key={i} d={`M0 ${140 - i * 30} Q 150 ${155 - i * 30} 300 ${140 - i * 30} T 600 ${140 - i * 30} T 900 ${140 - i * 30} T 1200 ${140 - i * 30}`} fill="none" stroke="var(--sw-green-normal)" strokeWidth="2" />
        ))}
      </svg>

      {/* === Geometric shapes === */}
      {/* Concentric circles */}
      <svg className="sw-ornament-svg" style={{ position: "absolute", top: "15%", left: "20%", width: "90px", height: "90px", opacity: 0.05 }} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="48" fill="none" stroke="var(--sw-fg)" strokeWidth="2" />
        <circle cx="50" cy="50" r="34" fill="none" stroke="var(--sw-fg)" strokeWidth="2" />
        <circle cx="50" cy="50" r="20" fill="none" stroke="var(--sw-fg)" strokeWidth="2" />
        <line x1="50" y1="2" x2="50" y2="98" stroke="var(--sw-fg)" strokeWidth="1" />
        <line x1="2" y1="50" x2="98" y2="50" stroke="var(--sw-fg)" strokeWidth="1" />
      </svg>

      {/* Nested squares */}
      <svg className="sw-ornament-svg" style={{ position: "absolute", top: "65%", right: "18%", width: "75px", height: "75px", opacity: 0.05, transform: "rotate(15deg)" }} viewBox="0 0 100 100">
        <rect x="10" y="10" width="80" height="80" fill="none" stroke="var(--sw-fg)" strokeWidth="2" />
        <rect x="25" y="25" width="50" height="50" fill="none" stroke="var(--sw-fg)" strokeWidth="2" />
        <rect x="40" y="40" width="20" height="20" fill="none" stroke="var(--sw-fg)" strokeWidth="2" />
        <line x1="10" y1="10" x2="90" y2="90" stroke="var(--sw-fg)" strokeWidth="1" />
        <line x1="90" y1="10" x2="10" y2="90" stroke="var(--sw-fg)" strokeWidth="1" />
      </svg>

      {/* Triangle */}
      <svg className="sw-ornament-svg" style={{ position: "absolute", bottom: "20%", right: "10%", width: "65px", height: "65px", opacity: 0.04 }} viewBox="0 0 100 100">
        <polygon points="50,5 95,90 5,90" fill="none" stroke="var(--sw-fg)" strokeWidth="2" />
        <polygon points="50,25 80,85 20,85" fill="none" stroke="var(--sw-fg)" strokeWidth="2" />
        <polygon points="50,45 65,80 35,80" fill="none" stroke="var(--sw-fg)" strokeWidth="2" />
      </svg>

      {/* Hexagon */}
      <svg className="sw-ornament-svg" style={{ position: "absolute", top: "30%", left: "14%", width: "60px", height: "60px", opacity: 0.04, transform: "rotate(-10deg)" }} viewBox="0 0 100 100">
        <polygon points="50,5 93,27 93,73 50,95 7,73 7,27" fill="none" stroke="var(--sw-fg)" strokeWidth="2" />
        <polygon points="50,20 80,35 80,65 50,80 20,65 20,35" fill="none" stroke="var(--sw-fg)" strokeWidth="2" />
        <circle cx="50" cy="50" r="10" fill="none" stroke="var(--sw-fg)" strokeWidth="2" />
      </svg>

      {/* Zigzag */}
      <svg className="sw-ornament-svg" style={{ position: "absolute", top: "75%", left: "10%", width: "80px", height: "45px", opacity: 0.05 }} viewBox="0 0 100 60">
        <polyline points="5,30 20,10 35,30 50,10 65,30 80,10 95,30" fill="none" stroke="var(--sw-fg)" strokeWidth="2" />
        <polyline points="5,50 20,30 35,50 50,30 65,50 80,30 95,50" fill="none" stroke="var(--sw-fg)" strokeWidth="2" />
      </svg>

      {/* === Large concentric dashed rings — center === */}
      <svg className="sw-ornament-svg" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "600px", height: "600px", opacity: 0.04 }} viewBox="0 0 800 800">
        <circle cx="400" cy="400" r="380" fill="none" stroke="var(--sw-border-color)" strokeWidth="2" strokeDasharray="4 8" />
        <circle cx="400" cy="400" r="280" fill="none" stroke="var(--sw-border-color)" strokeWidth="2" strokeDasharray="2 6" />
        <circle cx="400" cy="400" r="180" fill="none" stroke="var(--sw-border-color)" strokeWidth="1.5" />
      </svg>

      {/* === Floating colored dots === */}
      <svg className="sw-ornament-svg" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.07 }}>
        {[
          { x: "8%", y: "22%", r: 4, c: "var(--sw-purple-normal)", d: "0s" },
          { x: "87%", y: "30%", r: 5, c: "var(--sw-pink-normal)", d: "0.8s" },
          { x: "16%", y: "72%", r: 6, c: "var(--sw-green-normal)", d: "1.6s" },
          { x: "80%", y: "78%", r: 4, c: "var(--sw-yellow-normal)", d: "0.4s" },
          { x: "48%", y: "12%", r: 3, c: "var(--sw-purple-normal)", d: "1.2s" },
          { x: "91%", y: "55%", r: 4, c: "var(--sw-pink-normal)", d: "2s" },
          { x: "8%", y: "45%", r: 3, c: "var(--sw-green-normal)", d: "2.4s" },
          { x: "55%", y: "88%", r: 5, c: "var(--sw-yellow-normal)", d: "0.6s" },
        ].map((dot, i) => (
          <circle key={i} cx={dot.x} cy={dot.y} r={dot.r} fill={dot.c} className="sw-float-dot" style={{ animationDelay: dot.d, transformOrigin: "center" } as React.CSSProperties} />
        ))}
      </svg>

      {/* Cross + plus marks */}
      <svg className="sw-ornament-svg" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.05 }}>
        {[
          { x: 250, y: 180, t: "cross" }, { x: 980, y: 420, t: "cross" },
          { x: 120, y: 580, t: "cross" }, { x: 720, y: 250, t: "plus" },
          { x: 460, y: 820, t: "plus" }, { x: 880, y: 180, t: "plus" },
        ].map((p, i) => (
          <g key={i} transform={`translate(${p.x}, ${p.y})`}>
            {p.t === "cross" ? (
              <>
                <line x1="-8" y1="0" x2="8" y2="0" stroke="var(--sw-fg)" strokeWidth="2" />
                <line x1="0" y1="-8" x2="0" y2="8" stroke="var(--sw-fg)" strokeWidth="2" />
              </>
            ) : (
              <>
                <circle cx="0" cy="0" r="12" fill="none" stroke="var(--sw-fg)" strokeWidth="1" />
                <line x1="-6" y1="0" x2="6" y2="0" stroke="var(--sw-fg)" strokeWidth="2" />
                <line x1="0" y1="-6" x2="0" y2="6" stroke="var(--sw-fg)" strokeWidth="2" />
              </>
            )}
          </g>
        ))}
      </svg>

      {/* === Sound wave decoration — near bell icons === */}
      <svg className="sw-ornament-svg" style={{ position: "absolute", top: "8%", left: "14%", width: "60px", height: "60px", opacity: 0.05 }} viewBox="0 0 60 60">
        <path d="M10 30 Q 15 15 20 30 Q 25 45 30 30 Q 35 15 40 30 Q 45 45 50 30" fill="none" stroke="var(--sw-purple-normal)" strokeWidth="2" />
      </svg>
      <svg className="sw-ornament-svg" style={{ position: "absolute", bottom: "12%", right: "15%", width: "55px", height: "55px", opacity: 0.05 }} viewBox="0 0 60 60">
        <path d="M10 30 Q 15 15 20 30 Q 25 45 30 30 Q 35 15 40 30 Q 45 45 50 30" fill="none" stroke="var(--sw-purple-normal)" strokeWidth="2" />
      </svg>
    </div>
  );
}
