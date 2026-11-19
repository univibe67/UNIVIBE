type Translate = (key: string) => string;

export const CATEGORY_KEYS = [
  "Category_ArtsCulture",
  "Category_Academic",
  "Category_MusicEntertainment",
  "Category_ClubsSocial",
  "Category_Sports",
  "Category_Technology",
] as const;

export type CategoryKey = (typeof CATEGORY_KEYS)[number];

const categoryKeys: Record<string, CategoryKey> = {
  "sanat ve kültür": "Category_ArtsCulture",
  "arts and culture": "Category_ArtsCulture",
  akademik: "Category_Academic",
  academic: "Category_Academic",
  "müzik ve eğlence": "Category_MusicEntertainment",
  "music and entertainment": "Category_MusicEntertainment",
  "kulüp ve sosyal": "Category_ClubsSocial",
  "clubs and social": "Category_ClubsSocial",
  spor: "Category_Sports",
  sports: "Category_Sports",
  teknoloji: "Category_Technology",
  technology: "Category_Technology",
};

export function getCategoryKey(categoryName?: string): CategoryKey | undefined {
  if (!categoryName) return undefined;
  return categoryKeys[categoryName.trim().toLocaleLowerCase("tr-TR")];
}

export function formatCategoryName(categoryName: string | undefined, translate: Translate): string {
  if (!categoryName) return translate("Student_GeneralCategory");
  const key = getCategoryKey(categoryName);
  return key ? translate(key) : categoryName;
}
