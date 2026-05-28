import express from "express"
import multer from "multer"
import path from "path"
import {
  uploadResume,
  fetchResumeById,
  fetchResumesByUser,
  removeResume,
  fetchResumeVersions,
} from "../Controllers/resumeController.js"
import {
  resumeUploadLimiter,
  validateUUID,
  validateTextInput,
} from "../Middleware/securityMiddleware.js"
import { protect } from "../Middleware/authMiddleware.js"

const router = express.Router()

const ALLOWED_MIMES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]

const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx", ".txt"]

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (ALLOWED_MIMES.includes(file.mimetype) && ALLOWED_EXTENSIONS.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error("Only PDF, DOC, DOCX, TXT files allowed!"))
    }
  },
})


router.post("/upload", protect, resumeUploadLimiter, upload.single("resume"), validateTextInput(100000), uploadResume)
router.get("/my-resumes", protect, (req, res) => {
  // Redirect internal call to the standard handler
  req.params.userId = req.user.id
  fetchResumesByUser(req, res)
})
router.get("/user/:userId", protect, validateUUID, fetchResumesByUser)
router.get("/:id", protect, validateUUID, fetchResumeById)
router.get("/:id/versions", protect, validateUUID, fetchResumeVersions)
router.delete("/:id", protect, validateUUID, removeResume)

export default router