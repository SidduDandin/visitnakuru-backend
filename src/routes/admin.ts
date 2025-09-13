import express from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { PrismaClient } from "@prisma/client"
import sgMail from "@sendgrid/mail"

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

// 🔑 forgot Password
sgMail.setApiKey(process.env.SENDGRID_API_KEY || "")

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body
  if (!email) return res.status(400).json({ error: "Email is required" })

  try {
    // Case-insensitive lookup
    const admin = await prisma.admin.findFirst({
      where: { email: { equals: email, mode: "insensitive" } }
    })

    if (admin) {
      // Generate reset token (valid 1h)
      const token = jwt.sign(
        { id: admin.id },
        process.env.JWT_SECRET || "supersecret",
        { expiresIn: "1h" }
      )
      console.log(token)
      const resetLink = `${process.env.FRONTEND_URL}/admin-login/reset-password/${token}`

      const msg = {
        to: email,
        from: process.env.EMAIL_FROM || "ramu@aalpha.net", // must be verified in SendGrid
        subject: "Password Reset Request",
        html: `
          <p>You requested a password reset.</p>
          <p>Click the link below to reset your password (valid for 1 hour):</p>
          <a href="${resetLink}">${resetLink}</a>
        `,
      }

      try {
        await sgMail.send(msg)
        console.log("Email sent to:", email)
      } catch (sendErr: unknown) {
  if (sendErr instanceof Error) {
    console.error("SendGrid error:", sendErr.message)

    // Type assertion for SendGrid error
    const sgError = sendErr as { response?: { body?: any } }
    if (sgError.response?.body) {
      console.error("SendGrid response body:", sgError.response.body)
    }
  } else {
    console.error("Unexpected error sending email:", sendErr)
  }

  return res.status(500).json({
    error: "Failed to send reset email. Check SendGrid configuration."
  })
}
    }

    // Always return success message to avoid leaking user info
    return res.json({
      message: "If this email exists, a reset link has been sent.",
    })
  } catch (err) {
    console.error("Forgot password error:", err)
    return res.status(500).json({ error: "Something went wrong" })
  }
})

router.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params
  const { password } = req.body

  if (!password) {
    return res.status(400).json({ error: "Password is required" })
  }

  try {
    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "supersecret"
    ) as any

    const adminId = decoded.id
    if (!adminId) {
      return res.status(400).json({ error: "Invalid token" })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Update Prisma
    await prisma.admin.update({
      where: { id: adminId },
      data: { password: hashedPassword },
    })

    return res.json({ message: "Password reset successful. You can now log in." })
  } catch (err) {
    console.error("Reset password error:", err)
    return res.status(400).json({ error: "Invalid or expired token" })
  }
})

export default router
