import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  AssignRoleDto,
  CreateUserDto,
  UpdateUserDto,
  UpdateUserStatusDto,
} from './dto/index.js';

const userSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phoneNumber: true,
  roleId: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  role: true,
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(createUserDto: CreateUserDto, passwordHash: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException(
        `User with email '${createUserDto.email}' already exists`,
      );
    }

    try {
      return await this.prisma.user.create({
        data: {
          firstName: createUserDto.firstName,
          lastName: createUserDto.lastName,
          email: createUserDto.email,
          phoneNumber: createUserDto.phoneNumber,
          passwordHash,
        },
        select: userSelect,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `User with email '${createUserDto.email}' already exists`,
        );
      }
      throw error;
    }
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: userSelect,
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });

    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
      },
    });
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    await this.findOne(id);

    if (updateUserDto.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });

      if (existingUser && existingUser.id !== id) {
        throw new ConflictException(
          `User with email '${updateUserDto.email}' already exists`,
        );
      }
    }

    const data: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phoneNumber?: string;
    } = {};

    if (updateUserDto.firstName !== undefined) {
      data.firstName = updateUserDto.firstName;
    }
    if (updateUserDto.lastName !== undefined) {
      data.lastName = updateUserDto.lastName;
    }
    if (updateUserDto.email !== undefined) {
      data.email = updateUserDto.email;
    }
    if (updateUserDto.phoneNumber !== undefined) {
      data.phoneNumber = updateUserDto.phoneNumber;
    }

    try {
      return await this.prisma.user.update({
        where: { id },
        data,
        select: userSelect,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `User with email '${updateUserDto.email}' already exists`,
        );
      }
      throw error;
    }
  }

  async updateUserStatus(
    id: string,
    updateUserStatusDto: UpdateUserStatusDto,
  ) {
    await this.findOne(id);

    try {
      return await this.prisma.user.update({
        where: { id },
        data: { isActive: updateUserStatusDto.isActive },
        select: userSelect,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`User with ID '${id}' not found`);
      }
      throw error;
    }
  }

  async removeUser(id: string) {
    await this.findOne(id);

    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: userSelect,
    });
  }

  async assignRole(id: string, assignRoleDto: AssignRoleDto) {
    const roleId = assignRoleDto.roleId;
    await this.findOne(id);

    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID '${roleId}' not found`);
    }

    try {
      return await this.prisma.user.update({
        where: { id },
        data: { roleId },
        select: userSelect,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`User with ID '${id}' not found`);
      }
      throw error;
    }
  }
}
