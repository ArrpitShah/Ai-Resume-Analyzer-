import supabase from "../config/Supabaseclient.js"

export const getMetrics = async (req, res) => {
  try {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    // 1. Avg Response Time & Total Requests (last 24h)
    const { data: perfData, error: pErr } = await supabase
      .from("performance_logs")
      .select("total_ms")
      .gte("created_at", yesterday)

    if (pErr) throw pErr

    const totalRequests = perfData.length
    const avgResponseTime = totalRequests > 0 
      ? Math.round(perfData.reduce((acc, curr) => acc + (curr.total_ms || 0), 0) / totalRequests)
      : 0

    // 2. Error Rate
    const { count: errorCount, error: eErr } = await supabase
      .from("error_logs")
      .select("*", { count: "exact", head: true })
      .gte("created_at", yesterday)

    if (eErr) throw eErr
    const errorRate = totalRequests > 0 ? ((errorCount / totalRequests) * 100).toFixed(2) : 0

    // 3. Top 5 Slowest Endpoints (last 24h)
    // Note: This requires request_logs joined with performance_logs or a combined table
    // Assuming performance_logs has endpoint info or we can aggregate by some logic
    // For now, let's just get the raw top 5 slowest entries
    const { data: slowest, error: sErr } = await supabase
      .from("performance_logs")
      .select("total_ms, created_at")
      .order("total_ms", { ascending: false })
      .limit(5)

    res.json({
      avgResponseTime,
      totalRequests,
      errorRate,
      slowestEntries: slowest
    })

  } catch (err) {
    console.error("[adminController] Error:", err.message)
    res.status(500).json({ error: "Failed to fetch metrics." })
  }
}
