-- Step 1: Create the PermissionCategory table
CREATE TABLE "PermissionCategory" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PermissionCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PermissionCategory_name_key" ON "PermissionCategory"("name");

-- AlterTable Role to add isSystem flag
ALTER TABLE "Role" ADD COLUMN "isSystem" BOOLEAN NOT NULL DEFAULT false;

-- Step 2: Add categoryId as nullable temporarily, and isSystem flag on Permission
ALTER TABLE "Permission" ADD COLUMN "categoryId" UUID,
ADD COLUMN "isSystem" BOOLEAN NOT NULL DEFAULT false;

-- Step 3: Create initial categories, including GENERAL
INSERT INTO "PermissionCategory" ("id", "name", "description", "createdAt", "updatedAt")
VALUES
    (gen_random_uuid(), 'DASHBOARD', 'Dashboard access and management overview', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'USERS', 'User account management and role assignment', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'ROLES', 'Role creation and permission assignment', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'PERMISSIONS', 'Permission definition and management', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'EVENTS', 'Event and category management permissions', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'GENERAL', 'General system permissions', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;

-- Step 4: Backfill every existing Permission record into an appropriate category
UPDATE "Permission"
SET "categoryId" = (SELECT "id" FROM "PermissionCategory" WHERE "name" = 'USERS')
WHERE "name" LIKE 'users.%' AND "categoryId" IS NULL;

UPDATE "Permission"
SET "categoryId" = (SELECT "id" FROM "PermissionCategory" WHERE "name" = 'ROLES')
WHERE "name" LIKE 'roles.%' AND "categoryId" IS NULL;

UPDATE "Permission"
SET "categoryId" = (SELECT "id" FROM "PermissionCategory" WHERE "name" = 'PERMISSIONS')
WHERE "name" LIKE 'permissions.%' AND "categoryId" IS NULL;

UPDATE "Permission"
SET "categoryId" = (SELECT "id" FROM "PermissionCategory" WHERE "name" = 'DASHBOARD')
WHERE "name" LIKE 'dashboard.%' AND "categoryId" IS NULL;

UPDATE "Permission"
SET "categoryId" = (SELECT "id" FROM "PermissionCategory" WHERE "name" = 'EVENTS')
WHERE "name" LIKE 'events.%' AND "categoryId" IS NULL;

-- Step 5: Ensure no Permission record remains without a category (fallback to GENERAL)
UPDATE "Permission"
SET "categoryId" = (SELECT "id" FROM "PermissionCategory" WHERE "name" = 'GENERAL')
WHERE "categoryId" IS NULL;

-- Step 6: Add the foreign key with ON DELETE RESTRICT
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "PermissionCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 7: Make categoryId NOT NULL
ALTER TABLE "Permission" ALTER COLUMN "categoryId" SET NOT NULL;

-- Mark seeded Admin role as system role
UPDATE "Role"
SET "isSystem" = true
WHERE "name" = 'admin';

-- Mark seeded permissions as system permissions
UPDATE "Permission"
SET "isSystem" = true
WHERE "name" IN (
    'dashboard.access',
    'users.view', 'users.update', 'users.delete', 'users.assign_role',
    'roles.create', 'roles.view', 'roles.update', 'roles.delete', 'roles.assign_permissions',
    'permissions.create', 'permissions.view', 'permissions.update', 'permissions.delete'
);
