export interface ImageData {
  name: string;
  url: string;
  created_at: string;
  size: number;
}

export interface ImageWithHash extends ImageData {
  hashId: string;
}
