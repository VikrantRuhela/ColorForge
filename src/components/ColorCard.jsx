import { useState, useCallback } from 'react'
import tinycolor from 'tinycolor2'

// ─── Clipboard helper ────────────────────────────────────────────────────────
async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text)
  } else {
    // Fallback for non-secure contexts
    const el = document.createElement('textarea')
    el.value = text
    el.style.position = 'fixed'
    el.style.opacity = '0'
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
  }
}

// ─── ColorCard ────────────────────────────────────────────────────────────────
export default function ColorCard({ hex, label, onToast }) {
  const [copied, setCopied] = useState(false)
  const [copiedField, setCopiedField] = useState('')

  const color = tinycolor(hex)
  const rgb = color.toRgb()
  const rgbStr = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
  const hexUpper = hex.toUpperCase()

  // Determine text color for readability on the swatch
  const isDark = color.isDark()
  const textOnSwatch = isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)'

  const handleCopy = useCallback(async (value, field) => {
    try {
      await copyToClipboard(value)
      setCopied(true)
      setCopiedField(field)
      onToast?.(`${field} copied: ${value}`)
      setTimeout(() => { setCopied(false); setCopiedField('') }, 2000)
    } catch {
      onToast?.('Failed to copy', 'error')
    }
  }, [onToast])

  return (
    <div className="color-card fade-in-up">
      {/* Swatch */}
      <div
        className="color-swatch"
        style={{ backgroundColor: hex }}
        role="img"
        aria-label={`Color swatch: ${hexUpper}`}
      >
        <div className="swatch-shine" />
        {/* Copy HEX button on swatch */}
        <button
          className={`copy-btn${copied ? ' copied' : ''}`}
          onClick={() => handleCopy(hexUpper, 'HEX')}
          title="Copy HEX"
          id={`copy-hex-${hexUpper.replace('#', '')}`}
          aria-label={`Copy HEX ${hexUpper}`}
        >
          {copied && copiedField === 'HEX' ? '✓' : '⧉'}
        </button>
      </div>

      {/* Info */}
      <div className="color-info">
        <div
          className="color-hex"
          style={{ cursor: 'pointer' }}
          onClick={() => handleCopy(hexUpper, 'HEX')}
          title="Click to copy HEX"
        >
          {hexUpper}
        </div>
        <div
          className="color-rgb"
          style={{ cursor: 'pointer' }}
          onClick={() => handleCopy(rgbStr, 'RGB')}
          title="Click to copy RGB"
        >
          {rgbStr}
        </div>
        <span className="color-label">{label}</span>
      </div>
    </div>
  )
}
