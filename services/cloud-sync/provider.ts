export interface CloudSyncProvider {
  isConfigured(): boolean;
  upload(data: object): Promise<void>;
  download(): Promise<object | null>;
  clear(): Promise<void>;
}
