import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AOH Church of God Directory",
    short_name: "AOH Directory",
    description: "Find AOH churches, service times, and worship connections.",
    start_url: "/aoh",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#17352f",
    icons: [
      {
        src: "/aoh-directory-badge.png",
        sizes: "1024x1024",
        type: "image/png",
        purpose: "any"
      }
    ]
  };
}
