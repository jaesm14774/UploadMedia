import React, { createContext, useState, useContext, ReactNode } from 'react';

interface ProcessedFile {
  name: string;
  type: string;
  data: string | ArrayBuffer | null;
  preview?: string;
}

interface FileGroup {
  files: ProcessedFile[];
  coverImage: string | ArrayBuffer | null;
  prompt: string;
  timestamp: number;
  isExpanded: boolean;
}

interface MediaContextType {
  fileGroups: FileGroup[];
  addFileGroup: (group: FileGroup) => void;
  toggleGroupExpansion: (index: number) => void;
}

const MediaContext = createContext<MediaContextType | undefined>(undefined);

export function MediaProvider({ children }: { children: ReactNode }) {
  const [fileGroups, setFileGroups] = useState<FileGroup[]>(() => {
    const saved = localStorage.getItem('fileGroups');
    return saved ? JSON.parse(saved) : [];
  });

  const addFileGroup = (group: FileGroup) => {
    setFileGroups(prev => {
      const newGroups = [...prev, group];
      localStorage.setItem('fileGroups', JSON.stringify(newGroups));
      return newGroups;
    });
  };

  const toggleGroupExpansion = (index: number) => {
    setFileGroups(prev => {
      const newGroups = [...prev];
      newGroups[index].isExpanded = !newGroups[index].isExpanded;
      return newGroups;
    });
  };

  return (
    <MediaContext.Provider value={{ fileGroups, addFileGroup, toggleGroupExpansion }}>
      {children}
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