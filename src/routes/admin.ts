import express from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { PrismaClient } from "@prisma/client"

const router = express.Router()
const prisma = new PrismaClient()

// 🔑 Admin Login
router.post("/login", async (req, res) => {
  const { username, password } = req.body

  try {
    const admin = await prisma.admin.findUnique({
      where: { username },
    })

    if (!admin) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    const valid = await bcrypt.compare(password, admin.password)
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      process.env.JWT_SECRET || "supersecret",
      { expiresIn: "1h" }
    )

    return res.json({ token })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: "Server error" })
  }
})

// 👤 Profile (requires token)
router.get("/profile", async (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: "No token provided" })

  const token = authHeader.split(" ")[1]
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "supersecret") as {
      id: number
      username: string
    }

    const admin = await prisma.admin.findUnique({ where: { id: decoded.id } })
    if (!admin) return res.status(404).json({ error: "Admin not found" })

    return res.json({
      id: admin.id,
      username: admin.username,
      email: admin.email,
      createdAt: admin.createdAt.toISOString(),
      updatedAt: admin.updatedAt.toISOString(),
    })
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" })
  }
})

// PUT /api/admin/profile
router.put("/profile", async (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: "No token provided" })

  const token = authHeader.split(" ")[1]
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "supersecret") as {
      id: number
    }

    const { username, email } = req.body

    const updated = await prisma.admin.update({
      where: { id: decoded.id },
      data: {
        username,
        email,
        updatedAt: new Date(),
      },
    })

    return res.json(updated)
  } catch (err) {
    console.error(err)
    return res.status(401).json({ error: "Invalid token" })
  }
})



// 🔑 Change Password
router.post("/change-password", async (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: "No token provided" })

  const token = authHeader.split(" ")[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "supersecret") as {
      id: number
      username: string
    }

    const { oldPassword, newPassword } = req.body

    const admin = await prisma.admin.findUnique({ where: { id: decoded.id } })
    if (!admin) return res.status(404).json({ error: "Admin not found" })

    const valid = await bcrypt.compare(oldPassword, admin.password)
    if (!valid) return res.status(401).json({ error: "Old password is incorrect" })

    const newHash = await bcrypt.hash(newPassword, 10)
    await prisma.admin.update({
      where: { id: decoded.id },
      data: { password: newHash },
    })

    return res.json({ message: "Password updated successfully" })
  } catch (err) {
    console.error(err)
    return res.status(401).json({ error: "Invalid or expired token" })
  }
})

export default router
