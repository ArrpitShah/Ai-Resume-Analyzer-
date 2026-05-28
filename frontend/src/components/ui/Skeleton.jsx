import useAuthStore from "../../stores/authStore"

export const Skeleton = ({ width, height, borderRadius = "12px", className = "" }) => {
  const darkMode = useAuthStore(s => s.darkMode)
  return (
    <div 
      className={`skeleton ${className}`}
      style={{ 
        width: width || "100%", 
        height: height || "20px", 
        borderRadius,
        background: darkMode ? "#1f2937" : "#f1f5f9",
        position: "relative",
        overflow: "hidden"
      }}
    />
  )
}

export const SkeletonCard = ({ children }) => (
  <div style={{ padding: "20px", borderRadius: "16px", border: "1px solid #f1f5f9", background: "#fff" }}>
    {children}
  </div>
)

export const SkeletonText = ({ lines = 3, gap = 8 }) => (
  <div style={{ display: "flex", flexDirection: "column", gap }}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} width={i === lines - 1 ? "60%" : "100%"} height="14px" />
    ))}
  </div>
)
