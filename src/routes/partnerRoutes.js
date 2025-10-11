const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');

const {
  uploadMiddleware,
  createPartner,
  getAllPartners,
  getPartnerById,
  updatePartnerStatus,
  deletePartner
} = require('../controllers/partnerController');

router.post('/',uploadMiddleware, createPartner);
router.get('/', auth, getAllPartners);
router.get('/list', getAllPartners);
router.get('/:id', auth, getPartnerById);
router.put('/:id/status', auth, updatePartnerStatus);
router.delete('/:id', auth, deletePartner);

module.exports = router;
