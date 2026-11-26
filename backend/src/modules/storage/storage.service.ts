import { randomUUID } from 'node:crypto';
import { lstat, mkdir, realpath, unlink, writeFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { STORAGE_CONFIG } from '../../config/app.config.js';
import { StoredFile, UploadCategory } from './storage.types.js';

const ALLOWED_CATEGORIES: ReadonlySet<UploadCategory> = new Set<UploadCategory>([
  'events',
  'avatars',
]);

const ALLOWED_EXTENSIONS: ReadonlySet<string> = new Set([
  'jpg',
  'jpeg',
  'png',
  'webp',
]);

const FILENAME_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$/;

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  /**
   * Stores a validated file buffer in the category-specific subdirectory.
   *
   * @param buffer Validated file buffer to persist.
   * @param category Target upload category (must be 'events' or 'avatars').
   * @param extension Verified file extension ('jpg', 'jpeg', 'png', or 'webp').
   * @returns Metadata of the stored file including its relative public URL.
   */
  async saveFile(
    buffer: Buffer,
    category: UploadCategory,
    extension: string,
  ): Promise<StoredFile> {
    if (!category || !ALLOWED_CATEGORIES.has(category)) {
      throw new BadRequestException(
        `Unsupported upload category: '${category}'. Supported categories are: ${Array.from(ALLOWED_CATEGORIES).join(', ')}.`,
      );
    }

    if (!extension || typeof extension !== 'string') {
      throw new BadRequestException('A valid file extension is required.');
    }

    const rawExtension = extension.trim().toLowerCase().replace(/^\./, '');
    if (!ALLOWED_EXTENSIONS.has(rawExtension)) {
      throw new BadRequestException(
        `Unsupported file extension: '${extension}'. Allowed extensions are: ${Array.from(ALLOWED_EXTENSIONS).join(', ')}.`,
      );
    }

    // Normalize extensions consistently (e.g. jpeg -> jpg)
    const cleanExtension = rawExtension === 'jpeg' ? 'jpg' : rawExtension;
    const filename = `${randomUUID()}.${cleanExtension}`;
    const uploadDirNormalized = resolve(STORAGE_CONFIG.uploadDir);
    const categoryDir = resolve(uploadDirNormalized, category);

    try {
      // Asynchronous recursive directory creation without existsSync() race conditions
      await mkdir(categoryDir, { recursive: true });

      // Resolve real filesystem paths to prevent symlink traversal
      const realUploadDir = await realpath(uploadDirNormalized);
      const realBaseDirWithSep = realUploadDir.endsWith(sep)
        ? realUploadDir
        : realUploadDir + sep;

      const realCategoryDir = await realpath(categoryDir);
      const realCategoryDirWithSep = realCategoryDir.endsWith(sep)
        ? realCategoryDir
        : realCategoryDir + sep;

      // Verify real category directory is strictly inside real upload root
      if (!realCategoryDir.startsWith(realBaseDirWithSep)) {
        this.logger.warn(
          `Symlink traversal detected: category directory '${categoryDir}' resolves to '${realCategoryDir}' outside upload root '${realUploadDir}'.`,
        );
        throw new BadRequestException('Invalid upload category directory.');
      }

      const filePath = resolve(realCategoryDir, filename);

      // Ensure the resolved target file remains within the validated category directory
      if (!filePath.startsWith(realCategoryDirWithSep)) {
        this.logger.warn(
          `Target file path escape detected: '${filePath}' is outside category directory '${realCategoryDir}'.`,
        );
        throw new BadRequestException('Invalid file path.');
      }

      // Exclusive file creation flag ('wx') ensures an existing file is never overwritten
      await writeFile(filePath, buffer, { flag: 'wx' });

      const normalizedPrefix = STORAGE_CONFIG.publicPrefix.replace(/\/+$/, '');
      const relativePath = `${normalizedPrefix}/${category}/${filename}`;

      return {
        relativePath,
        filename,
        category,
        size: buffer.length,
      };
    } catch (error: unknown) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(
        `Failed to save file for category '${category}': ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InternalServerErrorException('Failed to store file.');
    }
  }

  /**
   * Deletes a file identified by its stored relative public path.
   * Prevents path traversal, rejects symlinks, and safely handles missing files.
   *
   * @param relativePathOrUrl Stored relative path (e.g. '/uploads/events/<uuid>.webp').
   * @returns boolean True if file was deleted, false if file did not exist.
   */
  async deleteFile(relativePathOrUrl: string): Promise<boolean> {
    if (!relativePathOrUrl || typeof relativePathOrUrl !== 'string') {
      return false;
    }

    const targetPath = await this.resolveSafePath(relativePathOrUrl);

    try {
      const stats = await lstat(targetPath);

      // Never follow a symbolic link to delete a file outside the configured storage directory
      if (stats.isSymbolicLink()) {
        this.logger.warn(`Rejected deletion of symbolic link: ${targetPath}`);
        throw new BadRequestException('Symbolic links cannot be deleted through storage service.');
      }

      // Check realpath of the target file to ensure it doesn't resolve outside uploadDir
      const uploadDirNormalized = resolve(STORAGE_CONFIG.uploadDir);
      const realUploadDir = await realpath(uploadDirNormalized);
      const realBaseDirWithSep = realUploadDir.endsWith(sep)
        ? realUploadDir
        : realUploadDir + sep;

      const realTargetPath = await realpath(targetPath);
      if (!realTargetPath.startsWith(realBaseDirWithSep)) {
        this.logger.warn(
          `File path traversal detected via realpath: '${realTargetPath}' outside '${realUploadDir}'`,
        );
        throw new BadRequestException('Path resolves outside the configured upload directory.');
      }

      await unlink(targetPath);
      return true;
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code: string }).code === 'ENOENT'
      ) {
        // Missing files are treated as a safe, predictable outcome
        return false;
      }

      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(
        `Failed to delete file: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InternalServerErrorException('Failed to delete file.');
    }
  }

  /**
   * Resolves a public path to an absolute path within uploadDir,
   * strictly validating public prefix, category, UUID filename format,
   * and preventing path traversal or symlink escapes.
   */
  private async resolveSafePath(relativePathOrUrl: string): Promise<string> {
    if (!relativePathOrUrl || typeof relativePathOrUrl !== 'string') {
      throw new BadRequestException('Invalid file path.');
    }

    const trimmedPath = relativePathOrUrl.trim();

    // Reject external URLs or protocol-relative URLs
    if (/^([a-z]+:|\/\/)/i.test(trimmedPath)) {
      throw new BadRequestException('External URLs cannot be resolved as storage paths.');
    }

    const normalizedPrefix = STORAGE_CONFIG.publicPrefix.replace(/\/+$/, '');
    const prefixWithSlash = `${normalizedPrefix}/`;

    if (!trimmedPath.startsWith(prefixWithSlash)) {
      throw new BadRequestException('Path does not match configured storage prefix.');
    }

    // Extract subpath after prefix, e.g. "events/d4b8f591-628f-4cf6-9a29-231a478be1a2.webp"
    const subPath = trimmedPath.slice(prefixWithSlash.length);
    const segments = subPath.split('/');

    if (segments.length !== 2) {
      throw new BadRequestException('Invalid storage path structure.');
    }

    const [category, filename] = segments;

    if (!ALLOWED_CATEGORIES.has(category as UploadCategory)) {
      throw new BadRequestException(`Invalid upload category in path: '${category}'.`);
    }

    if (!FILENAME_REGEX.test(filename)) {
      throw new BadRequestException('Invalid filename format in path.');
    }

    const uploadDirNormalized = resolve(STORAGE_CONFIG.uploadDir);
    const baseDirWithSep = uploadDirNormalized.endsWith(sep)
      ? uploadDirNormalized
      : uploadDirNormalized + sep;

    const targetPath = resolve(uploadDirNormalized, category, filename);

    // Protection against sibling-directory prefix attacks
    if (!targetPath.startsWith(baseDirWithSep)) {
      throw new BadRequestException('Path resolves outside the configured upload directory.');
    }

    // Protect against symbolic-link traversal in parent directories (e.g. category directory)
    const categoryDir = resolve(uploadDirNormalized, category);
    try {
      const realUploadDir = await realpath(uploadDirNormalized);
      const realBaseDirWithSep = realUploadDir.endsWith(sep)
        ? realUploadDir
        : realUploadDir + sep;

      const realCategoryDir = await realpath(categoryDir);
      if (!realCategoryDir.startsWith(realBaseDirWithSep)) {
        this.logger.warn(
          `Directory traversal detected: category directory '${categoryDir}' resolves to '${realCategoryDir}' outside root '${realUploadDir}'.`,
        );
        throw new BadRequestException('Invalid file path.');
      }
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code: string }).code === 'ENOENT'
      ) {
        // Category directory or upload directory does not exist on disk yet
        return targetPath;
      }
      throw error;
    }

    return targetPath;
  }
}
