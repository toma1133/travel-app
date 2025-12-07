import { defineConfig, loadEnv } from "vite";
import path from "node:path";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd());

    return {
        base: process.env.NODE_ENV === "production" ? "/travel-app/" : "/",
        envPrefix: ["VITE_", "SUPABASE_"],
        resolve: {
            alias: {
                "~": path.resolve(__dirname, "src"),
            },
        },
        plugins: [
            react(),
            tailwindcss(),
            VitePWA({
                registerType: "autoUpdate",
                includeAssets: [
                    "favicon.ico",
                    "apple-touch-icon.png",
                    "masked-icon.svg",
                ],
                manifest: {
                    name: "My Trip",
                    short_name: "Trip",
                    description: "My Travel Itinerary",
                    theme_color: "#ffffff",
                    icons: [
                        {
                            src: "/vite.svg",
                            sizes: "192x192",
                            type: "image/svg+xml",
                        },
                        {
                            src: "/vite.svg",
                            sizes: "512x512",
                            type: "image/svg+xml",
                        },
                    ],
                },
                workbox: {
                    navigateFallback: "/index.html",
                    globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg}"],
                },
            }),
        ],
        server: {
            host: "0.0.0.0",
            watch: {
                usePolling: true,
            },
        },
    };
});
