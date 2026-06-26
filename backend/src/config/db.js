const { PrismaClient } = require('@prisma/client');

/** Prisma client singleton — reuse across the app */
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

module.exports = prisma;
