export default function Input({ label, error, className = '', id, ...props }) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="font-display italic text-sm text-garden-forest font-semibold tracking-wide"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`
          w-full px-4 py-2.5 rounded-lg
          font-body text-sm text-garden-bark
          bg-garden-cream border
          shadow-inner-sm
          transition-all duration-200
          placeholder:text-garden-border placeholder:font-light
          focus:outline-none focus:ring-2 focus:ring-garden-sage/40 focus:border-garden-sage
          ${error
            ? 'border-garden-clay bg-[#FFF5F2] focus:ring-garden-clay/30 focus:border-garden-clay'
            : 'border-garden-border hover:border-garden-leaf'
          }
          ${className}
        `}
        {...props}
      />
      {error && (
        <span className="flex items-center gap-1 text-xs text-garden-clay font-body">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M6 0a6 6 0 100 12A6 6 0 006 0zm.75 9H5.25V7.5h1.5V9zm0-3H5.25V3h1.5v3z"/>
          </svg>
          {error}
        </span>
      )}
    </div>
  )
}
