import { useState, useRef, useEffect, useCallback } from "react";

const BG = "#1f3a34";
const LIGHT = "#f4f8f9";
const ACCENT = "#c8e6c0";
const DARK_CARD = "#162d28";
const SHADOW_DARK = "#0d1f1b";
const HIGHLIGHT = "rgba(244,248,249,0.07)";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Crimson+Pro:ital,wght@0,300;0,400;1,300&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: ${BG};
    font-family: 'Crimson Pro', Georgia, serif;
    color: ${LIGHT};
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    overflow-x: hidden;
  }

  .phone-frame {
    width: 390px;
    min-height: 844px;
    background: ${BG};
    position: relative;
    overflow: hidden;
    box-shadow:
      0 0 0 1px rgba(244,248,249,0.06),
      0 40px 80px rgba(0,0,0,0.6),
      inset 0 1px 0 rgba(244,248,249,0.08);
    border-radius: 48px;
    margin: 24px auto;
  }

  .status-bar {
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 28px;
    position: relative;
    z-index: 10;
  }

  .status-bar::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, rgba(31,58,52,0.9), transparent);
    pointer-events: none;
  }

  .status-time {
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0.02em;
    color: ${LIGHT};
    font-family: 'Crimson Pro', serif;
  }

  .status-icons {
    display: flex;
    gap: 6px;
    align-items: center;
    opacity: 0.85;
    font-size: 12px;
  }

  /* SKEUOMORPHIC EMBOSSED CARD */
  .skeu-card {
    background: linear-gradient(145deg, #243f38, #1a3029);
    border-radius: 20px;
    box-shadow:
      6px 6px 12px ${SHADOW_DARK},
      -3px -3px 8px rgba(244,248,249,0.05),
      inset 0 1px 0 rgba(244,248,249,0.08),
      inset 0 -1px 0 rgba(0,0,0,0.3);
    border: 1px solid rgba(244,248,249,0.05);
  }

  .skeu-button {
    background: linear-gradient(175deg, #2a4a3f 0%, #1c3530 50%, #162c27 100%);
    border-radius: 14px;
    box-shadow:
      4px 4px 8px ${SHADOW_DARK},
      -2px -2px 6px rgba(244,248,249,0.05),
      inset 0 1px 0 rgba(244,248,249,0.10),
      inset 0 -1px 0 rgba(0,0,0,0.25);
    border: 1px solid rgba(244,248,249,0.07);
    cursor: pointer;
    transition: all 0.12s ease;
    position: relative;
    overflow: hidden;
  }

  .skeu-button::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 50%;
    background: linear-gradient(to bottom, rgba(244,248,249,0.06), transparent);
    border-radius: 14px 14px 0 0;
    pointer-events: none;
  }

  .skeu-button:active {
    box-shadow:
      2px 2px 4px ${SHADOW_DARK},
      -1px -1px 3px rgba(244,248,249,0.03),
      inset 0 2px 4px rgba(0,0,0,0.3),
      inset 0 1px 0 rgba(0,0,0,0.2);
    transform: translateY(1px);
  }

  .skeu-button-primary {
    background: linear-gradient(175deg, #3d7a5c 0%, #2d5e45 50%, #245040 100%);
    box-shadow:
      4px 4px 10px rgba(13,31,27,0.8),
      -2px -2px 6px rgba(244,248,249,0.08),
      inset 0 1px 0 rgba(244,248,249,0.15),
      inset 0 -1px 0 rgba(0,0,0,0.25);
    border-color: rgba(200,230,192,0.15);
  }

  .skeu-button-primary::before {
    background: linear-gradient(to bottom, rgba(244,248,249,0.1), transparent);
  }

  .alpha-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 10px;
    padding: 16px;
  }

  .alpha-btn {
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Playfair Display', serif;
    font-size: 22px;
    font-weight: 600;
    color: ${LIGHT};
    position: relative;
  }

  .alpha-btn.captured {
    color: ${ACCENT};
  }

  .alpha-btn.captured::after {
    content: '';
    position: absolute;
    bottom: 5px;
    left: 50%;
    transform: translateX(-50%);
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: ${ACCENT};
    box-shadow: 0 0 6px ${ACCENT};
  }

  .screen {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.35s ease;
  }

  .screen.hidden {
    pointer-events: none;
    opacity: 0;
    transform: translateX(30px);
  }

  .screen.slide-left {
    transform: translateX(-30px);
    opacity: 0;
  }

  /* CANVAS DRAWING AREA */
  .canvas-container {
    position: relative;
    margin: 0 16px;
    border-radius: 20px;
    overflow: hidden;
    box-shadow:
      inset 4px 4px 10px rgba(0,0,0,0.4),
      inset -2px -2px 6px rgba(244,248,249,0.03),
      0 0 0 1px rgba(244,248,249,0.06);
    background: linear-gradient(145deg, #172b25, #1e3630);
  }

  canvas {
    display: block;
    width: 100%;
    cursor: crosshair;
    touch-action: none;
  }

  .divider {
    height: 1px;
    margin: 0 16px;
    background: linear-gradient(to right, transparent, rgba(244,248,249,0.1), transparent);
  }

  .header-bar {
    display: flex;
    align-items: center;
    padding: 8px 16px 16px;
    gap: 12px;
  }

  .back-btn {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .screen-title {
    font-family: 'Playfair Display', serif;
    font-size: 26px;
    font-weight: 600;
    color: ${LIGHT};
    letter-spacing: -0.02em;
  }

  .sub-label {
    font-family: 'Crimson Pro', serif;
    font-size: 14px;
    color: rgba(244,248,249,0.5);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .case-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px 16px;
    gap: 8px;
    flex: 1;
  }

  .case-letter {
    font-family: 'Playfair Display', serif;
    font-size: 64px;
    font-weight: 400;
    color: ${LIGHT};
    line-height: 1;
  }

  .case-tag {
    font-size: 12px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(244,248,249,0.45);
  }

  .progress-container {
    padding: 16px 20px;
  }

  .progress-bar-track {
    height: 6px;
    background: linear-gradient(to right, #0d1f1b, #152822);
    border-radius: 3px;
    overflow: hidden;
    box-shadow: inset 2px 2px 4px rgba(0,0,0,0.4), inset -1px -1px 2px rgba(244,248,249,0.04);
  }

  .progress-bar-fill {
    height: 100%;
    background: linear-gradient(to right, #4caf88, ${ACCENT});
    border-radius: 3px;
    transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 0 8px rgba(76,175,136,0.4);
  }

  .toast {
    position: absolute;
    bottom: 32px;
    left: 50%;
    transform: translateX(-50%) translateY(80px);
    background: linear-gradient(145deg, #2a4a3f, #1f3a34);
    border: 1px solid rgba(200,230,192,0.2);
    border-radius: 24px;
    padding: 10px 24px;
    font-size: 14px;
    color: ${ACCENT};
    letter-spacing: 0.04em;
    white-space: nowrap;
    transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease;
    opacity: 0;
    z-index: 100;
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  }

  .toast.show {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }

  .paper-texture {
    position: absolute;
    inset: 0;
    background-image:
      repeating-linear-gradient(
        0deg,
        transparent,
        transparent 27px,
        rgba(244,248,249,0.03) 27px,
        rgba(244,248,249,0.03) 28px
      );
    pointer-events: none;
    border-radius: inherit;
  }

  .ink-hint {
    position: absolute;
    top: 12px;
    left: 0; right: 0;
    text-align: center;
    font-family: 'Crimson Pro', serif;
    font-style: italic;
    font-size: 14px;
    color: rgba(244,248,249,0.18);
    pointer-events: none;
    transition: opacity 0.3s;
  }

  .scrollable-content {
    flex: 1;
    overflow-y: auto;
    scrollbar-width: none;
  }

  .scrollable-content::-webkit-scrollbar {
    display: none;
  }

  .font-preview-section {
    margin: 16px;
    padding: 20px;
  }

  .preview-text {
    font-size: 32px;
    font-family: 'Playfair Display', serif;
    font-style: italic;
    color: rgba(244,248,249,0.7);
    line-height: 1.4;
    text-align: center;
    letter-spacing: 0.04em;
  }
`;

function useTime() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  return time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function StatusBar() {
  const time = useTime();
  return (
    <div className="status-bar">
      <span className="status-time">{time}</span>
      <div className="status-icons">
        <svg width="16" height="12" viewBox="0 0 16 12" fill={LIGHT}>
          <rect x="0" y="4" width="3" height="8" rx="1" opacity="0.4"/>
          <rect x="4.5" y="2.5" width="3" height="9.5" rx="1" opacity="0.6"/>
          <rect x="9" y="0.5" width="3" height="11.5" rx="1" opacity="0.8"/>
          <rect x="13.5" y="0" width="2.5" height="12" rx="1"/>
        </svg>
        <svg width="15" height="12" viewBox="0 0 15 12" fill={LIGHT}>
          <path d="M7.5 2.5C9.8 2.5 11.8 3.5 13.2 5L14.5 3.7C12.7 1.8 10.2 0.5 7.5 0.5S2.3 1.8 0.5 3.7L1.8 5C3.2 3.5 5.2 2.5 7.5 2.5Z" opacity="0.5"/>
          <path d="M7.5 5.5C9 5.5 10.4 6.1 11.4 7.1L12.7 5.8C11.3 4.5 9.5 3.5 7.5 3.5S3.7 4.5 2.3 5.8L3.6 7.1C4.6 6.1 6 5.5 7.5 5.5Z" opacity="0.75"/>
          <circle cx="7.5" cy="10" r="1.5"/>
        </svg>
        <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
          <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke={LIGHT} strokeOpacity="0.35"/>
          <rect x="2" y="2" width="17" height="8" rx="2" fill={LIGHT} fillOpacity="0.9"/>
          <path d="M23 4v4a2 2 0 0 0 0-4Z" fill={LIGHT} fillOpacity="0.4"/>
        </svg>
      </div>
    </div>
  );
}

function BackButton({ onClick }) {
  return (
    <button className="skeu-button back-btn" onClick={onClick} style={{ border: "none" }}>
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M11 4L6 9L11 14" stroke={LIGHT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}

// ─── DRAWING CANVAS ──────────────────────────────────────────────────────────
function DrawingCanvas({ onSave, letter }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const hasDrawn = useRef(false);
  const lastPos = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = 358;
    canvas.height = 280;
    ctx.fillStyle = "#172b25";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Baseline
    ctx.strokeStyle = "rgba(244,248,249,0.08)";
    ctx.setLineDash([4, 6]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, 210); ctx.lineTo(338, 210);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [letter]);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const src = e.touches ? e.touches[0] : e;
    return {
      x: (src.clientX - rect.left) * scaleX,
      y: (src.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e) => {
    e.preventDefault();
    drawing.current = true;
    hasDrawn.current = true;
    lastPos.current = getPos(e, canvasRef.current);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.strokeStyle = "#e8f5e0";
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowBlur = 4;
    ctx.shadowColor = "rgba(200,230,192,0.3)";
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.shadowBlur = 0;
    lastPos.current = pos;
  };

  const endDraw = () => { drawing.current = false; };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#172b25";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(244,248,249,0.08)";
    ctx.setLineDash([4, 6]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, 210); ctx.lineTo(338, 210);
    ctx.stroke();
    ctx.setLineDash([]);
    hasDrawn.current = false;
  };

  const handleSave = () => {
    if (!hasDrawn.current) return null;
    const dataURL = canvasRef.current.toDataURL("image/png");
    onSave(dataURL);
  };

  return (
    <div>
      <div className="canvas-container">
        <div className="paper-texture" />
        <div className="ink-hint" style={{ opacity: hasDrawn.current ? 0 : 1 }}>
          Write '{letter}' here…
        </div>
        <canvas
          ref={canvasRef}
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
        />
      </div>
      <div style={{ display: "flex", gap: 10, padding: "14px 16px 0" }}>
        <button className="skeu-button" onClick={clearCanvas}
          style={{ flex: 1, padding: "14px", border: "none", color: "rgba(244,248,249,0.6)", fontFamily: "'Crimson Pro', serif", fontSize: 16, letterSpacing: "0.06em" }}>
          Clear
        </button>
        <button className="skeu-button skeu-button-primary" onClick={handleSave}
          style={{ flex: 2, padding: "14px", border: "none", color: LIGHT, fontFamily: "'Crimson Pro', serif", fontSize: 16, letterSpacing: "0.06em", fontWeight: 600 }}>
          Save Character
        </button>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("home"); // home | letter | draw
  const [activeLetter, setActiveLetter] = useState(null);
  const [activeCase, setActiveCase] = useState(null); // 'upper' | 'lower'
  const [captured, setCaptured] = useState({}); // { 'A': dataURL, 'a': dataURL, ... }
  const [toast, setToast] = useState({ show: false, msg: "" });
  const [fontApplied, setFontApplied] = useState(false);

  const totalChars = 52;
  const capturedCount = Object.keys(captured).length;
  const progress = (capturedCount / totalChars) * 100;

  const showToast = (msg) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg }), 2200);
  };

  const openLetter = (l) => { setActiveLetter(l); setScreen("letter"); };
  const openDraw = (c) => { setActiveCase(c); setScreen("draw"); };
  const goBack = () => {
    if (screen === "draw") setScreen("letter");
    else if (screen === "letter") setScreen("home");
    else if (screen === "apply") setScreen("home");
  };

  const handleSave = (dataURL) => {
    const key = activeCase === "upper" ? activeLetter : activeLetter.toLowerCase();
    setCaptured(prev => ({ ...prev, [key]: dataURL }));
    showToast(`'${key}' saved to your font!`);
    setTimeout(() => setScreen("letter"), 500);
  };

  const isCaptured = (letter) =>
    captured[letter] || captured[letter.toLowerCase()];

  const applyFont = () => {
    setFontApplied(true);
    showToast("Font theme applied!");
  };

  const drawKey = activeCase === "upper" ? activeLetter : activeLetter?.toLowerCase();
  const drawCaptured = drawKey ? captured[drawKey] : null;

  return (
    <>
      <style>{styles}</style>
      <div className="phone-frame">
        <StatusBar />

        {/* HOME SCREEN */}
        <div className={`screen ${screen !== "home" ? "slide-left" : ""}`}
          style={{ display: screen === "home" ? "flex" : "none", flexDirection: "column" }}>

          <div style={{ padding: "8px 20px 16px" }}>
            <p className="sub-label" style={{ marginBottom: 4 }}>Your Handwriting</p>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
              Font Studio
            </h1>
          </div>

          {/* Progress */}
          <div style={{ margin: "0 16px 16px" }} className="skeu-card">
            <div style={{ padding: "16px 20px 12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                <span style={{ fontFamily: "'Crimson Pro', serif", fontSize: 15, color: "rgba(244,248,249,0.6)", letterSpacing: "0.06em" }}>
                  Collection Progress
                </span>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: ACCENT }}>
                  {capturedCount}<span style={{ color: "rgba(244,248,249,0.35)", fontSize: 14 }}>/{totalChars}</span>
                </span>
              </div>
              <div className="progress-bar-track">
                <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>

          {/* Alphabet Grid */}
          <div className="scrollable-content">
            <div className="alpha-grid">
              {alphabet.map(l => (
                <button key={l}
                  className={`skeu-button alpha-btn ${isCaptured(l) ? "captured" : ""}`}
                  onClick={() => openLetter(l)}
                  style={{ border: "none", padding: 0 }}>
                  {l}
                </button>
              ))}
              {/* 26th slot — Apply Font button */}
              <button
                className="skeu-button skeu-button-primary alpha-btn"
                onClick={applyFont}
                style={{ border: "none", fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: capturedCount > 0 ? ACCENT : "rgba(244,248,249,0.35)", padding: 6, textAlign: "center", fontFamily: "'Crimson Pro', serif" }}>
                {fontApplied ? "✦ Applied" : "Apply Font"}
              </button>
            </div>

            {/* Preview */}
            <div className="divider" style={{ margin: "4px 16px 16px" }} />
            <div style={{ margin: "0 16px 32px" }} className="skeu-card font-preview-section">
              <p className="sub-label" style={{ textAlign: "center", marginBottom: 12 }}>Preview</p>
              <p className="preview-text">
                {capturedCount > 0
                  ? "Your style, your words."
                  : "Start writing…"}
              </p>
              {capturedCount > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16, justifyContent: "center" }}>
                  {Object.entries(captured).slice(0, 8).map(([k, v]) => (
                    <div key={k} style={{ width: 36, height: 36, borderRadius: 8, overflow: "hidden", boxShadow: "0 2px 6px rgba(0,0,0,0.4)" }}>
                      <img src={v} alt={k} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    </div>
                  ))}
                  {capturedCount > 8 && (
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(244,248,249,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "rgba(244,248,249,0.4)" }}>
                      +{capturedCount - 8}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* LETTER CASE SCREEN */}
        {activeLetter && (
          <div className={`screen ${screen !== "letter" ? (screen === "draw" ? "slide-left" : "hidden") : ""}`}
            style={{ display: screen === "letter" || (screen === "draw") ? "flex" : "none", flexDirection: "column" }}>

            <div className="header-bar">
              <BackButton onClick={goBack} />
              <div>
                <p className="sub-label">Choose Case</p>
                <h2 className="screen-title">{activeLetter}</h2>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, padding: "8px 16px", flex: 1 }}>
              {/* Uppercase */}
              <button className={`skeu-button case-option ${captured[activeLetter] ? "captured" : ""}`}
                onClick={() => openDraw("upper")}
                style={{ border: "none", flex: 1, flexDirection: "column" }}>
                <span className="case-letter">{activeLetter}</span>
                <span className="case-tag">Uppercase</span>
                {captured[activeLetter] && (
                  <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 6 }}>
                    <img src={captured[activeLetter]} alt={activeLetter}
                      style={{ width: 32, height: 32, borderRadius: 6, objectFit: "contain", background: "rgba(0,0,0,0.2)" }} />
                    <span style={{ fontSize: 11, color: ACCENT, letterSpacing: "0.08em" }}>Saved ✓</span>
                  </div>
                )}
              </button>

              {/* Lowercase */}
              <button className={`skeu-button case-option ${captured[activeLetter.toLowerCase()] ? "captured" : ""}`}
                onClick={() => openDraw("lower")}
                style={{ border: "none", flex: 1, flexDirection: "column" }}>
                <span className="case-letter" style={{ fontStyle: "italic" }}>{activeLetter.toLowerCase()}</span>
                <span className="case-tag">Lowercase</span>
                {captured[activeLetter.toLowerCase()] && (
                  <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 6 }}>
                    <img src={captured[activeLetter.toLowerCase()]} alt={activeLetter.toLowerCase()}
                      style={{ width: 32, height: 32, borderRadius: 6, objectFit: "contain", background: "rgba(0,0,0,0.2)" }} />
                    <span style={{ fontSize: 11, color: ACCENT, letterSpacing: "0.08em" }}>Saved ✓</span>
                  </div>
                )}
              </button>
            </div>

            <div style={{ padding: "0 16px 32px", display: "flex", flexDirection: "column", gap: 10 }}>
              <div className="divider" style={{ margin: "8px 0" }} />
              <p style={{ textAlign: "center", fontFamily: "'Crimson Pro', serif", fontStyle: "italic", fontSize: 14, color: "rgba(244,248,249,0.35)", letterSpacing: "0.04em" }}>
                Tap to draw your handwritten character
              </p>
            </div>
          </div>
        )}

        {/* DRAW SCREEN */}
        {activeLetter && activeCase && (
          <div className={`screen ${screen !== "draw" ? "hidden" : ""}`}
            style={{ display: screen === "draw" ? "flex" : "none", flexDirection: "column" }}>

            <div className="header-bar">
              <BackButton onClick={goBack} />
              <div>
                <p className="sub-label">{activeCase === "upper" ? "Uppercase" : "Lowercase"}</p>
                <h2 className="screen-title">
                  Write '{activeCase === "upper" ? activeLetter : activeLetter.toLowerCase()}'
                </h2>
              </div>
            </div>

            <div style={{ padding: "4px 0 16px" }}>
              {drawCaptured ? (
                <div style={{ margin: "0 16px 12px", padding: "10px 16px", borderRadius: 12, background: "rgba(76,175,136,0.08)", border: "1px solid rgba(200,230,192,0.15)", display: "flex", alignItems: "center", gap: 10 }}>
                  <img src={drawCaptured} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: "contain" }} />
                  <span style={{ fontFamily: "'Crimson Pro', serif", fontSize: 14, color: ACCENT }}>Previously saved — redraw to update</span>
                </div>
              ) : null}

              <DrawingCanvas
                key={`${activeLetter}-${activeCase}`}
                letter={activeCase === "upper" ? activeLetter : activeLetter.toLowerCase()}
                onSave={handleSave}
              />
            </div>

            <div style={{ padding: "12px 20px 32px" }}>
              <div style={{ borderRadius: 16, padding: "14px 18px", background: "rgba(244,248,249,0.03)", border: "1px solid rgba(244,248,249,0.06)" }}>
                <p style={{ fontFamily: "'Crimson Pro', serif", fontSize: 13, color: "rgba(244,248,249,0.4)", lineHeight: 1.6, letterSpacing: "0.03em" }}>
                  Write naturally on the canvas above. Use the dashed baseline as a guide. Your strokes will be digitized and stored in your personal font set.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TOAST */}
        <div className={`toast ${toast.show ? "show" : ""}`}>{toast.msg}</div>
      </div>
    </>
  );
}
