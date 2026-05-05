import supabase from "../config/Supabaseclient.js"



export async function saveJD(parsedData, plainText = "", userId = null) {

  const jdPayload = {
    user_id:           userId,
    title:             parsedData.title            ?? "",
    company_name:      parsedData.company_name     ?? "",
    location:          parsedData.location         ?? "",
    employment_type:   parsedData.employment_type  ?? "",
    raw_text:          parsedData.raw_text         ?? "",
    plain_text:        plainText,
    structured_json:   parsedData,
    processing_status: "completed",
    version:           1,
  }

  const { data, error } = await supabase
    .from("job_descriptions")
    .insert(jdPayload)
    .select("id")
    .single()

  if (error) throw new Error(`Failed to save JD: ${error.message}`)

  console.log(`[jdService] JD saved with id: ${data.id}`)
  return { jd_id: data.id }
}


export async function saveJDEmbedding(jdId, embedding) {
  const { error } = await supabase
    .from("job_descriptions")
    .update({ embedding })
    .eq("id", jdId)

  if (error) throw new Error(`Failed to save JD embedding: ${error.message}`)
  console.log(`[jdService] Embedding saved for JD: ${jdId}`)
  return { success: true }
}



export async function getJDById(jdId) {
  const { data, error } = await supabase
    .from("job_descriptions")
    .select("*")
    .eq("id", jdId)
    .single()

  if (error) throw new Error(`Failed to fetch JD: ${error.message}`)
  return data
}



export async function getJDsByUser(userId) {
  const { data, error } = await supabase
    .from("job_descriptions")
    .select("id, title, company_name, location, employment_type, processing_status, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) throw new Error(`Failed to fetch JDs: ${error.message}`)
  return data
}


export async function deleteJD(jdId) {
  const { error } = await supabase
    .from("job_descriptions")
    .delete()
    .eq("id", jdId)

  if (error) throw new Error(`Failed to delete JD: ${error.message}`)
  return { success: true }
}