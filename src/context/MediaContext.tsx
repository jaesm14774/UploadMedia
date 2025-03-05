import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

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
  deleteFileGroup: (index: number) => void;
  updatePrompt: (index: number, newPrompt: string) => void;
  deleteFile: (groupIndex: number, fileIndex: number) => void;
}

const MediaContext = createContext<MediaContextType | undefined>(undefined);

// IndexedDB database name and store name
const DB_NAME = 'mediaDatabase';
const STORE_NAME = 'fileGroups';
const DB_VERSION = 1;

// Function to open IndexedDB connection
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'timestamp' });
      }
    };
  });
};

// Function to get all file groups from IndexedDB
const getAllFileGroups = async (): Promise<FileGroup[]> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  } catch (error) {
    console.error('Error getting file groups from IndexedDB:', error);
    return [];
  }
};

// Function to add a file group to IndexedDB
const addFileGroupToDB = async (group: FileGroup): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(group);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error('Error adding file group to IndexedDB:', error);
  }
};

// Function to update a file group in IndexedDB
const updateFileGroupInDB = async (group: FileGroup): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(group);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error('Error updating file group in IndexedDB:', error);
  }
};

// Function to delete a file group from IndexedDB
const deleteFileGroupFromDB = async (timestamp: number): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(timestamp);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error('Error deleting file group from IndexedDB:', error);
  }
};

export function MediaProvider({ children }: { children: ReactNode }) {
  const [fileGroups, setFileGroups] = useState<FileGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load file groups from IndexedDB when component mounts
  useEffect(() => {
    const loadFileGroups = async () => {
      try {
        const groups = await getAllFileGroups();
        setFileGroups(groups);
      } catch (error) {
        console.error('Failed to load file groups:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFileGroups();
  }, []);

  const addFileGroup = async (group: FileGroup) => {
    try {
      await addFileGroupToDB(group);
      setFileGroups(prev => [...prev, group]);
    } catch (error) {
      console.error('Failed to add file group:', error);
    }
  };

  const toggleGroupExpansion = async (index: number) => {
    try {
      const newGroups = [...fileGroups];
      newGroups[index].isExpanded = !newGroups[index].isExpanded;
      
      // Update the group in IndexedDB
      await updateFileGroupInDB(newGroups[index]);
      
      setFileGroups(newGroups);
    } catch (error) {
      console.error('Failed to toggle group expansion:', error);
    }
  };

  const deleteFileGroup = async (index: number) => {
    try {
      const groupToDelete = fileGroups[index];
      await deleteFileGroupFromDB(groupToDelete.timestamp);
      
      setFileGroups(prev => prev.filter((_, i) => i !== index));
    } catch (error) {
      console.error('Failed to delete file group:', error);
    }
  };

  const updatePrompt = async (index: number, newPrompt: string) => {
    try {
      const newGroups = [...fileGroups];
      newGroups[index].prompt = newPrompt.trim();
      
      // Update the group in IndexedDB
      await updateFileGroupInDB(newGroups[index]);
      
      setFileGroups(newGroups);
    } catch (error) {
      console.error('Failed to update prompt:', error);
    }
  };

  const deleteFile = async (groupIndex: number, fileIndex: number) => {
    try {
      const newGroups = [...fileGroups];
      const group = newGroups[groupIndex];
      
      // Remove the file from the group
      group.files = group.files.filter((_, i) => i !== fileIndex);
      
      // If there are no more files in the group, delete the entire group
      if (group.files.length === 0) {
        await deleteFileGroupFromDB(group.timestamp);
        setFileGroups(prev => prev.filter((_, i) => i !== groupIndex));
        return;
      }
      
      // If the deleted file was the cover image, set a new cover image
      if (group.files.length > 0) {
        const newCoverIndex = 0; // Use the first file as the new cover
        const newCoverFile = group.files[newCoverIndex];
        group.coverImage = newCoverFile.data;
      }
      
      // Update the group in IndexedDB
      await updateFileGroupInDB(group);
      
      setFileGroups(newGroups);
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  };

  return (
    <MediaContext.Provider value={{ 
      fileGroups, 
      addFileGroup, 
      toggleGroupExpansion,
      deleteFileGroup,
      updatePrompt,
      deleteFile
    }}>
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