import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { CloudSyncProvider } from "./provider";

const BUCKET = "car-doc-sync";
const FILE_PATH = "sync/data.json";

export class SupabaseSyncProvider implements CloudSyncProvider {
  private client: SupabaseClient;
  private url: string;
  private key: string;

  constructor(url: string, anonKey: string) {
    this.url = url;
    this.key = anonKey;
    this.client = createClient(url, anonKey);
  }

  isConfigured(): boolean {
    return Boolean(this.url && this.key);
  }

  async upload(data: object): Promise<void> {
    const json = JSON.stringify(data);
    const { error } = await this.client.storage
      .from(BUCKET)
      .upload(FILE_PATH, json, {
        upsert: true,
        contentType: "application/json",
      });
    if (error) throw new Error(`Supabase upload failed: ${error.message}`);
  }

  async download(): Promise<object | null> {
    const { data, error } = await this.client.storage
      .from(BUCKET)
      .download(FILE_PATH);
    if (error) return null;
    const text = await (data as Blob).text();
    return JSON.parse(text);
  }

  async clear(): Promise<void> {
    await this.client.storage.from(BUCKET).remove([FILE_PATH]);
  }
}
