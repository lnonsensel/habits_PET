const VARIANTS = {
  primary:
    'bg-garden-forest text-garden-cream border border-garden-forest ' +
    'hover:bg-[#235840] hover:shadow-paper-md active:translate-y-px active:shadow-paper',
  secondary:
    'bg-transparent text-garden-forest border border-garden-forest ' +
    'hover:bg-garden-mist active:translate-y-px',
  ghost:
    'bg-transparent text-garden-soil border border-garden-border ' +
    'hover:bg-garden-parchment hover:text-garden-bark',
  danger:
    'bg-garden-clay text-garden-cream border border-garden-clay ' +
    'hover:bg-[#a53a0c] active:translate-y-px',
}

export default function Button({
  children, loading, variant = 'primary', className = '', ...props
}) {
  return (
    <button
      disabled={loading || props.disabled}
      className={`
        inline-flex items-center justify-center gap-2
        px-5 py-2.5 rounded-full
        font-body text-sm font-semibold tracking-wide
        shadow-paper transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
        -translate-y-0 hover:-translate-y-0.5
        ${VARIANTS[variant]} ${className}
      `}
      {...props}
    >
      {loading ? (
        <>
          <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Прорастает…
        </>
      ) : children}
    </button>
  )
}
