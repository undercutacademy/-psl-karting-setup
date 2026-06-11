"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
// Single shared Prisma client for the whole process. Instantiating PrismaClient
// per-route opens a separate connection pool each time, which exhausts Supabase's
// pooler (session mode is capped at 15 clients) and surfaces as
// "max clients reached in session mode" 500s. Import this `prisma` everywhere
// instead of calling `new PrismaClient()`.
//
// The globalThis guard keeps a single instance alive across nodemon/ts-node
// reloads in dev so hot-restarts don't leak pools.
const globalForPrisma = globalThis;
exports.prisma = globalForPrisma.prisma ?? new client_1.PrismaClient();
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = exports.prisma;
}
