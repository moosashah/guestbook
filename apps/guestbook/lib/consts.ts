export const BUCKET_NAME = 'guestbook-assets-2024-dev';

export const VIABLE_PACKAGES = ['basic', 'premium', 'deluxe'] as const;

export const PACKAGE_LIMITS = {
  basic: 50,
  premium: 100,
  deluxe: 200,
} as const;

export type PackageType = keyof typeof PACKAGE_LIMITS;
