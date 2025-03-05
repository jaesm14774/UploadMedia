import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

interface MediaFile {
  id: string;
  name: string;
  type: string;
  data: string;
  preview?: string;
}

interface MediaGroup {
  id: string;
  prompt: string;
  aiModel?: string;
  timestamp: number;
  isExpanded: boolean;
  files: MediaFile[];
}

interface MediaContextType {
  mediaGroups: MediaGroup[];
  addMediaGroup: (files: MediaFile[], prompt: string, aiModel?: string) => Promise<void>;
  toggleGroupExpansion: (index: number) => void;
  deleteMediaGroup: (id: string) => Promise<void>;
  updatePrompt: (id: string, newPrompt: string) => Promise<void>;
}

const MediaContext = createContext<MediaContextType | undefined>(undefined);

const API_URL = 'https://your-worker.workers.dev';

export function MediaProvider({ children }: { children: ReactNode }) {
  const [mediaGroups, setMediaGroups] = useState<MediaGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 從 API 加載媒體組
  useEffect(() => {
    const loadMediaGroups = async () => {
      try {
        const response = await fetch(`${API_URL}/api/media-groups`);
        const groups = await response.json();
        
        // 為每個組加載其文件
        const groupsWithFiles = await Promise.all(
          groups.map(async (group: any) => {
            const filesResponse = await fetch(`${API_URL}/api/media-groups/${group.id}/items`);
            const files = await filesResponse.json();
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

  const addMediaGroup = async (files: MediaFile[], prompt: string, aiModel?: string) => {
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

      const { id } = await response.json();
      
      // 重新加載媒體組列表
      const groupResponse = await fetch(`${API_URL}/api/media-groups`);
      const groups = await groupResponse.json();
      setMediaGroups(groups);
      
    } catch (error) {
      console.error('Failed to add media group:', error);
      throw error;
    }
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
      await fetch(`${API_URL}/api/media-groups/${id}`, {
        method: 'DELETE',
      });

      setMediaGroups(prev => prev.filter(group => group.id !== id));
    } catch (error) {
      console.error('Failed to delete media group:', error);
      throw error;
    }
  };

  const updatePrompt = async (id: string, newPrompt: string) => {
    try {
      await fetch(`${API_URL}/api/media-groups/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: newPrompt }),
      });

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
      addMediaGroup,
      toggleGroupExpansion,
      deleteMediaGroup,
      updatePrompt,
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