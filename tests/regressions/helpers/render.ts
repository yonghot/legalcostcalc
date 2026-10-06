import { vi } from "vitest";
import { createElement } from "react";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const nav = vi.hoisted(() => ({ pathname: "/" }));

vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ push: () => {}, replace: () => {}, prefetch: () => {}, back: () => {} }),
  useSearchParams: () => new URLSearchParams(),
  notFound: () => {
    throw new Error("notFound() must not be reached in this test");
  },
}));

vi.mock("next/link", async () => {
  const { createElement: h } = await import("react");
  return {
    default: ({
      href,
      children,
      ...rest
    }: {
      href: string;
      children?: ReactNode;
      className?: string;
    }) => h("a", { href, ...rest }, children),
  };
});

vi.mock("next/font/google", () => {
  const font = () => ({ variable: "", className: "" });
  return { Inter: font, JetBrains_Mono: font };
});

export function setPathname(pathname: string): void {
  nav.pathname = pathname;
}

type PageComponent<P> = (props: P) => ReactNode | Promise<ReactNode>;

export async function renderPage<P extends { params: Promise<unknown> }>(
  Page: PageComponent<P>,
  params?: Awaited<P["params"]>,
): Promise<string> {
  const element = await Page({ params: Promise.resolve(params ?? {}) } as P);
  return renderToStaticMarkup(createElement("div", null, element));
}
