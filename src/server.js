// src/server.js

require('dotenv').config(); // Loads environment variables from .env
const path = require('path');
const express = require('express');
const cors = require('cors');


const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Dynamic CORS: allows both local dev & production frontend
const allowedOrigins = [
    //'http://localhost:3000',             // Local Next.js frontend
     'https://visitnakuru-ui.vercel.app'                                   // Production frontend (change to your real domain)
];

app.use(cors({
    origin: function (origin, callback) {
        ////-------- Allow requests with no origin (like Postman)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }

        ////----------- ❌ Block requests with no origin (Postman, curl, etc.)
        // if (!origin) {
        //     return callback(new Error('Requests without origin are not allowed'), false);
        // }

        // if (allowedOrigins.includes(origin)) {
        //     callback(null, true);
        // } else {
        //     callback(new Error('Not allowed by CORS'), false);
        // }
    },
    credentials: true
}));

// Middleware to parse JSON request bodies
app.use(express.json());

app.use(express.static(path.join(__dirname, '..', 'public')));
// Import authentication routes
const authRoutes = require('./routes/authRoutes');

const contactRoutes = require('./routes/contactRoutes');

const cmsRoutes = require('./routes/cmsRoutes');

const newslettersubscriber = require('./routes/newsletterRoutes');

const bannerRoutes =require('./routes/bannerRoutes');

const partnerRoutes =require('./routes/partnerRoutes');

// Mount authentication routes
// All routes defined in authRoutes.js will be prefixed with '/api/auth'
app.use('/api/auth', authRoutes);

app.use('/api/contacts', contactRoutes);

app.use('/api/cms',cmsRoutes);

app.use('/api/newslettersubscriber',newslettersubscriber);

app.use('/api/admin/banners',bannerRoutes);

app.use('/api/partners', partnerRoutes);
// Basic route to confirm the server is running
app.get('/', (req, res) => {
    res.send('Admin Backend API is running!');
});

// Start the Express server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
