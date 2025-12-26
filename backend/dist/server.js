"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
dotenv_1.default.config();
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
const PORT = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'API is running' });
});
// Routes
const submissions_1 = __importDefault(require("./routes/submissions"));
const users_1 = __importDefault(require("./routes/users"));
const auth_1 = __importDefault(require("./routes/auth"));
app.use('/api/submissions', submissions_1.default);
app.use('/api/users', users_1.default);
app.use('/api/auth', auth_1.default);
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
// Trigger restart 2
// Graceful shutdown
process.on('beforeExit', async () => {
    await prisma.$disconnect();
});
