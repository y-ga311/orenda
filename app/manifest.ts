import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Orenda",
    short_name: "Orenda",
    description: "学生向け勉強管理サービス",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#87d7ff",
    theme_color: "#1d9bff",
    orientation: "portrait",
  };
}
