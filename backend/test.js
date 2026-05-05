import dotenv from "dotenv"
dotenv.config()
import { parseResumeFromPath } from "./Services/parserServices.js"
import { convertToJson } from "./Services/jsonExtractor.js"
async function test() {
  console.log("🚀 Starting parser test...\n")

  // STEP 1: File → Raw Text + Basic Parsing
  const parsed = await parseResumeFromPath("./Nidhi_IIITA.pdf")
  
  console.log("📄 RAW TEXT (first 200 chars):")
  console.log(parsed.raw_text.slice(0, 200))
  console.log("\n-------------------\n")

  console.log("👤 BASIC INFO:")
  console.log(parsed.basic_info)
  console.log("\n-------------------\n")

  console.log("🛠️  SKILLS:")
  console.log(parsed.skills)
  console.log("\n-------------------\n")

  console.log("🎓 EDUCATION:")
  console.log(parsed.education)
  console.log("\n-------------------\n")

  console.log("💼 EXPERIENCE:")
  console.log(parsed.experience)
  console.log("\n-------------------\n")

  // STEP 2: AI se deep extraction
  console.log("🤖 Running AI extraction via convertToJson...")
  const json = await convertToJson(parsed.raw_text)

  console.log("\n✅ FINAL JSON OUTPUT:")
  console.log(JSON.stringify(json, null, 2))  // 2 = indentation for readability

  console.log("\n📊 META:")
  console.log(json._meta)
}

test().catch(err => {
  console.error("❌ Test failed:", err.message)
  process.exit(1)
})