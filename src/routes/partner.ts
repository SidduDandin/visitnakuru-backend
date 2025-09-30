import { Router } from "express";
import multer from "multer";
import path from "path";
import { PrismaClient, DocType, DocStatus, AppStatus } from "@prisma/client";
import { error } from "console";

const router = Router();
const prisma = new PrismaClient();

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "documents") {
      cb(null, path.join(__dirname, "../uploads/documents"));
    } else if (file.fieldname === "media") {
      cb(null, path.join(__dirname, "../uploads/media"));
    } else {
      cb(null, path.join(__dirname, "../uploads"));
    }
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    cb(null, `${timestamp}_${file.originalname}`);
  },
});
const upload = multer({ storage });

// ---- Partner Registration ----
router.post(
  "/",
  upload.fields([
    { name: "documents", maxCount: 10 },
    { name: "media", maxCount: 10 },
  ]),
  async (req, res) => {
    try {
      const data = req.body;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      const documentsFiles = files?.documents || [];
      const mediaFiles = files?.media || [];

      // Parse documents_meta JSON
      let documentsMeta: { key: keyof typeof DocType; uploadedName: string }[] = [];
      if (data.documents_meta) {
        try {
          documentsMeta = JSON.parse(data.documents_meta);
        } catch {
          return res.status(400).json({ error: "Invalid documents_meta format" });
        }
      }

      // ✅ Create partner with documents + media
      const partner = await prisma.partner.create({
        data: {
          businessName: data.businessName,
          contactPerson: data.contactPerson,
          email: data.email,
          phone: data.phone,
          category: data.category,
          website: data.website || null,
          socialLinks: data.socialLinks ? JSON.parse(data.socialLinks) : null,

          documents: {
            create: documentsFiles.map((f) => {
              // Match meta entry by uploadedName (the prefixed filename client-side)
              const meta = documentsMeta.find(
                (m) => m.uploadedName === f.originalname || m.uploadedName === f.filename
              );

              if (!meta) {
                throw new Error(`Missing metadata for file: ${f.originalname}`);
              }
              if (!Object.values(DocType).includes(meta.key)) {
                throw new Error(`Unknown document type: ${meta.key}`);
              }

              return {
                type: meta.key,
                status: DocStatus.UPLOADED,
                url: `/uploads/documents/${f.filename}`,
              };
            }),
          },

          media: {
            create: mediaFiles.map((f) => ({
              type: f.mimetype.startsWith("image/") ? "PHOTO" : "VIDEO",
              url: `/uploads/media/${f.filename}`,
            })),
          },
        },
        include: { documents: true, media: true },
      });

      // ✅ Create linked application
      await prisma.application.create({
        data: {
          partnerId: partner.id,
          status: AppStatus.PENDING,
        },
      });

      res.status(201).json({
        message: "Partner registered successfully",
        partner,
      });
    } catch (err: any) {
  console.error("❌ Error saving partner:", err);
  res.status(500).json({ error: err.message || "Internal Server Error" });
}
  }
);


/**
 * Admin Endpoints
 */
// List all partners + applications
router.get("/", async (req, res) => {
  try {
    const partners = await prisma.partner.findMany({
      include: { applications: { orderBy: { createdAt: "desc" }, take: 1 }, documents: true, media: true },
    });

    // Map status from latest application
    const mapped = partners.map(p => {
      const latestApp = p.applications[0];
      return {
        id: p.id,
        businessName: p.businessName,
        contactPerson: p.contactPerson,
        email: p.email,
        phone: p.phone,
        category: p.category,
        submittedAt: latestApp?.createdAt ?? p.createdAt,
        status: latestApp?.status === "PENDING" ? "Pending"
              : latestApp?.status === "APPROVED" ? "Approved"
              : latestApp?.status === "REJECTED" ? "Rejected"
              : "Pending",
        documents: p.documents.map(d => d.url),
        media: p.media.map(m => m.url),
      };
    });

    res.json(mapped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch partners" });
  }
});

// Get single partner with latest application
router.get("/:id", async (req, res) => {
  try {
    const partner = await prisma.partner.findUnique({
      where: { id: req.params.id },
      include: {
        documents: true,
        media: true,
        applications: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
    if (!partner) return res.status(404).json({ error: "Partner not found" });

    const latestApp = partner.applications[0];

    res.json({
      id: partner.id,
      businessName: partner.businessName,
      contactPerson: partner.contactPerson,
      email: partner.email,
      phone: partner.phone,
      category: partner.category,
      status: latestApp ? latestApp.status : "Pending",
      submittedAt: latestApp ? latestApp.createdAt : partner.createdAt,
      documents: partner.documents.map((d) => d.url),
      media: partner.media.map((m) => m.url),
    });
  } catch (err) {
    console.error("Error fetching partner:", err);
    res.status(500).json({ error: "Failed to fetch partner" });
  }
});

// Approve partner application
router.put("/:id/approve", async (req, res) => {
  try {
    const application = await prisma.application.findFirst({
      where: { partnerId: req.params.id },
      orderBy: { createdAt: "desc" },
    });
    if (!application) return res.status(404).json({ error: "Application not found" });

    const updated = await prisma.application.update({
      where: { id: application.id },
      data: { status: AppStatus.APPROVED, reviewedAt: new Date(), reviewedBy: req.body.reviewedBy || null },
    });

    res.json({ message: "Partner approved", application: updated });
  } catch (err) {
    console.error("Error approving partner:", err);
    res.status(500).json({ error: "Failed to approve partner" });
  }
});

// Reject partner application
router.put("/:id/reject", async (req, res) => {
  try {
    const { reason, reviewedBy } = req.body;
    const application = await prisma.application.findFirst({
      where: { partnerId: req.params.id },
      orderBy: { createdAt: "desc" },
    });
    if (!application) return res.status(404).json({ error: "Application not found" });

    const updated = await prisma.application.update({
      where: { id: application.id },
      data: { status: AppStatus.REJECTED, notes: reason || "Not specified", reviewedAt: new Date(), reviewedBy: reviewedBy || null },
    });

    res.json({ message: "Partner rejected", application: updated });
  } catch (err) {
    console.error("Error rejecting partner:", err);
    res.status(500).json({ error: "Failed to reject partner" });
  }
});

// Delete partner
router.delete("/:id", async (req, res) => {
  try {
    await prisma.partner.delete({ where: { id: req.params.id } });
    res.json({ message: "Partner deleted successfully" });
  } catch (err) {
    console.error("Error deleting partner:", err);
    res.status(500).json({ error: "Failed to delete partner" });
  }
});

export default router;

