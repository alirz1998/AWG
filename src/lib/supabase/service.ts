import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Umgeht Row Level Security komplett - nur für serverseitigen Code, der
// selbst prüft, wer Zugriff bekommt (z. B. der Kalender-Feed, den
// Kalender-Apps ohne eingeloggte Session abrufen).
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
