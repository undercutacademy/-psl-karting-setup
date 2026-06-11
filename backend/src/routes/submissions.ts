import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { SessionType, RearHubsMaterial, FrontHeight, BackHeight, FrontHubsMaterial, FrontBar, Spindle, FrontWheelType } from '@prisma/client';
import { sendUserConfirmationEmail, sendManagerNotificationEmail, sendManagerNotificationEmailBatch } from '../services/emailService';
import { generateSubmissionPDF } from '../services/pdfService';
import { requireManager, resolveSubmissionAccess, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { normalizeWeatherFields } from '../lib/weather';

const router = Router();

// Enum mappings: Frontend friendly values -> Prisma enum values
const sessionTypeMap: Record<string, SessionType> = {
  'Practice 1': SessionType.Practice1,
  'Practice1': SessionType.Practice1,
  'Practice 2': SessionType.Practice2,
  'Practice2': SessionType.Practice2,
  'Practice 3': SessionType.Practice3,
  'Practice3': SessionType.Practice3,
  'Practice 4': SessionType.Practice4,
  'Practice4': SessionType.Practice4,
  'Practice 5': SessionType.Practice5,
  'Practice5': SessionType.Practice5,
  'Practice 6': SessionType.Practice6,
  'Practice6': SessionType.Practice6,
  'Happy Hour': SessionType.HappyHour,
  'HappyHour': SessionType.HappyHour,
  'Warm Up': SessionType.WarmUp,
  'WarmUp': SessionType.WarmUp,
  'Qualifying': SessionType.Qualifying,
  'Race 1': SessionType.Race1,
  'Race1': SessionType.Race1,
  'Race 2': SessionType.Race2,
  'Race2': SessionType.Race2,
  'Pre Final': SessionType.PreFinal,
  'PreFinal': SessionType.PreFinal,
  'Final': SessionType.Final,
  'Heat 1': SessionType.Heat1,
  'Heat1': SessionType.Heat1,
  'Heat 2': SessionType.Heat2,
  'Heat2': SessionType.Heat2,
  'Heat 3': SessionType.Heat3,
  'Heat3': SessionType.Heat3,
  'Heat 4': SessionType.Heat4,
  'Heat4': SessionType.Heat4,
  'Heat 5': SessionType.Heat5,
  'Heat5': SessionType.Heat5,
  'Heat 6': SessionType.Heat6,
  'Heat6': SessionType.Heat6,
  'Heat 7': SessionType.Heat7,
  'Heat7': SessionType.Heat7,
  'Super Heat 1': SessionType.SuperHeat1,
  'SuperHeat1': SessionType.SuperHeat1,
  'Super Heat 2': SessionType.SuperHeat2,
  'SuperHeat2': SessionType.SuperHeat2,
};

const rearHubsMaterialMap: Record<string, RearHubsMaterial> = {
  'Aluminium': RearHubsMaterial.Aluminium,
  'Magnesium': RearHubsMaterial.Magnesium,
};

const frontHeightMap: Record<string, FrontHeight> = {
  'Low': FrontHeight.Low,
  'Medium': FrontHeight.Medium,
  'High': FrontHeight.High,
  'Standard': FrontHeight.Standard,
};

const backHeightMap: Record<string, BackHeight> = {
  'Low': BackHeight.Low,
  'Medium': BackHeight.Medium,
  'High': BackHeight.High,
  'Standard': BackHeight.Standard,
};

const frontHubsMaterialMap: Record<string, FrontHubsMaterial> = {
  'Aluminium': FrontHubsMaterial.Aluminium,
  'Magnesium': FrontHubsMaterial.Magnesium,
};

const frontBarMap: Record<string, FrontBar> = {
  'Nylon': FrontBar.Nylon,
  'Standard': FrontBar.Standard,
  'Black': FrontBar.Black,
  'None': FrontBar.None,
};

const spindleMap: Record<string, Spindle> = {
  'Blue': Spindle.Blue,
  'Standard': Spindle.Standard,
  'Red': Spindle.Red,
  'Green': Spindle.Green,
  'Gold': Spindle.Gold,
  'Single Piece': Spindle.SinglePiece,
  'SinglePiece': Spindle.SinglePiece,
};

const frontWheelTypeMap: Record<string, FrontWheelType> = {
  'Hub': FrontWheelType.Hub,
  'No Hub': FrontWheelType.NoHub,
  'NoHub': FrontWheelType.NoHub,
};

// Accept only JPEG/PNG/WebP data URLs. 500 KB string cap ≈ 375 KB binary,
// comfortably above the 300 KB client compression target.
const DASH_SUMMARY_PHOTO_MAX_LENGTH = 500 * 1024;
const DATA_URL_PATTERN = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

// Returns { ok: true, value } or { ok: false, status, error } — caller decides
// whether to short-circuit the request.
function normalizeDashSummaryPhoto(
  input: unknown
): { ok: true; value: string | null } | { ok: false; status: number; error: string } {
  if (input === undefined || input === null || input === '') {
    return { ok: true, value: null };
  }
  if (typeof input !== 'string') {
    return { ok: false, status: 400, error: 'Invalid photo format' };
  }
  if (input.length > DASH_SUMMARY_PHOTO_MAX_LENGTH) {
    return { ok: false, status: 413, error: 'Photo too large' };
  }
  if (!DATA_URL_PATTERN.test(input)) {
    return { ok: false, status: 400, error: 'Invalid photo format' };
  }
  return { ok: true, value: input };
}

// Function to transform submission data with proper enum values
function transformSubmissionData(data: any): any {
  const transformed = { ...data };

  if (data.sessionType && typeof data.sessionType === 'string') {
    transformed.sessionType = sessionTypeMap[data.sessionType] || data.sessionType;
  }
  if (data.rearHubsMaterial && typeof data.rearHubsMaterial === 'string') {
    transformed.rearHubsMaterial = rearHubsMaterialMap[data.rearHubsMaterial] || data.rearHubsMaterial;
  }
  if (data.frontHeight && typeof data.frontHeight === 'string') {
    transformed.frontHeight = frontHeightMap[data.frontHeight] || data.frontHeight;
  }
  if (data.backHeight && typeof data.backHeight === 'string') {
    transformed.backHeight = backHeightMap[data.backHeight] || data.backHeight;
  }
  if (data.frontHubsMaterial && typeof data.frontHubsMaterial === 'string') {
    transformed.frontHubsMaterial = frontHubsMaterialMap[data.frontHubsMaterial] || data.frontHubsMaterial;
  }
  if (data.frontBar && typeof data.frontBar === 'string') {
    transformed.frontBar = frontBarMap[data.frontBar] || data.frontBar;
  }
  if (data.spindle && typeof data.spindle === 'string') {
    transformed.spindle = spindleMap[data.spindle] || data.spindle;
  }
  if (data.frontWheelType && typeof data.frontWheelType === 'string') {
    transformed.frontWheelType = frontWheelTypeMap[data.frontWheelType] || data.frontWheelType;
  }
  // sparkplugGap should be stored as Float
  if (data.sparkplugGap !== undefined && data.sparkplugGap !== null && data.sparkplugGap !== '') {
    transformed.sparkplugGap = parseFloat(data.sparkplugGap);
    if (isNaN(transformed.sparkplugGap)) {
      transformed.sparkplugGap = null;
    }
  }

  return transformed;
}

// Get all submissions for a team
router.get('/', requireManager, async (req: AuthRequest, res) => {
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

    const accessLevel = resolveSubmissionAccess(req.user, team);
    if (accessLevel === 'none') {
      return res.status(403).json({ error: 'Not authorized for this team' });
    }

    const submissions = await prisma.submission.findMany({
      where: {
        teamId: team.id,
      },
      // Exclude dashSummaryPhoto from list responses — it can be hundreds
      // of KB per row and is only needed on the detail view / PDF.
      omit: { dashSummaryPhoto: true },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json({ submissions, accessLevel });
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

    // Single round-trip: Postgres joins through user+team relations server-side.
    // The form pre-fills from this response, so strip the photo — users always
    // take a fresh shot for the current session.
    const submission = await prisma.submission.findFirst({
      where: {
        user: { email },
        team: { slug: teamSlug },
      },
      omit: { dashSummaryPhoto: true },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json(submission);
  } catch (error) {
    console.error('Error fetching last submission:', error);
    res.status(500).json({ error: 'Failed to fetch last submission' });
  }
});

// Get submission by ID
router.get('/:id', requireManager, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: { user: true, team: true },
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    if (!submission.team) {
      return res.status(404).json({ error: 'Submission has no team' });
    }

    const accessLevel = resolveSubmissionAccess(req.user, submission.team);
    if (accessLevel !== 'full') {
      return res.status(403).json({
        error: accessLevel === 'list' ? 'superuser_access_disabled' : 'Not authorized for this team',
      });
    }

    res.json(submission);
  } catch (error) {
    console.error('Error fetching submission:', error);
    res.status(500).json({ error: 'Failed to fetch submission' });
  }
});

// Export submission as PDF
router.get('/:id/pdf', requireManager, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const { teamSlug } = req.query;
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: { user: true, team: true },
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    if (!submission.team) {
      return res.status(404).json({ error: 'Submission has no team' });
    }

    const pdfAccessLevel = resolveSubmissionAccess(req.user, submission.team);
    if (pdfAccessLevel !== 'full') {
      return res.status(403).json({
        error: pdfAccessLevel === 'list' ? 'superuser_access_disabled' : 'Not authorized for this team',
      });
    }

    // Get team language and branding
    let language = 'en';
    let team = submission.team as any;
    if (!team && teamSlug && typeof teamSlug === 'string') {
      team = await prisma.team.findUnique({ where: { slug: teamSlug } });
    }
    if (team) {
      language = team.defaultLanguage || 'en';
    }

    // Resolve team logo path from frontend/public
    let logoPath: string | null = null;
    if (team?.logoUrl) {
      const frontendPublicLogo = path.join(__dirname, '../../../frontend/public', team.logoUrl);
      if (fs.existsSync(frontendPublicLogo)) {
        logoPath = frontendPublicLogo;
      }
    }

    const teamBranding = team ? {
      primaryColor: team.primaryColor || '#E31837',
      logoPath,
      teamName: team.name || 'Overcut Academy',
    } : undefined;

    const userName = `${submission.user.firstName} ${submission.user.lastName}`;
    const pdfBuffer = await generateSubmissionPDF(submission, userName, language, teamBranding);

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
    console.log('Received submission request:', JSON.stringify(req.body, null, 2));
    const { userEmail, firstName, lastName, teamSlug, ...submissionData } = req.body;

    if (!teamSlug) {
      return res.status(400).json({ error: 'Team slug is required' });
    }

    // Fetch team + upsert user in parallel (they don't depend on each other's result).
    // Upsert collapses find-or-create into one round-trip.
    const [team, upsertedUser] = await Promise.all([
      prisma.team.findUnique({ where: { slug: teamSlug } }),
      prisma.user.upsert({
        where: { email: userEmail },
        create: { email: userEmail, firstName, lastName },
        update: {
          ...(firstName ? { firstName } : {}),
          ...(lastName ? { lastName } : {}),
        },
      }),
    ]);

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Link user to team on first submission for that team (teamId only set once)
    let user = upsertedUser;
    if (!user.teamId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { teamId: team.id },
      });
    }

    // Create submission - exclude fields that shouldn't be copied
    const { id, createdAt, updatedAt, userId, user: _user, ...cleanSubmissionData } = submissionData;

    // Validate the optional dash summary photo separately — strip it from
    // the payload so transformSubmissionData doesn't see it, then re-attach
    // the normalized value.
    const photoResult = normalizeDashSummaryPhoto(cleanSubmissionData.dashSummaryPhoto);
    if (!photoResult.ok) {
      return res.status(photoResult.status).json({ error: photoResult.error });
    }
    delete cleanSubmissionData.dashSummaryPhoto;

    normalizeWeatherFields(cleanSubmissionData);

    // Transform enum values from frontend format to Prisma format
    const transformedData = transformSubmissionData(cleanSubmissionData);

    const submission = await prisma.submission.create({
      data: {
        ...transformedData,
        dashSummaryPhoto: photoResult.value,
        userId: user.id,
        teamId: team.id,
      },
      include: {
        user: true,
        team: true,
      },
    });

    // Send response immediately - don't wait for email
    res.status(201).json(submission);

    // Send manager notification emails in background (fire-and-forget)
    (async () => {
      try {
        const managerEmails = new Set<string>();

        // Priority 1: Use team.managerEmails if configured
        if (team.managerEmails && team.managerEmails.length > 0) {
          team.managerEmails.forEach((email: string) => managerEmails.add(email.trim().toLowerCase()));
        } else {
          // Fallback: Find managers who are members of this team
          const teamManagers = await prisma.user.findMany({
            where: {
              teamId: team.id,
              isManager: true,
            },
            select: { email: true },
          });
          teamManagers.forEach((m) => managerEmails.add(m.email.trim().toLowerCase()));
        }

        if (process.env.NODE_ENV === 'production') {
          // In production, only the team's managers get notified. Strip every
          // superadmin email — superadmins shouldn't receive customer notifications.
          const superadmins = await prisma.user.findMany({
            where: { isSuperAdmin: true },
            select: { email: true },
          });
          for (const sa of superadmins) {
            managerEmails.delete(sa.email.trim().toLowerCase());
          }
        } else if (process.env.MANAGER_EMAIL) {
          // In dev, also send to MANAGER_EMAIL so local testing is observable
          // without a real team manager configured.
          managerEmails.add(process.env.MANAGER_EMAIL.trim().toLowerCase());
        }

        console.log(`Sending notification emails to ${managerEmails.size} managers for team ${team.slug}`);
        console.log(`Target emails: ${Array.from(managerEmails).join(', ')}`);

        // Send a single batch email to all managers instead of individual emails
        // This helps avoid Resend free tier limitations on per-recipient verification
        try {
          await sendManagerNotificationEmailBatch(
            Array.from(managerEmails),
            `${user.firstName} ${user.lastName}`,
            submission
          );
          console.log(`✅ Batch notification sent successfully to ${managerEmails.size} managers`);
        } catch (emailError: any) {
          console.error(`❌ Failed to send batch notification email:`, emailError.message);
        }
      } catch (error) {
        console.error('Error fetching managers for notification:', error);
      }
    })();
  } catch (error: any) {
    console.error('Error creating submission:', error);
    console.error('Error details:', error.message, error.code);
    // Surface the underlying Prisma/DB error so the frontend can show
    // something more useful than a generic 500. Prisma errors are
    // descriptive (e.g. invalid enum value, unknown column) and don't
    // leak credentials.
    res.status(500).json({
      error: error?.message || 'Failed to create submission',
      code: error?.code,
    });
  }
});

// Update submission
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, userEmail, email, teamSlug, ...submissionData } = req.body;

    // Normalize email field name (support both 'userEmail' and 'email')
    const finalEmail = userEmail || email;

    // Get current submission to check existing user
    const currentSubmission = await prisma.submission.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!currentSubmission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    let updatedUserId = currentSubmission.userId;

    // Handle user updates or reassignment
    if (finalEmail || firstName || lastName) {
      const targetEmail = finalEmail || currentSubmission.user.email;

      if (targetEmail.toLowerCase() === currentSubmission.user.email.toLowerCase()) {
        // Same user, update their name if provided
        const updateUserData: any = {};
        if (firstName) updateUserData.firstName = firstName;
        if (lastName) updateUserData.lastName = lastName;

        if (Object.keys(updateUserData).length > 0) {
          await prisma.user.update({
            where: { id: currentSubmission.userId },
            data: updateUserData,
          });
        }
      } else {
        // Different email, find or create the new user
        let newUser = await prisma.user.findUnique({
          where: { email: targetEmail },
        });

        if (!newUser) {
          newUser = await prisma.user.create({
            data: {
              email: targetEmail,
              firstName: firstName || currentSubmission.user.firstName,
              lastName: lastName || currentSubmission.user.lastName,
              teamId: currentSubmission.teamId,
            },
          });
        } else {
          // Update the existing user's name if provided
          const updateUserData: any = {};
          if (firstName) updateUserData.firstName = firstName;
          if (lastName) updateUserData.lastName = lastName;
          if (Object.keys(updateUserData).length > 0) {
            await prisma.user.update({
              where: { id: newUser.id },
              data: updateUserData,
            });
          }
        }
        updatedUserId = newUser.id;
      }
    }

    // Clean submission data - remove fields that shouldn't be updated or aren't in the model
    const {
      id: _id,
      createdAt,
      updatedAt,
      userId: _userId,
      user: _user,
      team: _team,
      teamId: _teamId,
      ...cleanData
    } = submissionData;

    // Only touch the photo column if the caller explicitly included the key.
    // An omitted key = "leave it alone"; explicit null/empty = clear it.
    const photoProvided = Object.prototype.hasOwnProperty.call(cleanData, 'dashSummaryPhoto');
    let normalizedPhoto: string | null = null;
    if (photoProvided) {
      const photoResult = normalizeDashSummaryPhoto(cleanData.dashSummaryPhoto);
      if (!photoResult.ok) {
        return res.status(photoResult.status).json({ error: photoResult.error });
      }
      normalizedPhoto = photoResult.value;
      delete cleanData.dashSummaryPhoto;
    }

    normalizeWeatherFields(cleanData);

    // Transform enum values
    const transformedData = transformSubmissionData(cleanData);

    const submission = await prisma.submission.update({
      where: { id },
      data: {
        ...transformedData,
        ...(photoProvided ? { dashSummaryPhoto: normalizedPhoto } : {}),
        userId: updatedUserId,
      },
      include: { user: true },
    });

    res.json(submission);
  } catch (error: any) {
    console.error('Error updating submission:', error);
    res.status(500).json({ error: `Failed to update submission: ${error.message}` });
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
