"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const client_1 = require("@prisma/client");
const emailService_1 = require("../services/emailService");
const pdfService_1 = require("../services/pdfService");
const auth_1 = require("../middleware/auth");
const prisma_1 = require("../lib/prisma");
const weather_1 = require("../lib/weather");
const router = (0, express_1.Router)();
// Enum mappings: Frontend friendly values -> Prisma enum values
const sessionTypeMap = {
    'Practice 1': client_1.SessionType.Practice1,
    'Practice1': client_1.SessionType.Practice1,
    'Practice 2': client_1.SessionType.Practice2,
    'Practice2': client_1.SessionType.Practice2,
    'Practice 3': client_1.SessionType.Practice3,
    'Practice3': client_1.SessionType.Practice3,
    'Practice 4': client_1.SessionType.Practice4,
    'Practice4': client_1.SessionType.Practice4,
    'Practice 5': client_1.SessionType.Practice5,
    'Practice5': client_1.SessionType.Practice5,
    'Practice 6': client_1.SessionType.Practice6,
    'Practice6': client_1.SessionType.Practice6,
    'Happy Hour': client_1.SessionType.HappyHour,
    'HappyHour': client_1.SessionType.HappyHour,
    'Warm Up': client_1.SessionType.WarmUp,
    'WarmUp': client_1.SessionType.WarmUp,
    'Qualifying': client_1.SessionType.Qualifying,
    'Race 1': client_1.SessionType.Race1,
    'Race1': client_1.SessionType.Race1,
    'Race 2': client_1.SessionType.Race2,
    'Race2': client_1.SessionType.Race2,
    'Pre Final': client_1.SessionType.PreFinal,
    'PreFinal': client_1.SessionType.PreFinal,
    'Final': client_1.SessionType.Final,
    'Heat 1': client_1.SessionType.Heat1,
    'Heat1': client_1.SessionType.Heat1,
    'Heat 2': client_1.SessionType.Heat2,
    'Heat2': client_1.SessionType.Heat2,
    'Heat 3': client_1.SessionType.Heat3,
    'Heat3': client_1.SessionType.Heat3,
    'Heat 4': client_1.SessionType.Heat4,
    'Heat4': client_1.SessionType.Heat4,
    'Heat 5': client_1.SessionType.Heat5,
    'Heat5': client_1.SessionType.Heat5,
    'Heat 6': client_1.SessionType.Heat6,
    'Heat6': client_1.SessionType.Heat6,
    'Heat 7': client_1.SessionType.Heat7,
    'Heat7': client_1.SessionType.Heat7,
    'Super Heat 1': client_1.SessionType.SuperHeat1,
    'SuperHeat1': client_1.SessionType.SuperHeat1,
    'Super Heat 2': client_1.SessionType.SuperHeat2,
    'SuperHeat2': client_1.SessionType.SuperHeat2,
};
const rearHubsMaterialMap = {
    'Aluminium': client_1.RearHubsMaterial.Aluminium,
    'Magnesium': client_1.RearHubsMaterial.Magnesium,
};
const frontHeightMap = {
    'Low': client_1.FrontHeight.Low,
    'Medium': client_1.FrontHeight.Medium,
    'High': client_1.FrontHeight.High,
    'Standard': client_1.FrontHeight.Standard,
};
const backHeightMap = {
    'Low': client_1.BackHeight.Low,
    'Medium': client_1.BackHeight.Medium,
    'High': client_1.BackHeight.High,
    'Standard': client_1.BackHeight.Standard,
};
const frontHubsMaterialMap = {
    'Aluminium': client_1.FrontHubsMaterial.Aluminium,
    'Magnesium': client_1.FrontHubsMaterial.Magnesium,
};
const frontBarMap = {
    'Nylon': client_1.FrontBar.Nylon,
    'Standard': client_1.FrontBar.Standard,
    'Black': client_1.FrontBar.Black,
    'None': client_1.FrontBar.None,
};
const spindleMap = {
    'Blue': client_1.Spindle.Blue,
    'Standard': client_1.Spindle.Standard,
    'Red': client_1.Spindle.Red,
    'Green': client_1.Spindle.Green,
    'Gold': client_1.Spindle.Gold,
    'Single Piece': client_1.Spindle.SinglePiece,
    'SinglePiece': client_1.Spindle.SinglePiece,
};
const frontWheelTypeMap = {
    'Hub': client_1.FrontWheelType.Hub,
    'No Hub': client_1.FrontWheelType.NoHub,
    'NoHub': client_1.FrontWheelType.NoHub,
};
// Accept only JPEG/PNG/WebP data URLs. 500 KB string cap ≈ 375 KB binary,
// comfortably above the 300 KB client compression target.
const DASH_SUMMARY_PHOTO_MAX_LENGTH = 500 * 1024;
const DATA_URL_PATTERN = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;
// Returns { ok: true, value } or { ok: false, status, error } — caller decides
// whether to short-circuit the request.
function normalizeDashSummaryPhoto(input) {
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
function transformSubmissionData(data) {
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
router.get('/', auth_1.requireManager, async (req, res) => {
    try {
        const { teamSlug } = req.query;
        if (!teamSlug || typeof teamSlug !== 'string') {
            return res.status(400).json({ error: 'Team slug is required' });
        }
        const team = await prisma_1.prisma.team.findUnique({
            where: { slug: teamSlug },
        });
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }
        const accessLevel = (0, auth_1.resolveSubmissionAccess)(req.user, team);
        if (accessLevel === 'none') {
            return res.status(403).json({ error: 'Not authorized for this team' });
        }
        const submissions = await prisma_1.prisma.submission.findMany({
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
    }
    catch (error) {
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
        const submission = await prisma_1.prisma.submission.findFirst({
            where: {
                user: { email },
                team: { slug: teamSlug },
            },
            omit: { dashSummaryPhoto: true },
            include: { user: true },
            orderBy: { createdAt: 'desc' },
        });
        res.json(submission);
    }
    catch (error) {
        console.error('Error fetching last submission:', error);
        res.status(500).json({ error: 'Failed to fetch last submission' });
    }
});
// Get submission by ID
router.get('/:id', auth_1.requireManager, async (req, res) => {
    try {
        const id = req.params.id;
        const submission = await prisma_1.prisma.submission.findUnique({
            where: { id },
            include: { user: true, team: true },
        });
        if (!submission) {
            return res.status(404).json({ error: 'Submission not found' });
        }
        if (!submission.team) {
            return res.status(404).json({ error: 'Submission has no team' });
        }
        const accessLevel = (0, auth_1.resolveSubmissionAccess)(req.user, submission.team);
        if (accessLevel !== 'full') {
            return res.status(403).json({
                error: accessLevel === 'list' ? 'superuser_access_disabled' : 'Not authorized for this team',
            });
        }
        res.json(submission);
    }
    catch (error) {
        console.error('Error fetching submission:', error);
        res.status(500).json({ error: 'Failed to fetch submission' });
    }
});
// Export submission as PDF
router.get('/:id/pdf', auth_1.requireManager, async (req, res) => {
    try {
        const id = req.params.id;
        const { teamSlug } = req.query;
        const submission = await prisma_1.prisma.submission.findUnique({
            where: { id },
            include: { user: true, team: true },
        });
        if (!submission) {
            return res.status(404).json({ error: 'Submission not found' });
        }
        if (!submission.team) {
            return res.status(404).json({ error: 'Submission has no team' });
        }
        const pdfAccessLevel = (0, auth_1.resolveSubmissionAccess)(req.user, submission.team);
        if (pdfAccessLevel !== 'full') {
            return res.status(403).json({
                error: pdfAccessLevel === 'list' ? 'superuser_access_disabled' : 'Not authorized for this team',
            });
        }
        // Get team language and branding
        let language = 'en';
        let team = submission.team;
        if (!team && teamSlug && typeof teamSlug === 'string') {
            team = await prisma_1.prisma.team.findUnique({ where: { slug: teamSlug } });
        }
        if (team) {
            language = team.defaultLanguage || 'en';
        }
        // Resolve team logo path from frontend/public
        let logoPath = null;
        if (team?.logoUrl) {
            const frontendPublicLogo = path_1.default.join(__dirname, '../../../frontend/public', team.logoUrl);
            if (fs_1.default.existsSync(frontendPublicLogo)) {
                logoPath = frontendPublicLogo;
            }
        }
        const teamBranding = team ? {
            primaryColor: team.primaryColor || '#E31837',
            logoPath,
            teamName: team.name || 'Overcut Academy',
        } : undefined;
        const userName = `${submission.user.firstName} ${submission.user.lastName}`;
        const pdfBuffer = await (0, pdfService_1.generateSubmissionPDF)(submission, userName, language, teamBranding);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=setup-${id}.pdf`);
        res.send(pdfBuffer);
    }
    catch (error) {
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
            prisma_1.prisma.team.findUnique({ where: { slug: teamSlug } }),
            prisma_1.prisma.user.upsert({
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
            user = await prisma_1.prisma.user.update({
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
        (0, weather_1.normalizeWeatherFields)(cleanSubmissionData);
        // Transform enum values from frontend format to Prisma format
        const transformedData = transformSubmissionData(cleanSubmissionData);
        const submission = await prisma_1.prisma.submission.create({
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
                const managerEmails = new Set();
                // Priority 1: Use team.managerEmails if configured
                if (team.managerEmails && team.managerEmails.length > 0) {
                    team.managerEmails.forEach((email) => managerEmails.add(email.trim().toLowerCase()));
                }
                else {
                    // Fallback: Find managers who are members of this team
                    const teamManagers = await prisma_1.prisma.user.findMany({
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
                    const superadmins = await prisma_1.prisma.user.findMany({
                        where: { isSuperAdmin: true },
                        select: { email: true },
                    });
                    for (const sa of superadmins) {
                        managerEmails.delete(sa.email.trim().toLowerCase());
                    }
                }
                else if (process.env.MANAGER_EMAIL) {
                    // In dev, also send to MANAGER_EMAIL so local testing is observable
                    // without a real team manager configured.
                    managerEmails.add(process.env.MANAGER_EMAIL.trim().toLowerCase());
                }
                console.log(`Sending notification emails to ${managerEmails.size} managers for team ${team.slug}`);
                console.log(`Target emails: ${Array.from(managerEmails).join(', ')}`);
                // Send a single batch email to all managers instead of individual emails
                // This helps avoid Resend free tier limitations on per-recipient verification
                try {
                    await (0, emailService_1.sendManagerNotificationEmailBatch)(Array.from(managerEmails), `${user.firstName} ${user.lastName}`, submission);
                    console.log(`✅ Batch notification sent successfully to ${managerEmails.size} managers`);
                }
                catch (emailError) {
                    console.error(`❌ Failed to send batch notification email:`, emailError.message);
                }
            }
            catch (error) {
                console.error('Error fetching managers for notification:', error);
            }
        })();
    }
    catch (error) {
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
        const currentSubmission = await prisma_1.prisma.submission.findUnique({
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
                const updateUserData = {};
                if (firstName)
                    updateUserData.firstName = firstName;
                if (lastName)
                    updateUserData.lastName = lastName;
                if (Object.keys(updateUserData).length > 0) {
                    await prisma_1.prisma.user.update({
                        where: { id: currentSubmission.userId },
                        data: updateUserData,
                    });
                }
            }
            else {
                // Different email, find or create the new user
                let newUser = await prisma_1.prisma.user.findUnique({
                    where: { email: targetEmail },
                });
                if (!newUser) {
                    newUser = await prisma_1.prisma.user.create({
                        data: {
                            email: targetEmail,
                            firstName: firstName || currentSubmission.user.firstName,
                            lastName: lastName || currentSubmission.user.lastName,
                            teamId: currentSubmission.teamId,
                        },
                    });
                }
                else {
                    // Update the existing user's name if provided
                    const updateUserData = {};
                    if (firstName)
                        updateUserData.firstName = firstName;
                    if (lastName)
                        updateUserData.lastName = lastName;
                    if (Object.keys(updateUserData).length > 0) {
                        await prisma_1.prisma.user.update({
                            where: { id: newUser.id },
                            data: updateUserData,
                        });
                    }
                }
                updatedUserId = newUser.id;
            }
        }
        // Clean submission data - remove fields that shouldn't be updated or aren't in the model
        const { id: _id, createdAt, updatedAt, userId: _userId, user: _user, team: _team, teamId: _teamId, ...cleanData } = submissionData;
        // Only touch the photo column if the caller explicitly included the key.
        // An omitted key = "leave it alone"; explicit null/empty = clear it.
        const photoProvided = Object.prototype.hasOwnProperty.call(cleanData, 'dashSummaryPhoto');
        let normalizedPhoto = null;
        if (photoProvided) {
            const photoResult = normalizeDashSummaryPhoto(cleanData.dashSummaryPhoto);
            if (!photoResult.ok) {
                return res.status(photoResult.status).json({ error: photoResult.error });
            }
            normalizedPhoto = photoResult.value;
            delete cleanData.dashSummaryPhoto;
        }
        (0, weather_1.normalizeWeatherFields)(cleanData);
        // Transform enum values
        const transformedData = transformSubmissionData(cleanData);
        const submission = await prisma_1.prisma.submission.update({
            where: { id },
            data: {
                ...transformedData,
                ...(photoProvided ? { dashSummaryPhoto: normalizedPhoto } : {}),
                userId: updatedUserId,
            },
            include: { user: true },
        });
        res.json(submission);
    }
    catch (error) {
        console.error('Error updating submission:', error);
        res.status(500).json({ error: `Failed to update submission: ${error.message}` });
    }
});
// Delete single submission
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.prisma.submission.delete({
            where: { id },
        });
        res.json({ success: true, message: 'Submission deleted' });
    }
    catch (error) {
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
        const team = await prisma_1.prisma.team.findUnique({
            where: { slug: teamSlug },
        });
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }
        const result = await prisma_1.prisma.submission.deleteMany({
            where: {
                id: { in: ids },
                teamId: team.id, // Only delete if belongs to this team
            },
        });
        res.json({ success: true, message: `${result.count} submission(s) deleted` });
    }
    catch (error) {
        console.error('Error bulk deleting submissions:', error);
        res.status(500).json({ error: 'Failed to delete submissions' });
    }
});
exports.default = router;
