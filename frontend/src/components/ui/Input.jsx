const Input = ({ label, type = "text", placeholder, value, onChange, error }) => {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`px-4 py-2.5 rounded-lg border text-sm outline-none transition
          ${error
            ? "border-red-400 focus:border-red-500"
            : "border-gray-300 focus:border-blue-500"
          }`}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}

export default Input