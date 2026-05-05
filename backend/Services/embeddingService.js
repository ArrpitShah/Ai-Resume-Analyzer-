import { GoogleGenAI } from "@google/genai"
import supabase from "../config/Supabaseclient.js"



export async function generateEmbedding(text) {
  if (!text || typeof text !== "string" || text.trim().length < 5) {
    throw new Error("generateEmbedding: valid text required")
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

  const response = await ai.models.embedContent({
    model:    "gemini-embedding-001",
    contents: text,
  })

  const embedding = response.embeddings[0].values
  console.log(`[embeddingService] Embedding generated — ${embedding.length} dimensions`)
  return embedding
}



export async function saveResumeEmbedding(resumeId, embedding) {
  const { error } = await supabase
    .from("resumes")
    .update({ embedding })
    .eq("id", resumeId)

  if (error) throw new Error(`Failed to save embedding: ${error.message}`)
  console.log(`[embeddingService] Embedding saved for resume: ${resumeId}`)
  return { success: true }
}


export async function generateAndSaveEmbedding(resumeId, plainText) {
  try {
    const embedding = await generateEmbedding(plainText)
    await saveResumeEmbedding(resumeId, embedding)
    return { success: true, dimensions: embedding.length }
  } catch (err) {
    console.error(`[embeddingService] Error: ${err.message}`)
    throw err
  }
}



export async function matchResumesWithJD(jdText, matchCount = 10) {
  const jdEmbedding = await generateEmbedding(jdText)

  const { data, error } = await supabase.rpc("match_resumes", {
    query_embedding: jdEmbedding,
    match_count:     matchCount,
  })

  if (error) throw new Error(`Failed to match resumes: ${error.message}`)
  return data
}