import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendUserConfirmationEmail, sendManagerNotificationEmail } from '../services/emailService';
import { generateSubmissionPDF } from '../services/pdfService';

const router = Router();
const prisma = new PrismaClient();

// Get all submissions for a team
router.get('/', async (req, res) => {
  try {
    const { teamSlug } = req.query;

    if (!teamSlug || typeof teamSlug !== 'string') {
      return res.status(400).json({ error: 'Team slug is required' });
    }

    const team = await prisma.team.findUnique({
      where: { slug: teamSlug },
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const submissions = await prisma.submission.findMany({
      where: {
        teamId: team.id,
      },
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

// Get last submission by email per team
router.get('/last/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { teamSlug } = req.query;

    if (!teamSlug || typeof teamSlug !== 'string') {
      return res.status(400).json({ error: 'Team slug is required' });
    }

    const team = await prisma.team.findUnique({
      where: { slug: teamSlug },
    });

    if (!team) {
      return res.json(null); // Return null if team doesn't exist to avoid breaking flow
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.json(null);
    }

    const submission = await prisma.submission.findFirst({
      where: {
        userId: user.id,
        teamId: team.id
      },
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
    const { userEmail, firstName, lastName, teamSlug, ...submissionData } = req.body;

    if (!teamSlug) {
      return res.status(400).json({ error: 'Team slug is required' });
    }

    const team = await prisma.team.findUnique({
      where: { slug: teamSlug },
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

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
          teamId: team.id, // Assign to team
        },
      });
    } else {
      // Update user name if provided and link to team if not linked
      const updateData: any = {};
      if (firstName) updateData.firstName = firstName;
      if (lastName) updateData.lastName = lastName;
      if (!user.teamId) updateData.teamId = team.id;

      if (Object.keys(updateData).length > 0) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });
      }
    }

    // Create submission - exclude fields that shouldn't be copied
    const { id, createdAt, updatedAt, userId, user: _user, ...cleanSubmissionData } = submissionData;

    const submission = await prisma.submission.create({
      data: {
        ...cleanSubmissionData,
        userId: user.id,
        teamId: team.id,
      },
      include: {
        user: true,
      },
    });

    // Send manager notification email only (non-blocking)
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

// Delete single submission
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.submission.delete({
      where: { id },
    });

    res.json({ success: true, message: 'Submission deleted' });
  } catch (error) {
    console.error('Error deleting submission:', error);
    res.status(500).json({ error: 'Failed to delete submission' });
  }
});

// Bulk delete submissions
router.post('/bulk-delete', async (req, res) => {
  try {
    const { ids, teamSlug } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No submission IDs provided' });
    }

    if (!teamSlug) {
      return res.status(400).json({ error: 'Team slug is required' });
    }

    const team = await prisma.team.findUnique({
      where: { slug: teamSlug },
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const result = await prisma.submission.deleteMany({
      where: {
        id: { in: ids },
        teamId: team.id, // Only delete if belongs to this team
      },
    });

    res.json({ success: true, message: `${result.count} submission(s) deleted` });
  } catch (error) {
    console.error('Error bulk deleting submissions:', error);
    res.status(500).json({ error: 'Failed to delete submissions' });
  }
});

export default router;
