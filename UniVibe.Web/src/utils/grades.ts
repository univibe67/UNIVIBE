export const GRADE_OPTIONS = [
  { value: 0, labelKey: "Grade_Prep" },
  { value: 1, labelKey: "Grade_1" },
  { value: 2, labelKey: "Grade_2" },
  { value: 3, labelKey: "Grade_3" },
  { value: 4, labelKey: "Grade_4" },
  { value: 5, labelKey: "Grade_5" },
  { value: 6, labelKey: "Grade_6" },
  { value: 7, labelKey: "Grade_Graduated" },
] as const;

export function gradeLabelKey(grade?: number | null): string | null {
  return GRADE_OPTIONS.find((option) => option.value === grade)?.labelKey ?? null;
}
