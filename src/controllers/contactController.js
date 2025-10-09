const {PrismaClient} = require('../../generated/prisma');
const prisma = new PrismaClient();

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');


function loadTemplate(templateName, replacements = {}) {
    const headerPath = path.join(__dirname, '../emailTemplates/partials/header.html');
    const footerPath = path.join(__dirname, '../emailTemplates/partials/footer.html');
    const bodyPath = path.join(__dirname, `../emailTemplates/${templateName}.html`);

    const header = fs.readFileSync(headerPath, 'utf8');
    const footer = fs.readFileSync(footerPath, 'utf8');
    let body = fs.readFileSync(bodyPath, 'utf8');

    let fullHtml = header + body + footer;

    let processedHtml = fullHtml;
    processedHtml = processedHtml.replace(/{{#if (\w+)}}([\s\S]*?){{\/if}}/g, (match, key, content) => {
        return replacements[key] ? content : '';
    });
    
    for (const key in replacements) {
        processedHtml = processedHtml.replace(new RegExp(`{{${key}}}`, 'g'), replacements[key]);
    }

    return processedHtml;
}


async function sendContactNotificationEmail(contactData) {
    const user = process.env.GMAIL_SMTP_USER;
    const pass = process.env.GMAIL_SMTP_PASS;
    const adminEmail = process.env.ADMIN_EMAIL;

    if(!adminEmail){
        console.error('ADMIN_EMAIL is not set in environment variables.');
        return;
    }

    try{
        const transporter =nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: { user, pass },
        });

        const currentYear = new Date().getFullYear();
        const htmlContent = loadTemplate('contactNotification', {
            name: contactData.ContactName,
            email: contactData.ContactEmail,
            phoneNumber: contactData.ContactPhoneNumber || 'N/A',
            subject: contactData.ContactSubject,
            message: contactData.ContactMessage,
            // headerText: 'Invest In Nakuru',
            frontend_url: process.env.frontend_url,
            currentYear: currentYear
        });

        const mailOptions = {
            from: user,
            to: adminEmail,
            subject: `New Contact Message: ${contactData.ContactSubject}`,
            html: htmlContent,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Contact notification email sent to ${adminEmail}`);

    }catch (error) {
        console.error(`Error sending contact notification email:`, error);
        throw new Error('Failed to send contact notification email.');
    }
}

const createContact = async (req,res)=>{
    const{ContactName,ContactEmail,ContactPhoneNumber,ContactSubject,ContactMessage} = req.body;
    try{
        const newContact = await prisma.tbl_contact.create({
            data:{
                ContactName,
                ContactEmail,
                ContactPhoneNumber,
                ContactSubject,
                ContactMessage,
            },
        });

        await sendContactNotificationEmail(newContact);
        res.status(201).json({ msg : 'Message sent successfully!' , contact: newContact});
    
    }catch(err){
        console.error('Create contact error:', err.message);
        res.status(500).send('Server Error');
    }

};

const getContacts = async (req,res)=>{
    try{
        const contacts = await prisma.tbl_contact.findMany({
            orderBy :{
                ContactDate :'desc',
            },
        });

        res.json(contacts);
    }catch(err){
        console.error('Get contacts error :',err.message);
        res.status(500).send('Server Error');
    }
};

const getContactById = async (req,res)=>{
    const {id}=req.params;
    try{
        const contact=await prisma.tbl_contact.findUnique({
            where : {ContactId : id},
        });

        if(!contact){
            return res.status(404).json({msg : 'Contact not found'});
        }

        res.json(contact);
    }catch(err){
        console.error('Get contact by ID error:', err.message);
        res.status(500).send('Server Error');
    }
}


const deleteContact = async (req,res) =>{
    const {id}  = req.params;
    try{

        const deletedContact =await prisma.tbl_contact.delete({
            where :{ ContactId :id},
        });

        res.json({ msg : 'Contact message deleted successfully', contact : deletedContact});
    }catch(err){
        if (err.code === 'P2025') {
            return res.status(404).json({ msg: 'Contact not found' });
        }
        console.error('Delete contact error:', err.message);
        res.status(500).send('Server Error');
    }
};

module.exports ={createContact ,getContacts,getContactById,deleteContact};