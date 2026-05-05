const Button = ({ children, onClick, type = "button", loading = false, className = "" }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading}
      className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm transition
        bg-blue-600 hover:bg-blue-700 text-white
        disabled:opacity-60 disabled:cursor-not-allowed
        ${className}`}
    >
      {loading ? "Loading..." : children}
    </button>
  )
}

export default Button