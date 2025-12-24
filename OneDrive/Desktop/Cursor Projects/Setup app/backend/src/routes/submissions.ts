import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendUserConfirmationEmail, sendManagerNotificationEmail } from '../services/emailService';
import { generateSubmissionPDF } from '../services/pdfService';

const router = Router();
const prisma = new PrismaClient();

// Get all submissions
router.get('/', async (req, res) => {
  try {
    const submissions = await prisma.submission.findMany({
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Get last submission by email
router.get('/last/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.json(null);
    }

    const submission = await prisma.submission.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json(submission);
  } catch (error) {
    console.error('Error fetching last submission:', error);
    res.status(500).json({ error: 'Failed to fetch last submission' });
  }
});

// Get submission by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    res.json(submission);
  } catch (error) {
    console.error('Error fetching submission:', error);
    res.status(500).json({ error: 'Failed to fetch submission' });
  }
});

// Export submission as PDF
router.get('/:id/pdf', async (req, res) => {
  try {
    const { id } = req.params;
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const userName = `${submission.user.firstName} ${submission.user.lastName}`;
    const pdfBuffer = await generateSubmissionPDF(submission, userName);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=setup-${id}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// Create submission
router.post('/', async (req, res) => {
  try {
    const { userEmail, firstName, lastName, ...submissionData } = req.body;

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: userEmail,
          firstName,
          lastName,
        },
      });
    } else {
      // Update user name if provided
      if (firstName || lastName) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            firstName: firstName || user.firstName,
            lastName: lastName || user.lastName,
          },
        });
      }
    }

    // Create submission
    const submission = await prisma.submission.create({
      data: {
        ...submissionData,
        userId: user.id,
      },
      include: {
        user: true,
      },
    });

    // Send emails (non-blocking)
    try {
      await sendUserConfirmationEmail(
        user.email,
        `${user.firstName} ${user.lastName}`,
        submission
      );
    } catch (error) {
      console.error('Failed to send user confirmation email:', error);
    }

    try {
      const managerEmail = process.env.MANAGER_EMAIL;
      if (managerEmail) {
        await sendManagerNotificationEmail(
          managerEmail,
          `${user.firstName} ${user.lastName}`,
          submission
        );
      }
    } catch (error) {
      console.error('Failed to send manager notification email:', error);
    }

    res.status(201).json(submission);
  } catch (error) {
    console.error('Error creating submission:', error);
    res.status(500).json({ error: 'Failed to create submission' });
  }
});

// Update submission
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const submission = await prisma.submission.update({
      where: { id },
      data: req.body,
      include: { user: true },
    });

    res.json(submission);
  } catch (error) {
    console.error('Error updating submission:', error);
    res.status(500).json({ error: 'Failed to update submission' });
  }
});

export default router;
