import supabase from "../config/Supabaseclient.js"

export async function saveResume(parsedData, plainText = "", fileInfo = {}, userId = null) {

  const resumePayload = {
    user_id:          userId,
    candidate_name:   parsedData.basic_info?.name              ?? "",
    email:            parsedData.basic_info?.email             ?? "",
    phone:            parsedData.basic_info?.phone             ?? "",
    current_location: parsedData.basic_info?.location          ?? "",
    total_experience: parsedData._meta?.total_experience_years ?? 0,
    raw_text:         parsedData.raw_text                      ?? "",
    plain_text:       plainText,
    structured_json:  parsedData,
    processing_status: "completed",
    version:          1,
  }

  const { data: resumeData, error: resumeError } = await supabase
    .from("resumes")
    .insert(resumePayload)
    .select("id")
    .single()

  if (resumeError) throw new Error(`Failed to save resume: ${resumeError.message}`)

  const resumeId = resumeData.id
  console.log(`[resumeService] Resume saved with id: ${resumeId}`)

  if (fileInfo.file_name) {
    const filePayload = {
      user_id:        userId,
      resume_id:      resumeId,
      file_name:      fileInfo.file_name ?? "",
      file_path:      fileInfo.file_path ?? "",
      file_size:      fileInfo.file_size ?? 0,
      mime_type:      fileInfo.mime_type ?? "",
      version:        1,
      parsing_status: "completed",
      storage_status: "local",
      file_metadata: {
        extraction_source: parsedData._meta?.extraction_source ?? "unknown",
        skills_count:      parsedData._meta?.skills_count      ?? 0,
        parsed_at:         parsedData._meta?.parsed_at         ?? new Date().toISOString(),
      },
    }
    const { error: fileError } = await supabase
      .from("resume_files")
      .insert(filePayload)
    if (fileError) console.warn(`[resumeService] Failed to save file info: ${fileError.message}`)
  }

  return { resume_id: resumeId }
}


export async function getResumeById(resumeId) {
  const { data, error } = await supabase
    .from("resumes")
    .select("*")
    .eq("id", resumeId)
    .single()

  if (error) throw new Error(`Failed to fetch resume: ${error.message}`)
  return data
}



export async function getResumesByUser(userId) {
  const { data, error } = await supabase
    .from("resumes")
    .select("id, candidate_name, email, total_experience, processing_status, created_at, structured_json")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) throw new Error(`Failed to fetch resumes: ${error.message}`)
  return data
}


export async function deleteResume(resumeId) {
  const { error } = await supabase
    .from("resumes")
    .delete()
    .eq("id", resumeId)

  if (error) throw new Error(`Failed to delete resume: ${error.message}`)
  return { success: true }
}