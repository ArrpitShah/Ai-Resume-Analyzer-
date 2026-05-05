import supabase from "../config/Supabaseclient.js"
import { v4 as uuidv4 } from "uuid"



export function generateRequestId() {
  return `req_${uuidv4().slice(0, 8)}`
}


async function safeInsert(table, data) {
  try {
    const { error } = await supabase.from(table).insert(data)
    if (error) console.error(`[Logger] ${table} insert failed:`, error.message)
  } catch (err) {
    
    console.error(`[Logger] ${table} unexpected error:`, err.message)
  }
}



export async function logRequest({ request_id, user_id, file_type, file_size_kb, status }) {
  await safeInsert("request_logs", {
    request_id,
    user_id:     user_id ?? null,
    file_type:   file_type ?? null,
    file_size_kb: file_size_kb ?? null,
    status:      status ?? "processing",
  })
}


export async function logParser({ request_id, user_id, event, file_type, duration_ms, error_message }) {
  await safeInsert("parser_logs", {
    request_id,
    user_id:       user_id ?? null,
    event:         event ?? null,
    file_type:     file_type ?? null,
    duration_ms:   duration_ms ?? null,
    error_message: error_message ?? null,
  })
}



export async function logAI({
  user_id,
  analysis_id,
  model_name,
  provider,
  prompt_tokens,
  completion_tokens,
  total_tokens,
  cost,
  latency_ms,
  status,
  retry_count,
  request_payload,
  response_metadata,
  error_metadata,
}) {
  await safeInsert("ai_logs", {
    user_id:           user_id          ?? null,
    analysis_id:       analysis_id      ?? null,
    model_name:        model_name       ?? "claude-sonnet-4-20250514",
    provider:          provider         ?? "anthropic",
    prompt_tokens:     prompt_tokens    ?? null,
    completion_tokens: completion_tokens ?? null,
    total_tokens:      total_tokens     ?? null,
    cost:              cost             ?? null,
    latency_ms:        latency_ms       ?? null,
    status:            status           ?? "success",
    retry_count:       retry_count      ?? 0,
    request_payload:   request_payload  ?? null,
    response_metadata: response_metadata ?? null,
    error_metadata:    error_metadata   ?? null,
  })
}



export async function logError({ request_id, user_id, error_type, error_message, stack_trace }) {
  await safeInsert("error_logs", {
    request_id:    request_id   ?? null,
    user_id:       user_id      ?? null,
    error_type:    error_type   ?? "UNKNOWN_ERROR",
    error_message: error_message ?? null,
    stack_trace:   stack_trace  ?? null,
  })
}



export async function logPerformance({ request_id, user_id, total_ms, parse_ms, ai_ms }) {
  await safeInsert("performance_logs", {
    request_id: request_id,
    user_id:    user_id ?? null,
    total_ms:   total_ms ?? null,
    parse_ms:   parse_ms ?? null,
    ai_ms:      ai_ms   ?? null,
  })
}