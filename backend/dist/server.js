"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const prisma_1 = require("./lib/prisma");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, cors_1.default)());
// Raised from the 100 KB default so submission POSTs can include a base64
// dash summary photo (capped at ~500 KB by the submissions route itself).
app.use(express_1.default.json({ limit: '1mb' }));
// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'API is running' });
});
// Routes
const submissions_1 = __importDefault(require("./routes/submissions"));
const users_1 = __importDefault(require("./routes/users"));
const auth_1 = __importDefault(require("./routes/auth"));
const teams_1 = __importDefault(require("./routes/teams"));
app.use('/api/submissions', submissions_1.default);
app.use('/api/users', users_1.default);
app.use('/api/auth', auth_1.default);
app.use('/api/teams', teams_1.default);
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
// Graceful shutdown
async function shutdown() {
    await prisma_1.prisma.$disconnect();
    process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
