require('dotenv').config(); // Load environment variables at the top

const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const cors = require('cors');
const axios = require('axios'); // Import axios to download the QR code image
const fs = require('fs'); // Import file system module to write file
const path = require('path');

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());
app.use(cors({
    origin: 'http://127.0.0.1:5500'
}));

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Use environment variables
        pass: process.env.EMAIL_PASS  // Use environment variables
    }
});

// Route to send email
app.post('/send-email', async (req, res) => {
    const { email, subject, text, qrCodeUrl } = req.body;

    try {
        // Download the QR code image
        const response = await axios({
            url: qrCodeUrl,
            responseType: 'arraybuffer'
        });
        
        const qrCodePath = path.join(__dirname, 'qrcode.png');
        fs.writeFileSync(qrCodePath, response.data);

        // Email options with attachment
        const mailOptions = {
            from: '"Computer Explorer Society" <solecraft577@gmail.com>',
            to: email,
            subject: subject,
            text: text,
            attachments: [
                {
                    filename: 'qrcode.png',
                    path: qrCodePath,
                    cid: 'qrcode@cid'
                }
            ]
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);

        // Delete the QR code image file after sending the email
        fs.unlinkSync(qrCodePath);

        res.status(200).send({ message: 'Email sent', info });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Error sending email', error });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
