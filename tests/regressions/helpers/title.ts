import type { Metadata } from "next";

type TitleTemplate = { default: string; template: string };

export function titleText(title: Metadata["title"]): string {
  if (typeof title === "string") return title;
  if (title && "absolute" in title && title.absolute) return title.absolute;
  if (title && "default" in title) return title.default;
  return "";
}

export function resolveTitle(title: Metadata["title"], root: TitleTemplate): string {
  if (typeof title === "string") return root.template.replace(/%s/g, title);
  if (title && "absolute" in title && title.absolute) return title.absolute;
  if (title && "default" in title) return root.template.replace(/%s/g, title.default);
  return root.default;
}
