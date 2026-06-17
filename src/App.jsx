import { useCallback, useRef, useState } from 'react'
import tinycolor from 'tinycolor2'
import { toPng } from 'html-to-image'
import ColorCard from './components/ColorCard.jsx'
import Toast from './components/Toast.jsx'
import ColorPickerPanel from './components/ColorPickerPanel.jsx'
import Logo from './components/Logo.jsx'

// ─── Variation metadata ──────────────────────────────────────────────────────
const VARIATIONS = [
  { name: 'Classic',   desc: 'Complement · Standard Analogous · Triad + Tints · TinyColor Mono' },
  { name: 'Split',     desc: 'Split-Complement · Narrow Spread · Square / Tetrad · Lightness Sweep' },
  { name: 'Square',    desc: 'Tetrad · Wide Spread · Split-Complement · Saturation Sweep' },
  { name: 'Harmonic',  desc: 'Sat. Contrast · Very Wide Spread · Triad Tints & Shades · Hue Spin' },
]
const TOTAL_VARIATIONS = VARIATIONS.length

// ─── Palette generator (variation-aware) ─────────────────────────────────────
function generatePalettes(hex, variation = 0) {
  const v = variation % TOTAL_VARIATIONS

  // ── COMPLEMENTARY ─────────────────────────────────────────────────────────
  let complementary
  if (v === 0) {
    // Classic complement
    complementary = [
      { color: tinycolor(hex).toHexString(),                               label: 'Base' },
      { color: tinycolor(hex).complement().toHexString(),                  label: 'Complement' },
      { color: tinycolor(hex).lighten(20).toHexString(),                   label: 'Light Base' },
      { color: tinycolor(hex).complement().lighten(20).toHexString(),      label: 'Light Comp.' },
      { color: tinycolor(hex).darken(20).toHexString(),                    label: 'Dark Base' },
      { color: tinycolor(hex).complement().darken(20).toHexString(),       label: 'Dark Comp.' },
    ]
  } else if (v === 1) {
    // Split-complement
    const s = tinycolor(hex).splitcomplement()
    complementary = [
      { color: s[0].toHexString(),                label: 'Base' },
      { color: s[1].toHexString(),                label: 'Split 1' },
      { color: s[2].toHexString(),                label: 'Split 2' },
      { color: s[0].lighten(15).toHexString(),    label: 'Base Tint' },
      { color: s[1].lighten(15).toHexString(),    label: 'Split 1 Tint' },
      { color: s[2].lighten(15).toHexString(),    label: 'Split 2 Tint' },
    ]
  } else if (v === 2) {
    // Tetrad (4 square colors + 2 tints)
    const t = tinycolor(hex).tetrad()
    complementary = [
      { color: t[0].toHexString(),             label: 'Base' },
      { color: t[1].toHexString(),             label: 'Tetrad 1' },
      { color: t[2].toHexString(),             label: 'Tetrad 2' },
      { color: t[3].toHexString(),             label: 'Tetrad 3' },
      { color: t[0].lighten(22).toHexString(), label: 'Tint' },
      { color: t[2].lighten(22).toHexString(), label: 'Tetrad 2 Tint' },
    ]
  } else {
    // Saturation contrast
    complementary = [
      { color: tinycolor(hex).saturate(30).toHexString(),              label: 'Vivid' },
      { color: tinycolor(hex).toHexString(),                           label: 'Base' },
      { color: tinycolor(hex).desaturate(30).toHexString(),            label: 'Muted' },
      { color: tinycolor(hex).complement().saturate(30).toHexString(), label: 'Comp. Vivid' },
      { color: tinycolor(hex).complement().toHexString(),              label: 'Complement' },
      { color: tinycolor(hex).complement().desaturate(30).toHexString(), label: 'Comp. Muted' },
    ]
  }

  // ── ANALOGOUS ─────────────────────────────────────────────────────────────
  // TinyColor analogous(results, slices): 360/slices = degrees between steps
  const analogousSlices = [30, 45, 20, 12] // v0=12°, v1=8°, v2=18°, v3=30° spread
  const analogous = tinycolor(hex)
    .analogous(6, analogousSlices[v])
    .map((c, i) => ({
      color: c.toHexString(),
      label: i === 0 ? 'Base' : `Analogous ${i}`,
    }))

  // ── TRIADIC ───────────────────────────────────────────────────────────────
  let triadic
  if (v === 0) {
    // Classic triad + tints
    const t = tinycolor(hex).triad()
    triadic = [
      { color: t[0].toHexString(),             label: 'Base' },
      { color: t[1].toHexString(),             label: 'Triadic 1' },
      { color: t[2].toHexString(),             label: 'Triadic 2' },
      { color: t[0].lighten(22).toHexString(), label: 'Light Base' },
      { color: t[1].lighten(22).toHexString(), label: 'Light 1' },
      { color: t[2].lighten(22).toHexString(), label: 'Light 2' },
    ]
  } else if (v === 1) {
    // Tetrad (square)
    const t = tinycolor(hex).tetrad()
    triadic = [
      { color: t[0].toHexString(),             label: 'Base' },
      { color: t[1].toHexString(),             label: 'Square 1' },
      { color: t[2].toHexString(),             label: 'Square 2' },
      { color: t[3].toHexString(),             label: 'Square 3' },
      { color: t[0].lighten(25).toHexString(), label: 'Highlight' },
      { color: t[0].darken(25).toHexString(),  label: 'Shadow' },
    ]
  } else if (v === 2) {
    // Split-complement with darks
    const s = tinycolor(hex).splitcomplement()
    triadic = [
      { color: s[0].toHexString(),             label: 'Base' },
      { color: s[1].toHexString(),             label: 'Split 1' },
      { color: s[2].toHexString(),             label: 'Split 2' },
      { color: s[0].darken(20).toHexString(),  label: 'Base Dark' },
      { color: s[1].darken(20).toHexString(),  label: 'Split 1 Dark' },
      { color: s[2].darken(20).toHexString(),  label: 'Split 2 Dark' },
    ]
  } else {
    // Triad tints and shades
    const t = tinycolor(hex).triad()
    triadic = [
      { color: t[0].lighten(30).toHexString(), label: 'Tint Base' },
      { color: t[1].lighten(30).toHexString(), label: 'Tint 1' },
      { color: t[2].lighten(30).toHexString(), label: 'Tint 2' },
      { color: t[0].darken(30).toHexString(),  label: 'Shade Base' },
      { color: t[1].darken(30).toHexString(),  label: 'Shade 1' },
      { color: t[2].darken(30).toHexString(),  label: 'Shade 2' },
    ]
  }

  // ── MONOCHROMATIC ─────────────────────────────────────────────────────────
  let monochromatic
  if (v === 0) {
    // TinyColor native mono
    monochromatic = tinycolor(hex)
      .monochromatic(6)
      .sort((a, b) => b.getLuminance() - a.getLuminance())
      .map((c, i) => ({ color: c.toHexString(), label: i === 0 ? 'Lightest' : i === 5 ? 'Darkest' : `Shade ${i}` }))
  } else if (v === 1) {
    // Lightness sweep
    monochromatic = [
      { color: tinycolor(hex).lighten(40).toHexString(), label: 'Lightest' },
      { color: tinycolor(hex).lighten(25).toHexString(), label: 'Light' },
      { color: tinycolor(hex).lighten(10).toHexString(), label: 'Soft' },
      { color: tinycolor(hex).toHexString(),             label: 'Base' },
      { color: tinycolor(hex).darken(15).toHexString(),  label: 'Deep' },
      { color: tinycolor(hex).darken(30).toHexString(),  label: 'Darkest' },
    ]
  } else if (v === 2) {
    // Saturation sweep
    monochromatic = [
      { color: tinycolor(hex).desaturate(50).lighten(15).toHexString(), label: 'Pale' },
      { color: tinycolor(hex).desaturate(25).toHexString(),             label: 'Muted' },
      { color: tinycolor(hex).toHexString(),                            label: 'Base' },
      { color: tinycolor(hex).saturate(20).toHexString(),               label: 'Vivid' },
      { color: tinycolor(hex).saturate(40).toHexString(),               label: 'Vibrant' },
      { color: tinycolor(hex).saturate(40).darken(15).toHexString(),    label: 'Rich' },
    ]
  } else {
    // Hue-spin warm ↔ cool
    monochromatic = [
      { color: tinycolor(hex).spin(-20).lighten(18).toHexString(), label: 'Cool Light' },
      { color: tinycolor(hex).spin(-10).toHexString(),             label: 'Cool' },
      { color: tinycolor(hex).toHexString(),                       label: 'Base' },
      { color: tinycolor(hex).spin(10).toHexString(),              label: 'Warm' },
      { color: tinycolor(hex).spin(20).toHexString(),              label: 'Warmer' },
      { color: tinycolor(hex).spin(20).darken(18).toHexString(),   label: 'Warm Dark' },
    ]
  }

  return { complementary, analogous, triadic, monochromatic }
}

// ─── Random hex helper ────────────────────────────────────────────────────────
function randomHex() {
  const hue = Math.floor(Math.random() * 360)
  const sat = 55 + Math.floor(Math.random() * 35)   // 55–90% — vivid, never dull
  const lit = 35 + Math.floor(Math.random() * 30)   // 35–65% — never too dark/light
  return tinycolor({ h: hue, s: sat, l: lit }).toHexString()
}

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [baseColor, setBaseColor]   = useState('#7c3aed')
  const [hexInput, setHexInput]     = useState('#7c3aed')
  const [palettes, setPalettes]     = useState(null)
  const [variation, setVariation]   = useState(0)
  const [toasts, setToasts]         = useState([])
  const [exporting, setExporting]   = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [spinning, setSpinning]     = useState(false)   // randomize animation flag
  const exportRef = useRef(null)

  // ── toast helpers ──────────────────────────────────────────────────────────
  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }, [])

  // ── color sync ─────────────────────────────────────────────────────────────
  const handlePickerChange = (e) => {
    const val = e.target.value
    setBaseColor(val)
    setHexInput(val)
  }

  const handleHexInput = (e) => {
    const val = e.target.value
    setHexInput(val)
    const c = tinycolor(val)
    if (c.isValid()) setBaseColor(c.toHexString())
  }

  // ── apply color from picker panel ──────────────────────────────────────────
  const handleApplyColor = (hex) => {
    const c = tinycolor(hex)
    if (!c.isValid()) return
    const h = c.toHexString()
    setBaseColor(h)
    setHexInput(h)
  }

  // ── generate ───────────────────────────────────────────────────────────────
  const handleGenerate = () => {
    const c = tinycolor(baseColor)
    if (!c.isValid()) { addToast('Invalid color value', 'error'); return }
    const newVar = 0
    setVariation(newVar)
    setPalettes(generatePalettes(c.toHexString(), newVar))
    addToast(`Palettes generated! 🎨`)
  }

  // ── randomize ──────────────────────────────────────────────────────────────
  const handleRandomize = () => {
    const hex = randomHex()
    setBaseColor(hex)
    setHexInput(hex)
    const newVar = 0
    setVariation(newVar)
    setPalettes(generatePalettes(hex, newVar))
    setSpinning(true)
    setTimeout(() => setSpinning(false), 600)
    addToast(`Random color: ${hex.toUpperCase()} 🎲`)
  }

  // ── regenerate (same base, next variation) ─────────────────────────────────
  const handleRegenerate = () => {
    if (!palettes) { addToast('Generate a palette first!', 'error'); return }
    const c = tinycolor(baseColor)
    const nextVar = (variation + 1) % TOTAL_VARIATIONS
    setVariation(nextVar)
    setPalettes(generatePalettes(c.toHexString(), nextVar))
    addToast(`Variation: ${VARIATIONS[nextVar].name} (${nextVar + 1}/${TOTAL_VARIATIONS}) 🔄`)
  }

  // ── export PNG ─────────────────────────────────────────────────────────────
  const handleExport = async () => {
    if (!palettes) { addToast('Generate a palette first!', 'error'); return }
    if (!exportRef.current) return
    setExporting(true)
    try {
      const dataUrl = await toPng(exportRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#0a0a0f',
      })
      const link = document.createElement('a')
      link.download = `colorforge-${baseColor.replace('#', '')}-v${variation + 1}.png`
      link.href = dataUrl
      link.click()
      addToast('Palette exported as PNG! 🖼️')
    } catch {
      addToast('Export failed. Try again.', 'error')
    } finally {
      setExporting(false)
    }
  }

  // ── copy all HEX ───────────────────────────────────────────────────────────
  const copyAllHex = (colors) => {
    const text = colors.map(c => c.color).join('  ')
    navigator.clipboard.writeText(text).then(() => addToast('All HEX values copied!'))
  }

  return (
    <>
      {/* Animated background */}
      <div className="bg-canvas" aria-hidden="true">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-orb bg-orb-3" />
      </div>

      <div className="app">
        {/* ── HEADER ── */}
        <header className="header">
          <div className="container">
            <div className="header-inner">
              <div className="header-logo">
                <div className="logo-icon">
                  <Logo size={44} />
                </div>
                <div>
                  <div className="header-title">ColorForge</div>
                  <div className="header-subtitle">Color Palette Generator</div>
                </div>
              </div>
              <div className="header-badge">v1.0</div>
            </div>
          </div>
        </header>

        <main style={{ flex: 1 }}>
          <div className="container">
            {/* ── HERO ── */}
            <section className="hero">
              <div className="hero-eyebrow">
                <span>✨</span>
                Instant Color Harmony
              </div>
              <h1 className="hero-title">
                Forge Beautiful<br />
                <span>Color Palettes</span>
              </h1>
              <p className="hero-desc">
                Pick any base color and instantly generate complementary, analogous, triadic,
                and monochromatic palettes — ready to copy or export.
              </p>
            </section>

            {/* ── PICKER CARD ── */}
            <section className="picker-section">
              <div className="picker-card">
                {/* Left: Color preview + Choose Color button */}
                <div className="picker-left">
                  {/* Clickable color swatch */}
                  <button
                    className="color-preview-btn"
                    onClick={() => setShowPicker(true)}
                    style={{ '--preview-color': baseColor }}
                    id="btn-choose-color"
                    title="Open color picker"
                    aria-label="Choose a color"
                  >
                    <div className="color-ring" style={{
                      background: `conic-gradient(${baseColor}, ${tinycolor(baseColor).complement().toHexString()}, ${baseColor})`,
                    }} />
                    <div className="preview-swatch" style={{ background: baseColor }}>
                      <span className="preview-icon">🎨</span>
                    </div>
                  </button>

                  {/* Info + Choose Color CTA */}
                  <div className="picker-info">
                    <h3>Base Color</h3>
                    <div className="hex-display">{baseColor.toUpperCase()}</div>
                    {/* Quick hex input */}
                    <input
                      type="text"
                      className="hex-text-input"
                      value={hexInput}
                      onChange={handleHexInput}
                      placeholder="#7c3aed"
                      maxLength={9}
                      spellCheck={false}
                    />
                    <button
                      className="btn-choose-color"
                      id="btn-open-picker"
                      onClick={() => setShowPicker(true)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/>
                        <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/>
                        <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>
                        <circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>
                        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
                      </svg>
                      Choose Color
                    </button>
                  </div>
                </div>

                {/* Right: Action buttons */}
                <div className="picker-actions">
                  {/* Row 1: primary actions */}
                  <div className="btn-row">
                    <button id="btn-generate" className="btn-generate" onClick={handleGenerate}>
                      <span>⚡</span> Generate
                    </button>
                    <button
                      id="btn-randomize"
                      className={`btn-randomize${spinning ? ' spinning' : ''}`}
                      onClick={handleRandomize}
                      title="Pick a random color and generate"
                    >
                      <span className="dice-icon">🎲</span> Randomize
                    </button>
                  </div>

                  {/* Row 2: secondary actions */}
                  <div className="btn-row">
                    <button
                      id="btn-regenerate"
                      className="btn-regenerate"
                      onClick={handleRegenerate}
                      disabled={!palettes}
                      title="Generate a different combination from the same base color"
                    >
                      <span>🔄</span> Regenerate
                    </button>
                    <button
                      id="btn-export"
                      className="btn-export"
                      onClick={handleExport}
                      disabled={exporting || !palettes}
                    >
                      <span>{exporting ? '⏳' : '📥'}</span>
                      {exporting ? 'Exporting…' : 'Export PNG'}
                    </button>
                  </div>

                  {/* Variation indicator */}
                  {palettes && (
                    <div className="variation-badge">
                      <span className="var-dot" />
                      <span className="var-name">{VARIATIONS[variation].name}</span>
                      <span className="var-step">{variation + 1} / {TOTAL_VARIATIONS}</span>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* ── PALETTES ── */}
            <section className="palettes-area" id="export-target" ref={exportRef}>
              {palettes ? (
                <>
                  <PaletteGroup
                    title="Complementary"
                    icon="🔮"
                    iconClass="complementary"
                    colors={palettes.complementary}
                    onCopyAll={() => copyAllHex(palettes.complementary)}
                    onToast={addToast}
                  />
                  <div className="section-divider" />
                  <PaletteGroup
                    title="Analogous"
                    icon="🌊"
                    iconClass="analogous"
                    colors={palettes.analogous}
                    onCopyAll={() => copyAllHex(palettes.analogous)}
                    onToast={addToast}
                  />
                  <div className="section-divider" />
                  <PaletteGroup
                    title="Triadic"
                    icon="🔺"
                    iconClass="triadic"
                    colors={palettes.triadic}
                    onCopyAll={() => copyAllHex(palettes.triadic)}
                    onToast={addToast}
                  />
                  <div className="section-divider" />
                  <PaletteGroup
                    title="Monochromatic"
                    icon="🎞️"
                    iconClass="monochromatic"
                    colors={palettes.monochromatic}
                    onCopyAll={() => copyAllHex(palettes.monochromatic)}
                    onToast={addToast}
                  />
                </>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">🎨</div>
                  <h2 className="empty-title">Ready to Forge Colors</h2>
                  <p className="empty-desc">
                    Choose your base color and hit <strong>Generate</strong>, or press{' '}
                    <strong>Randomize</strong> to instantly discover a stunning palette.
                  </p>
                  <button className="btn-randomize empty-randomize" onClick={handleRandomize}>
                    <span className="dice-icon">🎲</span> Surprise Me!
                  </button>
                </div>
              )}
            </section>
          </div>
        </main>

        {/* ── FOOTER ── */}
        <Footer />

        {/* ── COLOR PICKER PANEL ── */}
        {showPicker && (
          <ColorPickerPanel
            currentColor={baseColor}
            onApply={handleApplyColor}
            onClose={() => setShowPicker(false)}
          />
        )}

        {/* ── TOASTS ── */}
        <div className="toast-container" aria-live="polite">
          {toasts.map(t => (
            <Toast key={t.id} message={t.message} type={t.type} />
          ))}
        </div>
      </div>
    </>
  )
}

// ─── PaletteGroup ─────────────────────────────────────────────────────────────
function PaletteGroup({ title, icon, iconClass, colors, onCopyAll, onToast }) {
  return (
    <div className="palette-group">
      <div className="palette-header">
        <div className={`palette-icon ${iconClass}`}>{icon}</div>
        <h2 className="palette-title">{title}</h2>
        <span className="palette-count">{colors.length} colors</span>
      </div>
      <div className="color-grid">
        {colors.map((c, i) => (
          <ColorCard key={`${c.color}-${i}`} hex={c.color} label={c.label} onToast={onToast} />
        ))}
      </div>
      <div className="copy-all-row">
        <button className="copy-all-btn" onClick={onCopyAll} id={`copy-all-${iconClass}`}>
          📋 Copy all HEX
        </button>
      </div>
    </div>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="footer-logo-mini">
              <Logo size={36} />
            </div>
            <div>
              <div className="footer-name">Vikrant Ruhela Rajput</div>
              <div className="footer-email">vikrantruhela001@gmail.com</div>
            </div>
          </div>
          <a
            id="btn-digital-heroes"
            href="https://digitalheroesco.com"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-cta"
          >
            <span>🦸</span>
            Built for Digital Heroes
          </a>
        </div>
      </div>
    </footer>
  )
}
