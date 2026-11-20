import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const arthur = await prisma.user.upsert({
    where: { name: 'Arthur' },
    update: {},
    create: {
      name: 'Arthur',
      password: 'arthur123', // Troque pela sua senha
      incomes: {
        create: { amount: 6372 },
      },
    },
  });

  const pyetra = await prisma.user.upsert({
    where: { name: 'Pyetra' },
    update: {},
    create: {
      name: 'Pyetra',
      password: 'pyetra123', // Troque pela senha dela
      incomes: {
        create: { amount: 1841 },
      },
    },
  });

  console.log('Usuários prontos:', { arthur: arthur.name, pyetra: pyetra.name });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });