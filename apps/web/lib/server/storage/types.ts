export type StoredObject = {
  storagePath: string;
  publicUrl: string;
};

export interface StorageAdapter {
  upload(params: {
    caseId: string;
    fileName: string;
    mimeType: string;
    buffer: Buffer;
  }): Promise<StoredObject>;
  readAsBase64(storagePath: string): Promise<string>;
}
