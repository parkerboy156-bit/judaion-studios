import type { MetadataRoute } from "next";

const SITE_URL = "https://judaion.com";

// Public, indexable routes. Admin/login/api are intentionally excluded.
const routes = [
  { path: "/", priority: 1.0 },
  { path: "/services", priority: 0.9 },
  { path: "/methodology", priority: 0.8 },
  { path: "/thenarrative", priority: 0.7 },
  { path: "/projectarchive", priority: 0.7 },
  { path: "/archivecatalogue", priority: 0.6 },
  { path: "/contact", priority: 0.8 },
  { path: "/tier-1", priority: 0.6 },
  { path: "/tier-2", priority: 0.6 },
  { path: "/tier-3", priority: 0.6 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return routes.map(({ path, priority }) => ({
    // trailing slash matches next.config trailingSlash: true
    url: `${SITE_URL}${path === "/" ? "/" : `${path}/`}`,
    lastModified,
    changeFrequency: "monthly",
    priority,
  }));
}
