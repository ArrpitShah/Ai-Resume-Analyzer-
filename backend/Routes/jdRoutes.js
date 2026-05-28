import express from "express"
import {
  uploadJD,
  fetchJDById,
  fetchJDsByUser,
  removeJD,
} from "../Controllers/jdController.js"
import {
  jdUploadLimiter,
  validateUUID,
  validateTextInput,
} from "../Middleware/securityMiddleware.js"
import { protect } from "../Middleware/authMiddleware.js"

const router = express.Router()

router.post("/upload", protect, jdUploadLimiter, validateTextInput(50000), uploadJD)
router.get("/my-jds", protect, (req, res) => {
  req.params.userId = req.user.id
  fetchJDsByUser(req, res)
})
router.get("/user/:userId", protect, validateUUID, fetchJDsByUser)
router.get("/:id", protect, validateUUID, fetchJDById)
router.delete("/:id", protect, validateUUID, removeJD)

export default router