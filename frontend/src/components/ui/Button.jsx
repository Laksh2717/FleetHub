export default function Button({
  children,
  variant = "primary",
  size = "md",
  type = "button",
  loading = false,
  disabled = false,
  onClick,
  className = "",
}) {
  const variants = {
    primary:
      "bg-orange-600 text-white hover:bg-orange-700 disabled:bg-orange-500/50",
    secondary:
      "bg-white/10 text-white hover:bg-white/20 disabled:bg-white/10",
    danger:
      "bg-red-600 text-white hover:bg-red-500 disabled:bg-red-600/50",
    ghost:
      "bg-gray-600 text-white hover:bg-white/10 disabled:opacity-50",
  };

  const sizes = {
    sm: "px-3 py-1 text-sm rounded-md",
    md: "px-6 py-2 text-base rounded-lg",
    lg: "px-7 py-2 text-lg rounded-xl",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2
        font-semibold transition-all cursor-pointer
        focus:outline-none focus:ring-2 focus:ring-orange-500/60
        disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {loading && (
        <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}
