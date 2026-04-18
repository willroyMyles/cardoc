import { Client, Storage } from "appwrite";
import { CloudSyncProvider } from "./provider";

const BUCKET_ID = "car-doc-sync";
const FILE_ID = "sync-data";

export class AppwriteSyncProvider implements CloudSyncProvider {
  private client: Client;
  private storage: Storage;
  private endpoint: string;
  private projectId: string;

  constructor(endpoint: string, projectId: string) {
    this.endpoint = endpoint;
    this.projectId = projectId;
    this.client = new Client().setEndpoint(endpoint).setProject(projectId);
    this.storage = new Storage(this.client);
  }

  isConfigured(): boolean {
    return Boolean(this.endpoint && this.projectId);
  }

  async upload(data: object): Promise<void> {
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const file = new File([blob], "data.json", { type: "application/json" });
    // Delete existing before uploading to upsert
    await this.storage.deleteFile(BUCKET_ID, FILE_ID).catch(() => {});
    await this.storage.createFile(BUCKET_ID, FILE_ID, file);
  }

  async download(): Promise<object | null> {
    try {
      const result = await this.storage.getFileDownload(BUCKET_ID, FILE_ID);
      const response = await fetch(result.href ?? result.toString());
      return await response.json();
    } catch {
      return null;
    }
  }

  async clear(): Promise<void> {
    await this.storage.deleteFile(BUCKET_ID, FILE_ID).catch(() => {});
  }
}
