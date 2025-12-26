"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const emailService_1 = require("../services/emailService");
const pdfService_1 = require("../services/pdfService");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
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
};
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
    return transformed;
}
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
    }
    catch (error) {
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
    }
    catch (error) {
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
        const pdfBuffer = await (0, pdfService_1.generateSubmissionPDF)(submission, userName);
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
        }
        else {
            // Update user name if provided and link to team if not linked
            const updateData = {};
            if (firstName)
                updateData.firstName = firstName;
            if (lastName)
                updateData.lastName = lastName;
            if (!user.teamId)
                updateData.teamId = team.id;
            if (Object.keys(updateData).length > 0) {
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: updateData,
                });
            }
        }
        // Create submission - exclude fields that shouldn't be copied
        const { id, createdAt, updatedAt, userId, user: _user, ...cleanSubmissionData } = submissionData;
        // Transform enum values from frontend format to Prisma format
        const transformedData = transformSubmissionData(cleanSubmissionData);
        const submission = await prisma.submission.create({
            data: {
                ...transformedData,
                userId: user.id,
                teamId: team.id,
            },
            include: {
                user: true,
            },
        });
        // Send response immediately - don't wait for email
        res.status(201).json(submission);
        // Send manager notification email in background (fire-and-forget)
        const managerEmail = process.env.MANAGER_EMAIL;
        if (managerEmail) {
            (0, emailService_1.sendManagerNotificationEmail)(managerEmail, `${user.firstName} ${user.lastName}`, submission).catch((emailError) => {
                console.error('Failed to send manager notification email:', emailError);
            });
        }
    }
    catch (error) {
        console.error('Error creating submission:', error);
        console.error('Error details:', error.message, error.code);
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
    }
    catch (error) {
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
    }
    catch (error) {
        console.error('Error bulk deleting submissions:', error);
        res.status(500).json({ error: 'Failed to delete submissions' });
    }
});
exports.default = router;
