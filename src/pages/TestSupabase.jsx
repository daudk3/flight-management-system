import { useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function TestSupabase() {
  useEffect(() => {
    async function testConnection() {
      const { data, error } = await supabase.from("flights").select("*").limit(1);
      console.log("✅ Flights:", data);
      console.log("❌ Error:", error);
    }
    testConnection();
  }, []);

  return <p>Check your browser console (F12) — Supabase connection test running!</p>;
}
