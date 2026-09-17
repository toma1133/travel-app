declare interface ImportMetaEnv {
    readonly SUPABASE_URL: string;
    readonly SUPABASE_API_KEY: string;
    readonly VITE_KAKAO_REST_API_KEY?: string;
    readonly VITE_CARTO_API_KEY?: string;
    readonly VITE_STADIA_MAPS_API_KEY?: string;
}

declare interface ImportMeta {
    readonly env: ImportMetaEnv;
}
