import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import type { MediaItem } from '../worker';

interface MediaGroup {
  id: string;
  prompt: string;
  aiModel?: string;
  timestamp: number;
  isExpanded: boolean;
  files: MediaItem[];
}

interface MediaContextType {
  mediaGroups: MediaGroup[];
  fileGroups: MediaGroup[];
  addMediaGroup: (files: MediaItem[], prompt: string, aiModel?: string) => Promise<void>;
  addFileGroup: (files: MediaItem[], prompt: string) => void;
  toggleGroupExpansion: (index: number) => void;
  deleteMediaGroup: (id: string) => Promise<void>;
  deleteFileGroup: (id: string) => void;
  updatePrompt: (id: string, newPrompt: string) => Promise<void>;
  deleteFile: (groupIndex: number, fileIndex: number) => void;
  mediaItems: MediaItem[];
  deleteMediaItem: (id: string) => Promise<void>;
}

const MediaContext = createContext<MediaContextType | undefined>(undefined);

const API_URL = 'https://your-worker.workers.dev';

export function MediaProvider({ children }: { children: ReactNode }) {
  const [mediaGroups, setMediaGroups] = useState<MediaGroup[]>([]);
  const [fileGroups, setFileGroups] = useState<MediaGroup[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 從 API 加載媒體組
  useEffect(() => {
    const loadMediaGroups = async () => {
      try {
        const response = await fetch(`${API_URL}/api/media-groups`);
        if (!response.ok) {
          throw new Error('Failed to fetch media groups');
        }
        const groups = await response.json() as MediaGroup[];
        
        // 為每個組加載其文件
        const groupsWithFiles = await Promise.all(
          groups.map(async (group) => {
            const filesResponse = await fetch(`${API_URL}/api/media-groups/${group.id}/items`);
            if (!filesResponse.ok) {
              throw new Error(`Failed to fetch files for group ${group.id}`);
            }
            const files = await filesResponse.json() as MediaItem[];
            return {
              ...group,
              isExpanded: false,
              files
            };
          })
        );
        
        setMediaGroups(groupsWithFiles);
      } catch (error) {
        console.error('Failed to load media groups:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMediaGroups();
  }, []);

  const addMediaGroup = async (files: MediaItem[], prompt: string, aiModel?: string) => {
    try {
      const response = await fetch(`${API_URL}/api/media-groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files,
          prompt,
          aiModel
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create media group');
      }

      const result = await response.json() as { id: string };
      
      // 重新加載媒體組列表
      const groupResponse = await fetch(`${API_URL}/api/media-groups`);
      if (!groupResponse.ok) {
        throw new Error('Failed to fetch updated media groups');
      }
      const groups = await groupResponse.json() as MediaGroup[];
      setMediaGroups(groups);
      
    } catch (error) {
      console.error('Failed to add media group:', error);
      throw error;
    }
  };

  const addFileGroup = (files: MediaItem[], prompt: string) => {
    const newGroup: MediaGroup = {
      id: Date.now().toString(),
      prompt,
      timestamp: Date.now(),
      isExpanded: true,
      files
    };
    setFileGroups(prev => [...prev, newGroup]);
  };

  const toggleGroupExpansion = (index: number) => {
    setMediaGroups(prev => {
      const newGroups = [...prev];
      newGroups[index].isExpanded = !newGroups[index].isExpanded;
      return newGroups;
    });
  };

  const deleteMediaGroup = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/api/media-groups/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete media group');
      }

      setMediaGroups(prev => prev.filter(group => group.id !== id));
    } catch (error) {
      console.error('Failed to delete media group:', error);
      throw error;
    }
  };

  const deleteFileGroup = (id: string) => {
    setFileGroups(prev => prev.filter(group => group.id !== id));
  };

  const deleteFile = (groupIndex: number, fileIndex: number) => {
    setFileGroups(prev => {
      const newGroups = [...prev];
      newGroups[groupIndex].files = newGroups[groupIndex].files.filter((_, i) => i !== fileIndex);
      return newGroups;
    });
  };

  const deleteMediaItem = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/api/media-items/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete media item');
      }

      setMediaItems(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Failed to delete media item:', error);
      throw error;
    }
  };

  const updatePrompt = async (id: string, newPrompt: string) => {
    try {
      const response = await fetch(`${API_URL}/api/media-groups/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: newPrompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to update prompt');
      }

      setMediaGroups(prev => 
        prev.map(group => 
          group.id === id 
            ? { ...group, prompt: newPrompt }
            : group
        )
      );
    } catch (error) {
      console.error('Failed to update prompt:', error);
      throw error;
    }
  };

  return (
    <MediaContext.Provider value={{
      mediaGroups,
      fileGroups,
      addMediaGroup,
      addFileGroup,
      toggleGroupExpansion,
      deleteMediaGroup,
      deleteFileGroup,
      updatePrompt,
      deleteFile,
      mediaItems,
      deleteMediaItem,
    }}>
      {!isLoading && children}
    </MediaContext.Provider>
  );
}

export function useMedia() {
  const context = useContext(MediaContext);
  if (context === undefined) {
    throw new Error('useMedia must be used within a MediaProvider');
  }
  return context;
}