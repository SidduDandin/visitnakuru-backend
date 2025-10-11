const { PrismaClient } = require('../../generated/prisma');
const prisma = new PrismaClient();
const multer = require('multer');
const path = require('path');
const fs = require('fs/promises');

// 📁 Storage configuration
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    let folderName = 'others';
    if (file.fieldname === 'documents') folderName = 'documents';
    else if (file.fieldname === 'photos') folderName = 'photos';
    else if (file.fieldname === 'videos') folderName = 'videos';

    const uploadPath = path.join(__dirname, '..', '..', 'public', 'uploads', 'partners', folderName);
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (err) {
      console.error('Error creating upload directory:', err);
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const uploadMiddleware = upload.fields([
  { name: 'documents', maxCount: 10 },
  { name: 'photos', maxCount: 10 },
  { name: 'videos', maxCount: 2 },
]);

// 🧹 Delete uploaded file safely
const deleteFile = async (filePath) => {
  try {
    if (filePath) {
      const fullPath = path.join(__dirname, '..', '..', 'public', filePath);
      await fs.access(fullPath);
      await fs.unlink(fullPath);
    }
  } catch (err) {
    if (err.code !== 'ENOENT') console.error('Error deleting file:', err.message);
  }
};

// 🟢 Create Partner
const createPartner = async (req, res) => {
  try {
    const {
      BusinessName,
      ContactPerson,
      Email,
      Phone,
      Category,
      Subcategory,
      PhysicalAddress,
      MapLink,
      ShortDescription,
      OperatingHours,
      FullDescription,
    } = req.body;

    const newPartner = await prisma.tbl_partner.create({
      data: {
        BusinessName,
        ContactPerson,
        Email,
        Phone,
        Category,
        Subcategory,
        PhysicalAddress,
        MapLink,
        ShortDescription,
        OperatingHours,
        FullDescription,
        Status: "Pending",
      },
    });

    // 📎 Save uploaded files
    if (req.files?.documents?.length) {
      await prisma.tbl_partner_documents.createMany({
        data: req.files.documents.map((f) => ({
          PartnerID: newPartner.PartnerID,
          FilePath: path.join("uploads", "partners", "documents", f.filename),
          FileName: f.originalname,
        })),
      });
    }

    if (req.files?.photos?.length) {
      await prisma.tbl_partner_photos.createMany({
        data: req.files.photos.map((f) => ({
          PartnerID: newPartner.PartnerID,
          FilePath: path.join("uploads", "partners", "photos", f.filename),
          FileName: f.originalname,
        })),
      });
    }

    if (req.files?.videos?.length) {
      await prisma.tbl_partner_videos.createMany({
        data: req.files.videos.map((f) => ({
          PartnerID: newPartner.PartnerID,
          FilePath: path.join("uploads", "partners", "videos", f.filename),
          FileName: f.originalname,
        })),
      });
    }

    res.status(201).json({ msg: "Partner onboarding submitted successfully", partner: newPartner });
  } catch (err) {
    console.error("Create partner error:", err.message);
    res.status(500).json({ msg: "Server error during partner creation" });
  }
};

// 🟡 Get all partners
const getAllPartners = async (req, res) => {
  try {
    const partners = await prisma.tbl_partner.findMany({
      include: {
        Documents: true,
        Photos: true,
        Videos: true,
      },
      orderBy: { CreatedAt: 'desc' },
    });
    res.json(partners);
  } catch (err) {
    console.error('Get partners error:', err.message);
    res.status(500).json({ msg: 'Server error fetching partners' });
  }
};

// 🔵 Get partner by ID
const getPartnerById = async (req, res) => {
  const { id } = req.params;
  try {
    const partner = await prisma.tbl_partner.findUnique({
      where: { PartnerID: Number(id) },
      include: { Documents: true, Photos: true, Videos: true },
    });
    if (!partner) return res.status(404).json({ msg: 'Partner not found' });
    res.json(partner);
  } catch (err) {
    console.error('Get partner by ID error:', err.message);
    res.status(500).json({ msg: 'Server error getting partner' });
  }
};

// 🟣 Update partner status
const updatePartnerStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const updated = await prisma.tbl_partner.update({
      where: { PartnerID: Number(id) },
      data: { Status: status },
    });
    res.json({ msg: 'Partner status updated successfully', partner: updated });
  } catch (err) {
    console.error('Update status error:', err.message);
    res.status(500).json({ msg: 'Server error updating partner status' });
  }
};

// 🔴 Delete partner
const deletePartner = async (req, res) => {
  const { id } = req.params;
  try {
    const partner = await prisma.tbl_partner.findUnique({
      where: { PartnerID: Number(id) },
      include: { Documents: true, Photos: true, Videos: true },
    });

    if (!partner) return res.status(404).json({ msg: 'Partner not found' });

    await prisma.tbl_partner.delete({ where: { PartnerID: Number(id) } });

    // Delete all related files
    for (const doc of partner.Documents) await deleteFile(doc.FilePath);
    for (const photo of partner.Photos) await deleteFile(photo.FilePath);
    for (const vid of partner.Videos) await deleteFile(vid.FilePath);

    res.json({ msg: 'Partner deleted successfully' });
  } catch (err) {
    console.error('Delete partner error:', err.message);
    res.status(500).json({ msg: 'Server error deleting partner' });
  }
};

module.exports = {
  uploadMiddleware,
  createPartner,
  getAllPartners,
  getPartnerById,
  updatePartnerStatus,
  deletePartner
};
