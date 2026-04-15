export type Category = "Вести" | "Култура" | "Традиција" | "Туризам" | "Белосветске вести";

export type DialectZone = "Стандардни српски" | "Заплањски дијалект";

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  category: Category;
  author: string;
  date: string;
  readTime: string;
  imageUrl: string;
  isFeatured?: boolean;
}

export const categoryColorMap: Record<Category, string> = {
  "Вести": "cat-news",
  "Култура": "cat-culture",
  "Традиција": "cat-tradition",
  "Туризам": "cat-events",
  "Белосветске вести": "cat-world",
};
