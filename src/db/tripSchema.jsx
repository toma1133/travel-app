const tripSchema = {
    version: 0,
    primaryKey: "id",
    type: "object",
    properties: {
        id: { type: "string", maxLength: 100 },
        user_id: { type: "string" },
        title: { type: "string" },
        subtitle: { type: "string" },
        start_date: { type: "string" },
        end_date: { type: "string" },
        cover_image: { type: "string" },
        theme_config: {
            type: "object",
            properties: {
                bg: { type: "string" },
                primary: { type: "string" },
                secondary: { type: "string" },
                accent: { type: "string" },
                accentText: { type: "string" },
                card: { type: "string" },
                nav: { type: "string" },
                navTextActive: { type: "string" },
                navTextInactive: { type: "string" },
                border: { type: "string" },
                mono: { type: "string" },
                categoryColor: {
                    type: "object",
                    properties: {
                        transport: { type: "string" },
                        stay: { type: "string" },
                        food: { type: "string" },
                        shopping: { type: "string" },
                        ticket: { type: "string" },
                        other: { type: "string" },
                        sight: { type: "string" },
                    },
                },
            },
        },
        settings_config: {
            type: "object",
            properties: {
                homeCurrency: { type: "string" },
                localCurrency: { type: "string" },
                exchangeRate: { type: "number" },
            },
        },
        created_at: { type: "string" },
        updated_at: { type: "string" },
        is_synced: { type: "boolean" },
    },
    required: ["id", "title", "user_id"],
};

export default tripSchema;
