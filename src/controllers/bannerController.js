// const { PrismaClient } = require('../../generated/prisma');
// const prisma = new PrismaClient();
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs/promises');


// const storage = multer.diskStorage({
//   destination: async (req, file, cb) => {
//     const uploadPath = path.join(__dirname, '..', '..', 'public', 'images', 'banners');
//     try {
//       await fs.mkdir(uploadPath, { recursive: true });
//       cb(null, uploadPath);
//     } catch (err) {
//       console.error('Error creating upload directory:', err);
//       cb(err);
//     }
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
//     const fileExtension = path.extname(file.originalname);
//     cb(null, `banner-${uniqueSuffix}${fileExtension}`);
//   }
// });

// const upload = multer({
//   storage,
//   limits: { fileSize: 5 * 1024 * 1024 },
//   fileFilter: (req, file, cb) => {
//     const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
//     if (!allowedTypes.includes(file.mimetype)) {
//       return cb(new Error('Invalid file type. Only JPG, PNG, and WEBP allowed.'));
//     }
//     cb(null, true);
//   }
// });

// const uploadMiddleware = upload.single('BannerImage');


// const deleteImage = async (filename) => {
//   try {
//     if (filename) {
//       const fullPath = path.join(__dirname, '..', '..', 'public', 'images', 'banners', filename);
//       await fs.unlink(fullPath);
//     }
//   } catch (err) {
//     console.error('Error deleting image file:', err.message);
//   }
// };


// const createBanner = async (req, res) => {
//   uploadMiddleware(req, res, async (err) => {
//     if (err) return res.status(400).json({ msg: err.message });

//     const BannerImage = req.file ? req.file.filename : null;
//     const { BannerTitle_en, BannerTitle_es, BannerTitle_fr, BannerTitle_de, BannerTitle_zh } = req.body;
//     try {
//       if (!BannerImage) {
//         if (req.file) await fs.unlink(req.file.path);
//         return res.status(400).json({ msg: 'Banner image is required.' });
//       }

//       const bannerData = {
//         BannerImage,
//         BannerTitle_en: BannerTitle_en || null,
//         BannerTitle_es: BannerTitle_es || null,
//         BannerTitle_fr: BannerTitle_fr || null,
//         BannerTitle_de: BannerTitle_de || null,
//         BannerTitle_zh: BannerTitle_zh || null,
//       };

//       const newBanner = await prisma.tbl_banner.create({
//         data: { BannerImage, BannerTitle }
//       });

//       res.status(201).json({ msg: 'Banner created successfully.', banner: newBanner });
//     } catch (err) {
//       if (req.file) await fs.unlink(req.file.path);
//       console.error('Create banner error:', err.message);
//       res.status(500).json({ msg: 'Server Error during banner creation' });
//     }
//   });
// };


// const getAllBanners = async (req, res) => {
//   try {
//     const banners = await prisma.tbl_banner.findMany({
//        orderBy: { createdAt: 'asc' },
//     });
//     res.json(banners);
//   } catch (err) {
//     console.error('Get banners error:', err.message);
//     res.status(500).json({ msg: 'Server Error during get all banners.' });
//   }
// };


// const getBannerById = async (req, res) => {
//   const { id } = req.params;
//   try {
//     const banner = await prisma.tbl_banner.findUnique({ where: { BannerID: id } });
//     if (!banner) return res.status(404).json({ msg: 'Banner not found.' });
//     res.json(banner);
//   } catch (err) {
//     console.error('Get banner by ID error:', err.message);
//     res.status(500).json({ msg: 'Server Error during get banner.' });
//   }
// };


// const updateBanner = async (req, res) => {
//   uploadMiddleware(req, res, async (err) => {
//     if (err) return res.status(400).json({ msg: err.message });

//     const { id } = req.params;
//     const newImageName = req.file ? req.file.filename : null;
//     const { BannerTitle_en, BannerTitle_es, BannerTitle_fr, BannerTitle_de, BannerTitle_zh } = req.body;

//     try {
//       const existingBanner = await prisma.tbl_banner.findUnique({
//         where: { BannerID: id },
//         select: { BannerImage: true },
//       });

//       if (!existingBanner) {
//         if (req.file) await fs.unlink(req.file.path);
//         return res.status(404).json({ msg: 'Banner not found for updating.' });
//       }

//       const imageToStore = newImageName || existingBanner.BannerImage;


//       const updateData = {
//           BannerImage: imageToStore,
//       };
     
//       if (BannerTitle_en !== undefined) updateData.BannerTitle_en = BannerTitle_en;
//       if (BannerTitle_es !== undefined) updateData.BannerTitle_es = BannerTitle_es;
//       if (BannerTitle_fr !== undefined) updateData.BannerTitle_fr = BannerTitle_fr;
//       if (BannerTitle_de !== undefined) updateData.BannerTitle_de = BannerTitle_de;
//       if (BannerTitle_zh !== undefined) updateData.BannerTitle_zh = BannerTitle_zh;



//       const updatedBanner = await prisma.tbl_banner.update({
//         where: { BannerID: id },
//         data: { updateData },
//       });

//       if (newImageName && existingBanner.BannerImage) {
//         await deleteImage(existingBanner.BannerImage);
//       }

//       res.json({ msg: 'Banner updated successfully', banner: updatedBanner });
//     } catch (err) {
//       if (req.file) await fs.unlink(req.file.path);
//       if (err.code === 'P2025') return res.status(404).json({ msg: 'Banner not found for updating.' });
//       console.error('Update banner error:', err.message);
//       res.status(500).send('Server Error during banner update');
//     }
//   });
// };


// const deleteBannerById = async (req, res) => {
//   const { id } = req.params;
//   try {
//     const bannerToDelete = await prisma.tbl_banner.findUnique({
//       where: { BannerID: id },
//       select: { BannerImage: true },
//     });

//     if (!bannerToDelete) return res.status(404).json({ msg: 'Banner not found for deletion.' });

//     await prisma.tbl_banner.delete({ where: { BannerID: id } });
//     await deleteImage(bannerToDelete.BannerImage);

//     res.json({ msg: 'Banner deleted successfully.' });
//   } catch (err) {
//     if (err.code === 'P2025') return res.status(404).json({ msg: 'Banner not found for deletion.' });
//     console.error('Delete banner error:', err.message);
//     res.status(500).json({ msg: 'Server Error during delete banner.' });
//   }
// };

// module.exports = { createBanner, getAllBanners, getBannerById, updateBanner, deleteBannerById };
const { PrismaClient } = require('../../generated/prisma');
const prisma = new PrismaClient();
const multer = require('multer');
const path = require('path');
const fs = require('fs/promises');


const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', '..', 'public', 'images', 'banners');
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
    const fileExtension = path.extname(file.originalname);
    cb(null, `banner-${uniqueSuffix}${fileExtension}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Invalid file type. Only JPG, PNG, and WEBP allowed.'));
    }
    cb(null, true);
  }
});

const uploadMiddleware = upload.single('BannerImage');


const deleteImage = async (filename) => {
  try {
    if (filename) {
      const fullPath = path.join(__dirname, '..', '..', 'public', 'images', 'banners', filename);
      // Check if file exists before trying to delete
      await fs.access(fullPath);
      await fs.unlink(fullPath);
    }
  } catch (err) {
    // Ignore error if file doesn't exist
    if (err.code !== 'ENOENT') {
      console.error('Error deleting image file:', err.message);
    }
  }
};


const createBanner = async (req, res) => {
  uploadMiddleware(req, res, async (err) => {
    if (err) return res.status(400).json({ msg: err.message });

    const BannerImage = req.file ? req.file.filename : null;
    const { BannerTitle_en, BannerTitle_es, BannerTitle_fr, BannerTitle_de, BannerTitle_zh } = req.body;
    
    try {
      if (!BannerImage) {
        // If an image file is required but missing
        return res.status(400).json({ msg: 'Banner image is required.' });
      }

      // Correctly construct the data object for Prisma
      const bannerData = {
        BannerImage: BannerImage,
        // Use logical OR with null to ensure empty strings from form become null in DB
        BannerTitle_en: BannerTitle_en || null,
        BannerTitle_es: BannerTitle_es || null,
        BannerTitle_fr: BannerTitle_fr || null,
        BannerTitle_de: BannerTitle_de || null,
        BannerTitle_zh: BannerTitle_zh || null,
      };

      const newBanner = await prisma.tbl_banner.create({
        data: bannerData // Use the correctly constructed bannerData object
      });

      res.status(201).json({ msg: 'Banner created successfully.', banner: newBanner });
    } catch (err) {
      // Ensure the uploaded file is deleted if the Prisma creation fails
      if (req.file) await fs.unlink(req.file.path);
      console.error('Create banner error:', err.message);
      res.status(500).json({ msg: 'Server Error during banner creation' });
    }
  });
};


const getAllBanners = async (req, res) => {
  try {
    const banners = await prisma.tbl_banner.findMany({
       orderBy: { createdAt: 'asc' },
    });
    res.json(banners);
  } catch (err) {
    console.error('Get banners error:', err.message);
    res.status(500).json({ msg: 'Server Error during get all banners.' });
  }
};


const getBannerById = async (req, res) => {
  const { id } = req.params;
  try {
    const banner = await prisma.tbl_banner.findUnique({ where: { BannerID: id } });
    if (!banner) return res.status(404).json({ msg: 'Banner not found.' });
    res.json(banner);
  } catch (err) {
    console.error('Get banner by ID error:', err.message);
    res.status(500).json({ msg: 'Server Error during get banner.' });
  }
};


const updateBanner = async (req, res) => {
  uploadMiddleware(req, res, async (err) => {
    if (err) return res.status(400).json({ msg: err.message });

    const { id } = req.params;
    const newImageName = req.file ? req.file.filename : null;
    const { BannerTitle_en, BannerTitle_es, BannerTitle_fr, BannerTitle_de, BannerTitle_zh } = req.body;

    try {
      const existingBanner = await prisma.tbl_banner.findUnique({
        where: { BannerID: id },
        select: { BannerImage: true }, // Only need the image name to check/delete
      });

      if (!existingBanner) {
        if (req.file) await fs.unlink(req.file.path);
        return res.status(404).json({ msg: 'Banner not found for updating.' });
      }

      // Use the new image name if uploaded, otherwise keep the existing one
      const imageToStore = newImageName || existingBanner.BannerImage;

      // Correctly construct the update data object
      const updateData = {
          BannerImage: imageToStore,
          // Use logical OR with null to ensure empty strings from form become null in DB
          // Since the frontend sends all title fields, we update them all.
          BannerTitle_en: BannerTitle_en || null,
          BannerTitle_es: BannerTitle_es || null,
          BannerTitle_fr: BannerTitle_fr || null,
          BannerTitle_de: BannerTitle_de || null,
          BannerTitle_zh: BannerTitle_zh || null,
      };
     
      const updatedBanner = await prisma.tbl_banner.update({
        where: { BannerID: id },
        data: updateData, // Corrected Prisma syntax
      });

      // Delete old image only if a new image was uploaded successfully
      if (newImageName && existingBanner.BannerImage) {
        await deleteImage(existingBanner.BannerImage);
      }

      res.json({ msg: 'Banner updated successfully', banner: updatedBanner });
    } catch (err) {
      // Ensure the new file is deleted if the Prisma update fails
      if (req.file) await fs.unlink(req.file.path);
      if (err.code === 'P2025') return res.status(404).json({ msg: 'Banner not found for updating.' });
      console.error('Update banner error:', err.message);
      res.status(500).send('Server Error during banner update');
    }
  });
};


const deleteBannerById = async (req, res) => {
  const { id } = req.params;
  try {
    const bannerToDelete = await prisma.tbl_banner.findUnique({
      where: { BannerID: id },
      select: { BannerImage: true },
    });

    if (!bannerToDelete) return res.status(404).json({ msg: 'Banner not found for deletion.' });

    await prisma.tbl_banner.delete({ where: { BannerID: id } });
    await deleteImage(bannerToDelete.BannerImage);

    res.json({ msg: 'Banner deleted successfully.' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ msg: 'Banner not found for deletion.' });
    console.error('Delete banner error:', err.message);
    res.status(500).json({ msg: 'Server Error during delete banner.' });
  }
};

module.exports = { createBanner, getAllBanners, getBannerById, updateBanner, deleteBannerById };