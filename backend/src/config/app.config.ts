import { existsSync, mkdirSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AllExceptionsFilter } from '../common/filters/all-exceptions.filter.js';

function resolveBackendRoot(startDir: string): string {
  let current = startDir;
  while (true) {
    if (existsSync(resolve(current, 'package.json'))) {
      return current;
    }
    const parent = dirname(current);
    if (parent === current) {
      return resolve(startDir, '../..');
    }
    current = parent;
  }
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolveBackendRoot(__dirname);

function resolveUploadDir(): string {
  const envDir = process.env.UPLOAD_DIR?.trim();
  if (!envDir) {
    return resolve(backendRoot, 'uploads');
  }
  return isAbsolute(envDir) ? resolve(envDir) : resolve(backendRoot, envDir);
}

export interface StorageConfig {
  uploadDir: string;
  publicPrefix: string;
}

export const STORAGE_CONFIG: StorageConfig = {
  uploadDir: resolveUploadDir(),
  publicPrefix: '/uploads',
};

export function configureStaticAssets(app: NestExpressApplication): void {
  if (!existsSync(STORAGE_CONFIG.uploadDir)) {
    mkdirSync(STORAGE_CONFIG.uploadDir, { recursive: true });
  }

  app.useStaticAssets(STORAGE_CONFIG.uploadDir, {
    prefix: STORAGE_CONFIG.publicPrefix,
  });
}

export function configureApp(app: INestApplication): void {
  const httpAdapterHost = app.get(HttpAdapterHost);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter(httpAdapterHost));
}
