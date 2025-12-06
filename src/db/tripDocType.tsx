export default interface TripDocType {
    id: string;
    user_id: string;
    title: string;
    subtitle?: string;
    start_date?: string;
    end_date?: string;
    cover_image?: string;
    theme_config?: any;
    settings_config?: any;
    created_at: string;
    updated_at: string;
    is_synced: boolean;
}
