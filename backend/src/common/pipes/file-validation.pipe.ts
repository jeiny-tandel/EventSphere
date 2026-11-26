import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

export type AllowedImageExtension = 'jpg' | 'png' | 'webp';
export type AllowedImageMimeType =
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp';

export interface ValidatedImageFile {
  buffer: Buffer;
  extension: AllowedImageExtension;
  mimetype: AllowedImageMimeType;
  size: number;
  originalname?: string;
}

export interface RawUploadFile {
  buffer?: Buffer;
  size?: number;
  originalname?: string;
  mimetype?: string;
  fieldname?: string;
}

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

interface DetectedFormat {
  extension: AllowedImageExtension;
  mimetype: AllowedImageMimeType;
}

/**
 * Validates file buffer against known image magic byte signatures.
 *
 * - JPEG: FF D8 FF
 * - PNG:  89 50 4E 47 0D 0A 1A 0A
 * - WebP: RIFF (bytes 0-3) and WEBP (bytes 8-11)
 */
function detectImageFormat(buffer: Buffer): DetectedFormat | null {
  if (!buffer || buffer.length < 3) {
    return null;
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return {
      extension: 'jpg',
      mimetype: 'image/jpeg',
    };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A (requires 8 bytes)
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return {
      extension: 'png',
      mimetype: 'image/png',
    };
  }

  // WebP: RIFF at bytes 0-3 and WEBP at bytes 8-11 (requires at least 12 bytes)
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 && // 'R'
    buffer[1] === 0x49 && // 'I'
    buffer[2] === 0x46 && // 'F'
    buffer[3] === 0x46 && // 'F'
    buffer[8] === 0x57 && // 'W'
    buffer[9] === 0x45 && // 'E'
    buffer[10] === 0x42 && // 'B'
    buffer[11] === 0x50 // 'P'
  ) {
    return {
      extension: 'webp',
      mimetype: 'image/webp',
    };
  }

  return null;
}

@Injectable()
export class ImageFileValidationPipe
  implements PipeTransform<unknown, ValidatedImageFile>
{
  transform(value: unknown): ValidatedImageFile {
    if (!value || typeof value !== 'object') {
      throw new BadRequestException('Image file is required.');
    }

    const file = value as RawUploadFile;

    if (!file.buffer || !Buffer.isBuffer(file.buffer) || file.buffer.length === 0) {
      throw new BadRequestException('Image file buffer cannot be empty.');
    }

    const fileSize = file.buffer.length;

    if (
      fileSize > MAX_IMAGE_SIZE_BYTES ||
      (typeof file.size === 'number' && file.size > MAX_IMAGE_SIZE_BYTES)
    ) {
      throw new BadRequestException('Image file size exceeds the 5 MB limit.');
    }

    const detected = detectImageFormat(file.buffer);

    if (!detected) {
      throw new BadRequestException(
        'Invalid image content. Only JPEG, PNG, and WebP images are allowed.',
      );
    }

    return {
      buffer: file.buffer,
      extension: detected.extension,
      mimetype: detected.mimetype,
      size: fileSize,
      originalname:
        typeof file.originalname === 'string' && file.originalname.trim().length > 0
          ? file.originalname.trim()
          : undefined,
    };
  }
}

export const FileValidationPipe = ImageFileValidationPipe;
