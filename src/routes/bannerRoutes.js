const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const {
  createBanner,
  getAllBanners,
  getBannerById,
  updateBanner,
  deleteBannerById
} = require('../controllers/bannerController');

router.post('/', auth, createBanner);
router.get('/', auth, getAllBanners);
router.get('/listbanner', getAllBanners);
router.get('/:id', auth, getBannerById);
router.put('/:id', auth, updateBanner);
router.delete('/:id', auth, deleteBannerById);

module.exports = router;