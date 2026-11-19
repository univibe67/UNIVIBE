export type UserRole = "Student" | "Teacher" | "Admin";
export type UserRoleValue = string | number;

const roleByValue: Record<number, UserRole> = {
  0: "Student",
  1: "Student",
  2: "Teacher",
  3: "Admin",
};

export function normalizeRole(role: UserRoleValue): UserRole | null {
  if (typeof role === "number") {
    return roleByValue[role] ?? null;
  }

  const value = role.trim().toLowerCase();
  if (value === "0" || value === "1" || value === "student") return "Student";
  if (value === "2" || value === "teacher") return "Teacher";
  if (value === "3" || value === "admin") return "Admin";
  return null;
}

export function roleValue(role: UserRoleValue): number | null {
  const normalized = normalizeRole(role);
  if (normalized === "Student") return 1;
  if (normalized === "Teacher") return 2;
  if (normalized === "Admin") return 3;
  return null;
}

export function formatUserRole(
  role: UserRoleValue,
  translate: (key: string) => string,
): string {
  const normalized = normalizeRole(role);
  if (!normalized) return translate("UI_UnknownRole");
  return translate(`Role_${normalized}`) || normalized;
}
