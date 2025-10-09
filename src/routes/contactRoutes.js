
const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const {createContact,getContacts,getContactById,deleteContact}=require('../controllers/contactController');

router.post('/',createContact);

router.get('/', auth, getContacts);

router.get('/:id',auth,getContactById);

router.delete('/:id',auth,deleteContact);

module.exports = router;