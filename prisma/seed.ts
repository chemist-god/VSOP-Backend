import { PrismaClient, PortalStatus, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@veritrack.cloud';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe@2024!';

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    await prisma.user.create({
      data: {
        name: 'VSOP Admin',
        email: adminEmail,
        passwordHash: await bcrypt.hash(adminPassword, 12),
        role: UserRole.ADMIN,
        isActive: true,
      },
    });
    console.log(`Seeded admin user: ${adminEmail}`);
  } else {
    console.log(`Admin user already exists: ${adminEmail}`);
  }

  const demoSlug = 'yourcompany';
  let portal = await prisma.portal.findUnique({ where: { slug: demoSlug } });

  if (!portal) {
    portal = await prisma.portal.create({
      data: {
        slug: demoSlug,
        companyName: 'Your Company (Demo)',
        clientAdminEmail: 'admin@yourcompany.example',
        description: 'Demo portal for local intake testing',
        status: PortalStatus.ACTIVE,
      },
    });

    const plaintext = `vt_live_${randomBytes(24).toString('hex')}`;
    await prisma.apiKey.create({
      data: {
        portalId: portal.id,
        keyHash: await bcrypt.hash(plaintext, 12),
        keyPrefix: `vt_${plaintext.substring(0, 8)}`,
        isActive: true,
      },
    });

    console.log(`Seeded demo portal: ${demoSlug}`);
    console.log(`  Submit link: /submit?portal=${demoSlug}`);
    console.log(`  API key (dev only, shown once): ${plaintext}`);
  } else {
    console.log(`Demo portal already exists: ${demoSlug}`);
    console.log(`  Submit link: /submit?portal=${demoSlug}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
