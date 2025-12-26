"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireManager = requireManager;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function requireManager(req, res, next) {
    try {
        const email = req.headers['x-manager-email'];
        if (!email) {
            res.status(401).json({ error: 'Manager email required' });
            return;
        }
        const user = await prisma.user.findUnique({
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
        };
        next();
    }
    catch (error) {
        console.error('Error in manager auth middleware:', error);
        res.status(500).json({ error: 'Authentication error' });
    }
}
