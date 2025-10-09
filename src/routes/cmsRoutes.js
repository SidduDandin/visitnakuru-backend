const express = require('express');

const router = express.Router(); 

const auth = require('../middleware/authMiddleware');

const {updateCms , getCms,getCmsByPageName} =require('../controllers/cmscontroller');

router.put('/',auth,updateCms);

router.get('/',auth,getCms);

router.get('/:pageName', getCmsByPageName);

module.exports = router;