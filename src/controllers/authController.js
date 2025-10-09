// src/controllers/authController.js
// src/controllers/authController.js
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('../../generated/prisma'); // Adjust path based on your 'src' location
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs'); // Used for hashing passwords
const jwt = require('jsonwebtoken'); // Used for creating and verifying JWTs

//start forgot password
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Function to load email templates with replacements
function loadTemplate(templateName, replacements = {}) {
    const headerPath = path.join(__dirname, '../emailTemplates/partials/header.html');
    const footerPath = path.join(__dirname, '../emailTemplates/partials/footer.html');
    const bodyPath = path.join(__dirname, `../emailTemplates/${templateName}.html`);

    const header = fs.readFileSync(headerPath, 'utf8');
    const footer = fs.readFileSync(footerPath, 'utf8');
    let body = fs.readFileSync(bodyPath, 'utf8');

    // Combine header, body, and footer first
    let fullHtml = header + body + footer;

    // Replace placeholders throughout the entire HTML string
    for (const key in replacements) {
        fullHtml = fullHtml.replace(new RegExp(`{{${key}}}`, 'g'), replacements[key]);
    }

    return fullHtml;
}

//end

// Controller function to handle admin user login
const loginUser = async (req, res) => {
  // Extract email and password from the request body
  const { email, password } = req.body;

  try {
    // 1. Check if an admin with the provided email exists
    let admin = await prisma.tbl_admin.findUnique({ where: { email } });
    if (!admin) {
      return res.status(400).json({ msg: 'Invalid Credentials (Email)' }); // Use generic messages for security
    }

    // ⭐ NEW: Check if the admin's status is 1 (active)
    if (admin.status !== 1) {
      // You can customize the message based on the status if needed
      return res.status(403).json({ msg: 'Your account is not active. Please contact support.' });
    }

    // 2. Compare the provided password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials (Password)' }); // Use generic messages for security
    }

    // 3. Generate a JWT token for the authenticated admin
    const payload = {
      admin: {
        id: admin.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token }); // Send the token back
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error during login');
  }
};


// Function to send a password reset email using Gmail
async function sendGmailPasswordResetEmail(email, resetLink) {
    
    const user = process.env.GMAIL_SMTP_USER;
    const pass = process.env.GMAIL_SMTP_PASS;

    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587, 
            secure: false, 
            requireTLS: true,
            auth: {
                user: user,
                pass: pass,
            },
        });

       const currentYear = new Date().getFullYear();
        const htmlContent = loadTemplate('passwordReset', { 
            resetLink: resetLink,
            subject: 'Password Reset Request', 
            // headerText: 'Invest In Nakuru' ,
            frontend_url: process.env.frontend_url,
             currentYear: currentYear
        });

        const mailOptions = {
          from: user,
          to: email,
          subject: 'Password Reset Request', 
          html: htmlContent,
        };

       
        await transporter.sendMail(mailOptions);
        console.log(`Password reset email sent to ${email}`);
    } catch (error) {
        console.error(`Error sending password reset email to ${email}:`, error);
        throw new Error('Failed to send password reset email.');
    }
}

//#region admin forgot password controller logic 
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const admin = await prisma.tbl_admin.findUnique({ where: { email } });
    if (!admin) {
      return res.status(404).json({ message: 'admin with that email does not exist.' });
    }

    // Generate a unique token and set its expiration
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = Date.now() + 3600000; // 1 hour expiration.

    await prisma.tbl_admin.update({
      where: { id: admin.id },
      data: { resetToken, resetTokenExpires: new Date(resetTokenExpires) },
    });

    const resetLink = `${process.env.frontend_url}/admin/reset-password?token=${resetToken}`;

    // Call the updated email sending function here.
    await sendGmailPasswordResetEmail(email, resetLink);

    res.status(200).json({ message: 'Password reset link sent to your email.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};

//#endregion forgot passwod.

//#region reset password
const resetPassword = async (req,res) => {

  const {newPassword,token} = req.body;
  try{
    const admin = await prisma.tbl_admin.findFirst({
      where:{
        resetToken:token,
        resetTokenExpires:
        { 
          gt: new Date(),
        },
      },
    });

    if(!admin){
      return res.status(400).json({message:'Invalid or expired token.'});
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.tbl_admin.update({
      where: { id: admin.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null,
      },
    });

    res.status(200).json({ message: 'Password has been reset successfully.' });
  }
  catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};

//#endregion

//#region Get admin profile

  const getProfile =async(req,res)=>{
    try{
      const admin= await prisma.tbl_admin.findUnique({
        where :{id :req.admin.id},
        select :{
          id:true,
          fullname:true,
          username:true,
          email:true,
          phoneNumber:true,
          createdAt:true,
          updatedAt:true,
          status:true,
        },
      });

      if(!admin){
        return res.status(404).json({ msg: 'Admin profile not found' });
      }

      res.json(admin);
    }
    catch(err){
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  };

//#endregion

//#region  Update admin profile
  const updateProfile = async(req,res)=>{
    const {fullname,phoneNumber} = req.body;

    const updateData={};
    if(fullname!==undefined){
      updateData.fullname = fullname;
    }

    if(phoneNumber!==undefined){
      updateData.phoneNumber = phoneNumber;
    }

    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ msg: 'No fields provided for update.' });
    }

    try{
      const updateAdmin=await prisma.tbl_admin.update({
        where:{id:req.admin.id},
        data:updateData,
        select:{
          id:true,
          fullname:true,
          username:true,
          email:true,
          phoneNumber:true,
          createdAt:true,
          updatedAt:true,
          status:true,
        },
      });

      res.json({ msg: 'Profile updated successfully', admin: updateAdmin });
    }
    catch (err) {
      console.error(err.message);
       res.status(500).send('Server Error during profile update');
    }
  };
//#endregion


//#region Change Password

const changePassword = async (req,res)=>{
  const {oldPassword,newPassword}=req.body;
  try{
    const admin= await prisma.tbl_admin.findUnique({
      where :{id:req.admin.id},
    });

    if(!admin){
      return res.status(404).json({msg:'Admin not found.'});
    }

    const isMatch = await bcrypt.compare(oldPassword,admin.password);
    if(!isMatch){
      return res.status(404).json({msg:'Incorrect old passsword.'});
    }

    const salt=await bcrypt.genSalt(10);
    const hashedPassword =  await bcrypt.hash(newPassword,salt);

    await prisma.tbl_admin.update({
      where :{id:admin.id},
      data:{password:hashedPassword},
    });

    res.status(200).json({msg :'Password updated succcessfully'});
  }catch(err){
    console.error('Change password error:', err.message);
    res.status(500).send('Server error during password change');
  }
};

//#endregion

module.exports = { loginUser,forgotPassword,resetPassword,getProfile,updateProfile,changePassword };