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
    // 1. Upsert Admin Role (marked as system role)
    const adminRole = await (tx as any).role.upsert({
      where: { name: 'admin' },
      update: {
        description: 'System administrator',
        isSystem: true,
      },
      create: {
        name: 'admin',
        description: 'System administrator',
        isSystem: true,
      },
    });

    // 2. Define and upsert permission categories
    const categoriesData = [
      {
        name: 'DASHBOARD',
        description: 'Dashboard access and management overview',
      },
      {
        name: 'USERS',
        description: 'User account management and role assignment',
      },
      {
        name: 'ROLES',
        description: 'Role creation and permission assignment',
      },
      {
        name: 'PERMISSIONS',
        description: 'Permission definition and management',
      },
      {
        name: 'EVENTS',
        description: 'Event and category management permissions',
      },
      {
        name: 'GENERAL',
        description: 'General system permissions',
      },
    ];

    const categories = await Promise.all(
      categoriesData.map((cat) =>
        (tx as any).permissionCategory.upsert({
          where: { name: cat.name },
          update: { description: cat.description },
          create: { name: cat.name, description: cat.description },
        }),
      ),
    );

    const categoryMap = new Map<string, string>(
      categories.map((c: any) => [c.name, c.id]),
    );

    // 3. Define permission records with category and system flag
    const permissionsData = [
      // Dashboard
      {
        name: 'dashboard.access',
        description: 'Access the management dashboard',
        categoryName: 'DASHBOARD',
        isSystem: true,
      },

      // Users
      {
        name: 'users.view',
        description: 'View user accounts and profiles',
        categoryName: 'USERS',
        isSystem: true,
      },
      {
        name: 'users.update',
        description: 'Update user account information',
        categoryName: 'USERS',
        isSystem: true,
      },
      {
        name: 'users.delete',
        description: 'Deactivate or soft-delete user accounts',
        categoryName: 'USERS',
        isSystem: true,
      },
      {
        name: 'users.assign_role',
        description: 'Assign or change user roles',
        categoryName: 'USERS',
        isSystem: true,
      },

      // Roles
      {
        name: 'roles.create',
        description: 'Create new dynamic roles',
        categoryName: 'ROLES',
        isSystem: true,
      },
      {
        name: 'roles.view',
        description: 'View roles and their assigned permissions',
        categoryName: 'ROLES',
        isSystem: true,
      },
      {
        name: 'roles.update',
        description: 'Update role names and descriptions',
        categoryName: 'ROLES',
        isSystem: true,
      },
      {
        name: 'roles.delete',
        description: 'Delete roles without active assignments',
        categoryName: 'ROLES',
        isSystem: true,
      },
      {
        name: 'roles.assign_permissions',
        description: 'Assign or remove permissions for roles',
        categoryName: 'ROLES',
        isSystem: true,
      },

      // Permissions
      {
        name: 'permissions.create',
        description: 'Create new dynamic permissions',
        categoryName: 'PERMISSIONS',
        isSystem: true,
      },
      {
        name: 'permissions.view',
        description: 'View permissions list and details',
        categoryName: 'PERMISSIONS',
        isSystem: true,
      },
      {
        name: 'permissions.update',
        description: 'Update permission identifiers and descriptions',
        categoryName: 'PERMISSIONS',
        isSystem: true,
      },
      {
        name: 'permissions.delete',
        description: 'Delete permissions not assigned to roles',
        categoryName: 'PERMISSIONS',
        isSystem: true,
      },

      // Events
      {
        name: 'events.view',
        description: 'View events and categories in the management dashboard',
        categoryName: 'EVENTS',
        isSystem: true,
      },
      {
        name: 'events.create',
        description: 'Create events and event categories',
        categoryName: 'EVENTS',
        isSystem: true,
      },
      {
        name: 'events.update',
        description: 'Update events and event categories',
        categoryName: 'EVENTS',
        isSystem: true,
      },
      {
        name: 'events.delete',
        description: 'Delete events and event categories',
        categoryName: 'EVENTS',
        isSystem: true,
      },
    ];

    // 4. Upsert permissions with categoryId and isSystem
    const permissions = await Promise.all(
      permissionsData.map((perm) => {
        const categoryId = categoryMap.get(perm.categoryName);
        if (!categoryId) {
          throw new Error(
            `Category '${perm.categoryName}' not found for permission '${perm.name}'`,
          );
        }

        return (tx as any).permission.upsert({
          where: { name: perm.name },
          update: {
            description: perm.description,
            categoryId,
            isSystem: perm.isSystem,
          },
          create: {
            name: perm.name,
            description: perm.description,
            categoryId,
            isSystem: perm.isSystem,
          },
        });
      }),
    );

    // 5. Assign all seeded permissions to admin role
    await (tx as any).rolePermission.createMany({
      data: permissions.map((perm: any) => ({
        roleId: adminRole.id,
        permissionId: perm.id,
      })),
      skipDuplicates: true,
    });

    // 6. If Organizer role already exists, assign dashboard.access and event permissions to it
    const organizerRole = await (tx as any).role.findUnique({
      where: { name: 'organizer' },
    });

    if (organizerRole) {
      const organizerPermissionNames = [
        'dashboard.access',
        'events.view',
        'events.create',
        'events.update',
        'events.delete',
      ];

      const organizerPermissions = permissions.filter((p: any) =>
        organizerPermissionNames.includes(p.name),
      );

      if (organizerPermissions.length > 0) {
        await (tx as any).rolePermission.createMany({
          data: organizerPermissions.map((perm: any) => ({
            roleId: organizerRole.id,
            permissionId: perm.id,
          })),
          skipDuplicates: true,
        });
      }
    }

    // 7. Upsert initial Admin User (preserves existing password/details if user exists)
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
