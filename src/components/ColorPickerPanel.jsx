import { useState, useEffect, useCallback } from 'react'
import tinycolor from 'tinycolor2'

// ─── Curated preset palette (72 colors, 9 rows × 8 cols) ─────────────────────
const PRESETS = [
  // Reds & Corals
  '#ff4757', '#e63946', '#dc2626', '#b91c1c', '#ff6b81', '#ff8fa3', '#fecdd3', '#ffe4e6',
  // Oranges & Ambers
  '#f97316', '#ea580c', '#c2410c', '#9a3412', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5',
  // Yellows & Limes
  '#eab308', '#ca8a04', '#a16207', '#854d0e', '#facc15', '#fde047', '#bef264', '#d9f99d',
  // Greens & Emeralds
  '#22c55e', '#16a34a', '#15803d', '#14532d', '#4ade80', '#86efac', '#10b981', '#34d399',
  // Teals & Cyans
  '#14b8a6', '#0d9488', '#0f766e', '#134e4a', '#2dd4bf', '#06b6d4', '#0891b2', '#22d3ee',
  // Sky & Blues
  '#0ea5e9', '#0284c7', '#0369a1', '#075985', '#3b82f6', '#2563eb', '#60a5fa', '#93c5fd',
  // Indigos & Violets
  '#6366f1', '#4f46e5', '#4338ca', '#3730a3', '#818cf8', '#a5b4fc', '#8b5cf6', '#7c3aed',
  // Purples & Pinks
  '#a855f7', '#9333ea', '#7e22ce', '#d946ef', '#c4b5fd', '#ec4899', '#db2777', '#f9a8d4',
  // Neutrals
  '#ffffff', '#f1f5f9', '#cbd5e1', '#94a3b8', '#64748b', '#334155', '#1e293b', '#0f172a',
]

export default function ColorPickerPanel({ currentColor, onApply, onClose }) {
  const initial = tinycolor(currentColor).isValid() ? tinycolor(currentColor).toHexString() : '#7c3aed'

  const [selected, setSelected]   = useState(initial)
  const [hexVal, setHexVal]       = useState(initial)
  const [hsl, setHsl]             = useState(() => hexToHsl(initial))
  const [eyedropperOk]            = useState(() => 'EyeDropper' in window)

  // ── helpers ──────────────────────────────────────────────────────────────
  function hexToHsl(hex) {
    const c = tinycolor(hex).toHsl()
    return { h: Math.round(c.h), s: Math.round(c.s * 100), l: Math.round(c.l * 100) }
  }

  function applyHex(hex) {
    const c = tinycolor(hex)
    if (!c.isValid()) return
    const h = c.toHexString()
    setSelected(h)
    setHsl(hexToHsl(h))
  }

  function applyHsl(newHsl) {
    const c = tinycolor({ h: newHsl.h, s: newHsl.s / 100, l: newHsl.l / 100 })
    const h = c.toHexString()
    setSelected(h)
    setHexVal(h)
  }

  // ── handlers ─────────────────────────────────────────────────────────────
  const handleHexChange = (e) => {
    const val = e.target.value
    setHexVal(val)
    applyHex(val)
  }

  const handlePreset = (hex) => {
    setSelected(hex)
    setHexVal(hex)
    applyHex(hex)
  }

  const handleHslChange = (field, value) => {
    const newHsl = { ...hsl, [field]: Number(value) }
    setHsl(newHsl)
    applyHsl(newHsl)
  }

  const handleEyeDropper = async () => {
    try {
      const picker = new window.EyeDropper()
      const result = await picker.open()
      handlePreset(tinycolor(result.sRGBHex).toHexString())
    } catch { /* user cancelled */ }
  }

  // ── ESC to close ─────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // ── computed slider backgrounds ───────────────────────────────────────────
  const satBg = `linear-gradient(to right,
    ${tinycolor({ h: hsl.h, s: 0,   l: hsl.l / 100 }).toHexString()},
    ${tinycolor({ h: hsl.h, s: 1,   l: hsl.l / 100 }).toHexString()})`
  const litBg = `linear-gradient(to right, #000,
    ${tinycolor({ h: hsl.h, s: hsl.s / 100, l: 0.5 }).toHexString()}, #fff)`

  return (
    <div
      className="cp-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label="Color Picker"
    >
      <div className="cp-modal">

        {/* ── Header ── */}
        <div className="cp-header">
          <div className="cp-preview-swatch" style={{ background: selected }} />
          <div className="cp-header-info">
            <h3 className="cp-title">Choose a Color</h3>
            <span className="cp-selected-hex">{selected.toUpperCase()}</span>
          </div>
          <button className="cp-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* ── HEX Input + EyeDropper ── */}
        <div className="cp-hex-row">
          <span className="cp-label">HEX</span>
          <input
            id="cp-hex-input"
            className="cp-hex-input"
            type="text"
            value={hexVal}
            onChange={handleHexChange}
            maxLength={9}
            spellCheck={false}
            placeholder="#7c3aed"
          />
          {eyedropperOk && (
            <button
              className="cp-eyedropper-btn"
              onClick={handleEyeDropper}
              title="Pick any color from your screen"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m2 22 1-1h3l9-9"/>
                <path d="M3 21v-3l9-9"/>
                <path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.1 2.1 0 1 1-3 3l-3.8-3.8"/>
              </svg>
              Screen
            </button>
          )}
        </div>

        {/* ── HSL Sliders ── */}
        <div className="cp-sliders">
          {/* Hue */}
          <div className="cp-slider-row">
            <span className="cp-label">H</span>
            <div className="cp-slider-track hue-track">
              <input
                type="range" min="0" max="360" step="1"
                value={hsl.h}
                onChange={e => handleHslChange('h', e.target.value)}
                style={{ '--thumb-color': selected }}
              />
            </div>
            <span className="cp-slider-val">{hsl.h}°</span>
          </div>
          {/* Saturation */}
          <div className="cp-slider-row">
            <span className="cp-label">S</span>
            <div className="cp-slider-track" style={{ background: satBg }}>
              <input
                type="range" min="0" max="100" step="1"
                value={hsl.s}
                onChange={e => handleHslChange('s', e.target.value)}
                style={{ '--thumb-color': selected }}
              />
            </div>
            <span className="cp-slider-val">{hsl.s}%</span>
          </div>
          {/* Lightness */}
          <div className="cp-slider-row">
            <span className="cp-label">L</span>
            <div className="cp-slider-track" style={{ background: litBg }}>
              <input
                type="range" min="0" max="100" step="1"
                value={hsl.l}
                onChange={e => handleHslChange('l', e.target.value)}
                style={{ '--thumb-color': selected }}
              />
            </div>
            <span className="cp-slider-val">{hsl.l}%</span>
          </div>
        </div>

        {/* ── Preset swatches ── */}
        <p className="cp-presets-label">Preset Colors</p>
        <div className="cp-preset-grid" role="listbox" aria-label="Color presets">
          {PRESETS.map((hex, i) => (
            <button
              key={i}
              className={`cp-preset${selected.toLowerCase() === hex.toLowerCase() ? ' active' : ''}`}
              style={{ background: hex }}
              onClick={() => handlePreset(hex)}
              title={hex.toUpperCase()}
              aria-label={`Select ${hex.toUpperCase()}`}
              role="option"
              aria-selected={selected.toLowerCase() === hex.toLowerCase()}
            />
          ))}
        </div>

        {/* ── Actions ── */}
        <div className="cp-actions">
          <button className="cp-cancel-btn" onClick={onClose}>Cancel</button>
          <button
            className="cp-apply-btn"
            id="cp-apply"
            onClick={() => { onApply(selected); onClose() }}
          >
            <span>✓</span> Apply Color
          </button>
        </div>

      </div>
    </div>
  )
}
