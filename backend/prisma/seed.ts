import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import { PrismaClient } from '../generated/prisma/client.js';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function seed() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminFirstName = process.env.ADMIN_FIRST_NAME;
  const adminLastName = process.env.ADMIN_LAST_NAME;

  const missingEnvVars: string[] = [];
  if (!adminEmail) missingEnvVars.push('ADMIN_EMAIL');
  if (!adminPassword) missingEnvVars.push('ADMIN_PASSWORD');
  if (!adminFirstName) missingEnvVars.push('ADMIN_FIRST_NAME');
  if (!adminLastName) missingEnvVars.push('ADMIN_LAST_NAME');

  if (missingEnvVars.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missingEnvVars.join(', ')}`,
    );
  }

  const passwordHash = await bcrypt.hash(adminPassword!, 12);

  await prisma.$transaction(async (tx) => {
    // 1. Upsert Admin Role
    const adminRole = await tx.role.upsert({
      where: { name: 'admin' },
      update: {
        description: 'System administrator',
      },
      create: {
        name: 'admin',
        description: 'System administrator',
      },
    });

    // 2. Define permission records
    const permissionsData = [
      // Users
      {
        name: 'users.view',
        description: 'View user accounts and profiles',
      },
      {
        name: 'users.update',
        description: 'Update user account information',
      },
      {
        name: 'users.delete',
        description: 'Deactivate or soft-delete user accounts',
      },
      {
        name: 'users.assign_role',
        description: 'Assign or change user roles',
      },

      // Roles
      {
        name: 'roles.create',
        description: 'Create new dynamic roles',
      },
      {
        name: 'roles.view',
        description: 'View roles and their assigned permissions',
      },
      {
        name: 'roles.update',
        description: 'Update role names and descriptions',
      },
      {
        name: 'roles.delete',
        description: 'Delete roles without active assignments',
      },
      {
        name: 'roles.assign_permissions',
        description: 'Assign or remove permissions for roles',
      },

      // Permissions
      {
        name: 'permissions.create',
        description: 'Create new dynamic permissions',
      },
      {
        name: 'permissions.view',
        description: 'View permissions list and details',
      },
      {
        name: 'permissions.update',
        description: 'Update permission identifiers and descriptions',
      },
      {
        name: 'permissions.delete',
        description: 'Delete permissions not assigned to roles',
      },
    ];

    // 3. Upsert permissions
    const permissions = await Promise.all(
      permissionsData.map((perm) =>
        tx.permission.upsert({
          where: { name: perm.name },
          update: { description: perm.description },
          create: { name: perm.name, description: perm.description },
        }),
      ),
    );

    // 4. Assign permissions to admin role
    await tx.rolePermission.createMany({
      data: permissions.map((perm) => ({
        roleId: adminRole.id,
        permissionId: perm.id,
      })),
      skipDuplicates: true,
    });

    // 5. Upsert initial Admin User (preserves existing password/details if user exists)
    await tx.user.upsert({
      where: { email: adminEmail! },
      update: {
        roleId: adminRole.id,
      },
      create: {
        firstName: adminFirstName!,
        lastName: adminLastName!,
        email: adminEmail!,
        passwordHash,
        isActive: true,
        roleId: adminRole.id,
      },
    });
  });

  console.log('Database seeding completed successfully.');
}

async function main() {
  try {
    await seed();
  } catch (error) {
    console.error('Database seeding failed:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
