export const publicRoutes = [
  "/",
  "/about",
  "/products",
  "/products/starter-product",
  "/blog",
  "/blog/welcome",
  "/contact",
  "/privacy"
];

export function normalizeRoute(route: string) {
  if (route === "/") {
    return "/";
  }
  return `/${route.replace(/^\/+/, "").replace(/\/+$/, "")}`;
}
