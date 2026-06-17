// Toast notification component
export default function Toast({ message, type = 'success' }) {
  const icon = type === 'error' ? '✕' : '✓'
  return (
    <div className={`toast${type === 'error' ? ' error' : ''}`} role="alert">
      <span>{icon}</span>
      {message}
    </div>
  )
}
