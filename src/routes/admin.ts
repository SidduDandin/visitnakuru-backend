import express from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { PrismaClient } from "@prisma/client"
import nodemailer from "nodemailer"

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

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body
  if (!email) return res.status(400).json({ error: "Email is required" })

  try {
    // Check if user exists
    const admin = await prisma.admin.findUnique({ where: { email } })

    // Security: don’t reveal if user exists
    if (admin) {
      // Generate reset token
      const token = jwt.sign(
        { id: admin.id },
        process.env.JWT_SECRET || "supersecret",
        { expiresIn: "1h" }
      )

      // Example reset link
      const resetLink = `${process.env.FRONTEND_URL}/admin-login/reset-password/${token}`

      // Send email (using Nodemailer here)
      const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      })

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Password Reset",
        html:  `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Password Reset</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f5f5f5; font-family:Arial, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f5f5f5; padding:20px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 6px rgba(0,0,0,0.1);">
            
            <!-- Header with logo -->
            <tr>
              <td style="padding:20px; text-align:center; background:#2A7B7B;">
                <img src="https://visitnakuru-ui.vercel.app/visitnakuru.jpg" alt="Logo" width="80" style="border-radius:50%; background:#fff; padding:5px;" />
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:30px 40px; text-align:left; color:#333;">
                <h2 style="margin:0 0 15px; font-size:22px; color:#2A7B7B;">Password Reset Request</h2>
                <p style="margin:0 0 20px; font-size:16px; line-height:1.5;">
                  Hello Admin,<br/><br/>
                  We received a request to reset your password. Click the button below to reset it. 
                  This link will expire in <strong>1 hour</strong>.
                </p>

                <!-- Button -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:25px auto;">
                  <tr>
                    <td bgcolor="#2A7B7B" style="border-radius:6px;">
                      <a href="${resetLink}" target="_blank" style="display:inline-block; padding:12px 25px; font-size:16px; color:#ffffff; text-decoration:none; border-radius:6px; background:#2A7B7B; font-weight:bold;">
                        Reset Password
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="margin:20px 0 0; font-size:14px; color:#666;">
                  If you didn’t request this, you can safely ignore this email.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:15px; text-align:center; font-size:12px; color:#999; background:#fafafa; border-top:1px solid #eee;">
                © ${new Date().getFullYear()} Visit Nakuru. All rights reserved.<br/>
                <a href="https://visitnakuru.com" style="color:#2A7B7B; text-decoration:none;">Visit our website</a>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `,
      })
    }

    return res.json({
      message: "If this email exists, a reset link has been sent.",
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: "Something went wrong" })
  }
})

// 🔑 reset Password
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
