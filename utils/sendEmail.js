import nodeMailer from 'nodemailer';

export const sendEmail = async (options) => {
    const smtpService = process.env.SMTP_SERVICE || process.env.AMTP_SERVICE;
    const smtpMail = process.env.SMTP_MAIL?.trim();
    const smtpPassword = process.env.SMTP_PASSWORD?.replace(/\s+/g, '');

    if (!smtpService || !smtpMail || !smtpPassword) {
        throw new Error('SMTP configuration is incomplete. Check SMTP_SERVICE, SMTP_MAIL, and SMTP_PASSWORD.');
    }

    const transporter = nodeMailer.createTransport({
        service: smtpService,
        auth: {
            user: smtpMail,
            pass: smtpPassword
        }
    });

    const mailOptions = {
        from: smtpMail,
        to: options.email,
        subject: options.subject,
        text: options.message
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('sendEmail failed:', error);
        throw error;
    }
};

