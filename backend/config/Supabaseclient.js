import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"
dotenv.config()

const supabaseUrl  = process.env.SUPABASE_URL?.trim()
const supabaseKey  = process.env.SUPABASE_SERVICE_KEY?.trim()

if (!supabaseUrl || !supabaseKey) {
  throw new Error("SUPABASE_URL or SUPABASE_SERVICE_KEY missing from .env file!")
}

const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase