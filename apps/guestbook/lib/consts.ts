export const BUCKET_NAME = 'guestbook-assets-2024-dev';

export const VIABLE_PACKAGES = ['basic', 'premium', 'deluxe'] as const;

export const PACKAGE_LIMITS = {
  basic: 50,
  premium: 100,
  deluxe: 200,
} as const;

export type PackageType = keyof typeof PACKAGE_LIMITS;

export const PACKAGE_MEDIA_OPTIONS = {
  basic: ['audio'],
  premium: ['audio'],
  deluxe: ['audio', 'video'],
} as const;

export type PackageMediaOption = 'video' | 'audio';
