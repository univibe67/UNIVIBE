type Translate = (key: string) => string;

const categoryKeys: Record<string, string> = {
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

export function formatCategoryName(categoryName: string | undefined, translate: Translate): string {
  if (!categoryName) return translate("Student_GeneralCategory");
  const key = categoryKeys[categoryName.trim().toLocaleLowerCase("tr-TR")];
  return key ? translate(key) : categoryName;
}
