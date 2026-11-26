/**
 * Derives the backend origin from the VITE_API_BASE_URL environment variable.
 * E.g., "http://localhost:3000/api" -> "http://localhost:3000"
 */
function getBackendOrigin(): string {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  if (!apiBaseUrl) {
    return '';
  }

  try {
    return new URL(apiBaseUrl).origin;
  } catch {
    return apiBaseUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');
  }
}

/**
 * Returns the fully qualified URL for an event cover image.
 *
 * Backend cover image paths already include the static prefix:
 * e.g., "/uploads/events/<uuid>.<ext>"
 *
 * @param coverImage Stored cover-image path (e.g. "/uploads/events/<uuid>.webp")
 * @returns Fully resolved image URL, or null if null, undefined, or empty.
 */
export function getEventCoverImageUrl(
  coverImage: string | null | undefined,
): string | null {
  if (!coverImage || typeof coverImage !== 'string') {
    return null;
  }

  const trimmed = coverImage.trim();
  if (trimmed.length === 0) {
    return null;
  }

  if (/^(?:https?:)?\/\//i.test(trimmed) || trimmed.startsWith('data:')) {
    return trimmed;
  }

  const origin = getBackendOrigin();
  const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;

  return origin ? `${origin}${normalizedPath}` : normalizedPath;
}
