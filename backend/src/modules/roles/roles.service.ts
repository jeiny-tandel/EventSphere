import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  AssignPermissionsDto,
  CreateRoleDto,
  RemovePermissionsDto,
  UpdateRoleDto,
} from './dto/index.js';

const rolePermissionsInclude = {
  permissions: {
    include: {
      permission: true,
    },
  },
};

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createRoleDto: CreateRoleDto) {
    try {
      return await this.prisma.role.create({
        data: {
          name: createRoleDto.name,
          description: createRoleDto.description,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `Role with name '${createRoleDto.name}' already exists`,
        );
      }
      throw error;
    }
  }

  async findAll() {
    return this.prisma.role.findMany({
      include: rolePermissionsInclude,
    });
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: rolePermissionsInclude,
    });

    if (!role) {
      throw new NotFoundException(`Role with ID '${id}' not found`);
    }

    return role;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    const role = await this.findOne(id);

    if (
      role.isSystem &&
      updateRoleDto.name !== undefined &&
      updateRoleDto.name.trim() !== role.name.trim()
    ) {
      throw new ForbiddenException(
        `System role '${role.name}' cannot be renamed`,
      );
    }

    const data: {
      name?: string;
      description?: string;
    } = {};

    if (updateRoleDto.name !== undefined) {
      data.name = updateRoleDto.name;
    }
    if (updateRoleDto.description !== undefined) {
      data.description = updateRoleDto.description;
    }

    try {
      return await this.prisma.role.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const message =
            updateRoleDto.name !== undefined
              ? `Role with name '${updateRoleDto.name}' already exists`
              : 'Role name already exists';
          throw new ConflictException(message);
        }

        if (error.code === 'P2025') {
          throw new NotFoundException(`Role with ID '${id}' not found`);
        }
      }
      throw error;
    }
  }

  async remove(id: string) {
    const role = await this.findOne(id);

    if (role.isSystem) {
      throw new ForbiddenException(
        `System role '${role.name}' cannot be deleted`,
      );
    }

    try {
      return await this.prisma.role.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new ConflictException(
            `Cannot delete role with ID '${id}' because it is assigned to users or has linked permissions`,
          );
        }

        if (error.code === 'P2025') {
          throw new NotFoundException(`Role with ID '${id}' not found`);
        }
      }
      throw error;
    }
  }

  async assignPermissions(id: string, dto: AssignPermissionsDto) {
    const uniquePermissionIds = [...new Set(dto.permissionIds)];

    return this.prisma.$transaction(async (tx) => {
      const role = await tx.role.findUnique({
        where: { id },
      });

      if (!role) {
        throw new NotFoundException(`Role with ID '${id}' not found`);
      }

      const existingPermissions = await tx.permission.findMany({
        where: {
          id: { in: uniquePermissionIds },
        },
        select: { id: true },
      });

      if (existingPermissions.length !== uniquePermissionIds.length) {
        const foundIds = new Set(existingPermissions.map((p) => p.id));
        const missingIds = uniquePermissionIds.filter(
          (pid) => !foundIds.has(pid),
        );
        throw new NotFoundException(
          `The following permission ID(s) do not exist: ${missingIds.join(', ')}`,
        );
      }

      await tx.rolePermission.createMany({
        data: uniquePermissionIds.map((permissionId) => ({
          roleId: id,
          permissionId,
        })),
        skipDuplicates: true,
      });

      return tx.role.findUniqueOrThrow({
        where: { id },
        include: rolePermissionsInclude,
      });
    });
  }

  async removePermissions(id: string, dto: RemovePermissionsDto) {
    const uniquePermissionIds = [...new Set(dto.permissionIds)];

    return this.prisma.$transaction(async (tx) => {
      const role = await tx.role.findUnique({
        where: { id },
      });

      if (!role) {
        throw new NotFoundException(`Role with ID '${id}' not found`);
      }

      const existingPermissions = await tx.permission.findMany({
        where: {
          id: { in: uniquePermissionIds },
        },
        select: { id: true, name: true, isSystem: true },
      });

      if (existingPermissions.length !== uniquePermissionIds.length) {
        const foundIds = new Set(existingPermissions.map((p) => p.id));
        const missingIds = uniquePermissionIds.filter(
          (pid) => !foundIds.has(pid),
        );
        throw new NotFoundException(
          `The following permission ID(s) do not exist: ${missingIds.join(', ')}`,
        );
      }

      if (role.isSystem) {
        const systemPermissions = existingPermissions.filter((p) => p.isSystem);
        if (systemPermissions.length > 0) {
          const prohibitedNames = systemPermissions
            .map((p) => `'${p.name}'`)
            .join(', ');
          throw new ForbiddenException(
            `Cannot remove system permission(s) from system role '${role.name}': ${prohibitedNames}`,
          );
        }
      }

      await tx.rolePermission.deleteMany({
        where: {
          roleId: id,
          permissionId: { in: uniquePermissionIds },
        },
      });

      return tx.role.findUniqueOrThrow({
        where: { id },
        include: rolePermissionsInclude,
      });
    });
  }
}
