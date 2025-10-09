const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const {Createnewslettersubscriber,getallnewsletter,deleteManyNewsletters}=require('../controllers/newslettersubscriber');

router.post('/',Createnewslettersubscriber);
router.get('/', auth, getallnewsletter);
// router.delete('/:id',auth,deletenewsletter);
router.delete('/', auth, deleteManyNewsletters);
module.exports = router;