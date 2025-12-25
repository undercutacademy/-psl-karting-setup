import nodemailer from 'nodemailer';
import { Submission } from '@prisma/client';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendUserConfirmationEmail(
  userEmail: string,
  userName: string,
  submission: Submission
): Promise<void> {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: userEmail,
    subject: 'PSL Karting Setup Submitted Successfully',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">PSL Karting Setup Confirmation</h2>
        <p>Hello ${userName},</p>
        <p>Your karting setup has been successfully submitted!</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Setup Details:</h3>
          <p><strong>Session Type:</strong> ${submission.sessionType}</p>
          <p><strong>Track:</strong> ${submission.track}</p>
          <p><strong>Championship:</strong> ${submission.championship}</p>
          <p><strong>Division:</strong> ${submission.division}</p>
          <p><strong>Date:</strong> ${new Date(submission.createdAt).toLocaleString()}</p>
        </div>
        <p>Thank you for using PSL Karting Setup App!</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Confirmation email sent to ${userEmail}`);
  } catch (error) {
    console.error('Error sending user confirmation email:', error);
    throw error;
  }
}

export async function sendManagerNotificationEmail(
  managerEmail: string,
  userName: string,
  submission: Submission
): Promise<void> {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: managerEmail,
    subject: `New Setup Submission from ${userName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Setup Submission</h2>
        <p>A new karting setup has been submitted:</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Submission Details:</h3>
          <p><strong>Driver:</strong> ${userName}</p>
          <p><strong>Session Type:</strong> ${submission.sessionType}</p>
          <p><strong>Track:</strong> ${submission.track}</p>
          <p><strong>Championship:</strong> ${submission.championship}</p>
          <p><strong>Division:</strong> ${submission.division}</p>
          <p><strong>Date:</strong> ${new Date(submission.createdAt).toLocaleString()}</p>
        </div>
        <p>Please log in to the manager dashboard to view full details.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Notification email sent to manager ${managerEmail}`);
  } catch (error) {
    console.error('Error sending manager notification email:', error);
    throw error;
  }
}

