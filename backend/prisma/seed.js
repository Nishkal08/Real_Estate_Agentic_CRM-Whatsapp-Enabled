const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('demo123', 10);

  const demoBusiness = await prisma.business.upsert({
    where: { ownerEmail: 'demo@solarbright.in' },
    update: {},
    create: {
      name: 'SolarBright',
      ownerEmail: 'demo@solarbright.in',
      passwordHash,
      plan: 'pro',
    },
  });

  const adminPasswordHash = await bcrypt.hash('nishkal@810', 10);
  const adminBusiness = await prisma.business.upsert({
    where: { ownerEmail: 'nishkal0810@gmail.com' },
    update: {},
    create: {
      name: 'Super Admin',
      ownerEmail: 'nishkal0810@gmail.com',
      passwordHash: adminPasswordHash,
      plan: 'enterprise',
    },
  });

  console.log('Seeding finished successfully.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
