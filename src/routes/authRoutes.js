
const express = require('express');
const router = express.Router(); // Create an Express router instance

// Import the controller function for login from authController.js
const { loginUser ,forgotPassword ,resetPassword ,getProfile ,updateProfile,changePassword} = require('../controllers/authController');

// Import the authentication middleware
const auth = require('../middleware/authMiddleware');


// Define a POST route for logging in an admin user
// This route will be accessible at /api/auth/login
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.put('/change-password', auth, changePassword);

// Export the router so it can be used in your main server.js file
module.exports = router;