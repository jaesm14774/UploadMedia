export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  file: File;
  url: string;
  prompt: string;
  createdAt: Date;
}

export interface MediaContextType {
  mediaItems: MediaItem[];
  addMediaItem: (file: File, prompt: string) => void;
  updatePrompt: (id: string, prompt: string) => void;
  deleteMediaItem: (id: string) => void;
}