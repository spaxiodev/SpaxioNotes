export function getAdminUserIds() {
  return new Set(
    (process.env.SPAXIO_ADMIN_USER_IDS ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
  );
}

export function isAdminUser(userId: string | null | undefined) {
  if (!userId) return false;
  return getAdminUserIds().has(userId);
}
