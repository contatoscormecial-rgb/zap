
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mwkyoxmtyzmlgeivqoug.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13a3lveG10eXptbGdlaXZxb3VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNDY1MjcsImV4cCI6MjA3MzcyMjUyN30.LoHLubANsdsKZ4DDIg1TW07R33BPpja1EMy2jq38x74';

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL and anon key are required.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
