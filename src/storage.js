import { createClient } from "@supabase/supabase-js";

/* ============================================================
   👇 VUL HIER JE SUPABASE-GEGEVENS IN
   Zie README.md voor de stappen om deze twee waarden te vinden.
   ============================================================ */
const SUPABASE_URL = "https://yfkfisyosuteqkpjukyb.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlma2Zpc3lvc3V0ZXFrcGp1a3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4OTAzMjYsImV4cCI6MjEwMjQ2NjMyNn0.GysodgiTkk2FcaBuudcSLUJZuE7L4F0A1kUGRCLcoKY";
/* ============================================================ */

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Drop-in vervanger voor window.storage, met dezelfde vorm:
 *   storage.get(key, shared)  -> { key, value, shared } | throws
 *   storage.set(key, value, shared) -> { key, value, shared }
 *
 * shared = false (of weggelaten): blijft lokaal in de browser (bv. winkelmandje).
 * shared = true: gaat naar de gedeelde Supabase-database, zichtbaar voor zowel
 *                de winkel als het beheerpaneel, op elk toestel.
 */
export const storage = {
  async get(key, shared = false) {
    if (!shared) {
      const raw = window.localStorage.getItem("local:" + key);
      if (raw === null) throw new Error("not found");
      return { key, value: raw, shared: false };
    }
    const { data, error } = await supabase
      .from("kv_store")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("not found");
    return { key, value: data.value, shared: true };
  },

  async set(key, value, shared = false) {
    if (!shared) {
      window.localStorage.setItem("local:" + key, value);
      return { key, value, shared: false };
    }
    const { error } = await supabase
      .from("kv_store")
      .upsert({ key, value }, { onConflict: "key" });
    if (error) throw error;
    return { key, value, shared: true };
  },

  /**
   * Upload een foto naar de gedeelde "product-images"-bucket en geef de
   * publieke URL terug. Gooi een fout als de bucket nog niet bestaat —
   * zie README.md voor de stap om die eenmalig aan te maken in Supabase.
   */
  async uploadImage(file) {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(fileName, file, {
      upsert: false,
      cacheControl: "3600",
    });
    if (error) throw error;
    const { data } = supabase.storage.from("product-images").getPublicUrl(fileName);
    return data.publicUrl;
  },

  async delete(key, shared = false) {
    if (!shared) {
      window.localStorage.removeItem("local:" + key);
      return { key, deleted: true, shared: false };
    }
    const { error } = await supabase.from("kv_store").delete().eq("key", key);
    if (error) throw error;
    return { key, deleted: true, shared: true };
  },
};
