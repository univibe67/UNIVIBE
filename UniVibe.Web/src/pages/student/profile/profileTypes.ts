export interface UserProfile {
  id?: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phoneNumber?: string;
  bio?: string;
  socialMediaLink?: string;
  universityName?: string;
  facultyName?: string;
  departmentName?: string;
  profilePictureUrl?: string;
  role?: string | number;
  title?: string;
  grade?: number;
}

const GUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function readName(source: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) {
      return GUID_PATTERN.test(value.trim()) ? "" : value.trim();
    }
    if (value && typeof value === "object") {
      const nested = value as Record<string, unknown>;
      const name = nested.name ?? nested.Name ?? nested.title ?? nested.Title;
      if (typeof name === "string" && name.trim()) return name.trim();
    }
  }
  return "";
}

export function normalizeProfile(data: Record<string, unknown>): UserProfile {
  return {
    ...(data as unknown as UserProfile),
    departmentName: readName(data, ["departmentName", "department", "DepartmentName", "Department"]),
    universityName: readName(data, ["universityName", "university", "UniversityName", "University"]),
    facultyName: readName(data, ["facultyName", "faculty", "FacultyName", "Faculty"]),
  };
}
