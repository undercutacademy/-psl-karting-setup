"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const crypto_1 = __importDefault(require("crypto"));
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Simple password hashing (for production, use bcrypt)
function hashPassword(password) {
    return crypto_1.default.createHash('sha256').update(password).digest('hex');
}
function verifyPassword(password, hashedPassword) {
    return hashPassword(password) === hashedPassword;
}
// Manager login (email + password based)
router.post('/manager/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        if (!password) {
            return res.status(400).json({ error: 'Password is required' });
        }
        const user = await prisma.user.findUnique({
            where: { email },
        });
        if (!user || !user.isManager) {
            return res.status(401).json({ error: 'Unauthorized: Manager access required' });
        }
        // Verify password
        if (!user.password || !verifyPassword(password, user.password)) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        // In a real app, you'd generate a JWT token here
        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
            },
        });
    }
    catch (error) {
        console.error('Error in manager login:', error);
        res.status(500).json({ error: 'Failed to authenticate' });
    }
});
// Check if email is manager
router.get('/manager/check/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const user = await prisma.user.findUnique({
            where: { email },
        });
        res.json({ isManager: user?.isManager || false });
    }
    catch (error) {
        console.error('Error checking manager status:', error);
        res.status(500).json({ error: 'Failed to check manager status' });
    }
});
exports.default = router;
