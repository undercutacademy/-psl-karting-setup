"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireManager = requireManager;
exports.isSuperuserAccessActive = isSuperuserAccessActive;
exports.resolveSubmissionAccess = resolveSubmissionAccess;
exports.requireOwner = requireOwner;
const prisma_1 = require("../lib/prisma");
async function requireManager(req, res, next) {
    try {
        const email = req.headers['x-manager-email'];
        if (!email) {
            res.status(401).json({ error: 'Manager email required' });
            return;
        }
        const user = await prisma_1.prisma.user.findUnique({
            where: { email },
        });
        if (!user || !user.isManager) {
            res.status(403).json({ error: 'Manager access required' });
            return;
        }
        req.user = {
            id: user.id,
            email: user.email,
            isManager: user.isManager,
            isSuperAdmin: user.isSuperAdmin,
            isOwner: user.isOwner,
            teamId: user.teamId,
        };
        next();
    }
    catch (error) {
        console.error('Error in manager auth middleware:', error);
        res.status(500).json({ error: 'Authentication error' });
    }
}
function isSuperuserAccessActive(team) {
    return !!team.superuserAccessExpiresAt && team.superuserAccessExpiresAt.getTime() > Date.now();
}
function resolveSubmissionAccess(user, team) {
    if (!user)
        return 'none';
    if (user.isManager && user.teamId === team.id)
        return 'full';
    if (user.isSuperAdmin)
        return isSuperuserAccessActive(team) ? 'full' : 'list';
    return 'none';
}
/**
 * Owner-only guard for the team identified by `req.params.slug`.
 * Superadmin bypasses for support reasons.
 * Must be used after `requireManager`.
 */
async function requireOwner(req, res, next) {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        if (user.isSuperAdmin) {
            next();
            return;
        }
        const slug = req.params.slug;
        if (!slug) {
            res.status(400).json({ error: 'Team slug required' });
            return;
        }
        const team = await prisma_1.prisma.team.findUnique({ where: { slug } });
        if (!team) {
            res.status(404).json({ error: 'Team not found' });
            return;
        }
        if (!user.isOwner || user.teamId !== team.id) {
            res.status(403).json({ error: 'Owner access required' });
            return;
        }
        next();
    }
    catch (error) {
        console.error('Error in owner auth middleware:', error);
        res.status(500).json({ error: 'Authentication error' });
    }
}
