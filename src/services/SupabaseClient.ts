import { createClient } from "@supabase/supabase-js";
import { Database } from "../models/types/DatabaseTypes";

export const supabaseClient = createClient<Database>(
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_API_KEY
);
