"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const router = (0, express_1.Router)();
// Get user by email
router.get('/email/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const user = await prisma_1.prisma.user.findUnique({
            where: { email },
            select: { id: true, email: true, firstName: true, lastName: true, teamId: true },
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    }
    catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});
exports.default = router;
