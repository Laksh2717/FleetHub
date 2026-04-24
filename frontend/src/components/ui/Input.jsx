export default function Input({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder = "",
  disabled = false,
  error = "",
  required = false,
  className = "",
  as,
  children,
  ...props
}) {
  return (
    <div className={className}>
      {type !== 'checkbox' && label && (
        <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor={name}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      {as === 'select' && (
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-md text-white focus:outline-none focus:border-orange-500 disabled:opacity-50"
          {...props}
        >
          {children}
        </select>
      )}
      {type === 'checkbox' && (
        <div className="flex items-center gap-2">
          <input
            id={name}
            name={name}
            type="checkbox"
            checked={!!value}
            onChange={onChange}
            disabled={disabled}
            className="w-4 h-4 cursor-pointer accent-orange-500"
            {...props}
          />
          {label && (
            <label htmlFor={name} className="text-sm text-gray-300 cursor-pointer select-none">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
          )}
        </div>
      )}
      {as !== 'select' && type !== 'checkbox' && (
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-md text-white focus:outline-none focus:border-orange-500 disabled:opacity-50"
          {...props}
        />
      )}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
