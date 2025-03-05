import React, { useState, ChangeEvent } from 'react';
import { useMedia } from '../context/MediaContext';
import { X } from 'lucide-react';
import '../styles/UploadForm.css';
import type { MediaItem } from '../worker';

interface FileWithPreview extends File {
  preview?: string;
}

interface FileGroup {
  id: string;
  files: MediaItem[];
  prompt: string;
  timestamp: number;
  isExpanded: boolean;
  aiModel?: string;
}

interface EditingPrompt {
  index: string;
  prompt: string;
}

const AI_MODELS = [
  { name: 'bing image creator', icon: '🖼️' },
  { name: 'ideogram', icon: '✍️' },
  { name: 'Midjourney', icon: '🎨' },
  { name: 'Runway', icon: '🎥' },
  { name: 'Flux', icon: '🌀' },
  { name: 'SD', icon: '🤖' },
  { name: 'pixelverse', icon: '🌌' },
  { name: 'kling', icon: '👾' },
  { name: 'luma', icon: '✨' },
  { name: 'wan2.1', icon: '🪐' }
];

const UploadForm: React.FC = () => {
  const { fileGroups, addFileGroup, deleteFileGroup, updatePrompt } = useMedia();
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [selectedAiModel, setSelectedAiModel] = useState<string>('');
  const [customAiModel, setCustomAiModel] = useState<string>('');
  const [editingPrompt, setEditingPrompt] = useState<EditingPrompt | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleFiles(Array.from(e.target.files));
    }
  };

  const createMediaItem = async (file: File): Promise<MediaItem> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve({
          id: crypto.randomUUID(),
          name: file.name,
          type: file.type,
          data: result,
          preview: result,
          prompt: '',
          timestamp: Date.now(),
          isGroup: false
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (files: File[]) => {
    const mediaFiles = await Promise.all(
      Array.from(files)
        .filter(file => file.type.startsWith('image/') || file.type.startsWith('video/'))
        .map(createMediaItem)
    );

    if (mediaFiles.length > 0) {
      const newGroup: FileGroup = {
        id: crypto.randomUUID(),
        files: mediaFiles,
        prompt: currentPrompt || '',
        timestamp: Date.now(),
        isExpanded: true,
        aiModel: selectedAiModel === 'custom' ? customAiModel : selectedAiModel
      };
      addFileGroup(newGroup);
    }
  };

  const handlePromptEdit = (groupId: string, currentPrompt: string) => {
    setEditingPrompt({
      index: groupId,
      prompt: currentPrompt || ''
    });
  };

  const handlePromptSave = () => {
    if (editingPrompt) {
      updatePrompt(editingPrompt.index, editingPrompt.prompt);
      setEditingPrompt(null);
    }
  };

  const handleDeleteGroup = (groupId: string) => {
    if (window.confirm('確定要刪除這個組嗎？')) {
      deleteFileGroup(groupId);
    }
  };

  const handleDeleteFile = (groupId: string, fileIndex: number) => {
    if (window.confirm('確定要刪除這個文件嗎？')) {
      const group = fileGroups.find(g => g.id === groupId);
      if (group) {
        const updatedGroup: FileGroup = {
          ...group,
          files: group.files.filter((_, index) => index !== fileIndex)
        };
        addFileGroup(updatedGroup);
        deleteFileGroup(groupId);
      }
    }
  };

  const displayedGroups = fileGroups;

  return (
    <div className="space-y-6">
      <div 
        className={`border-2 border-dashed rounded-lg p-8 text-center ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileInput}
          className="hidden"
          id="file-upload"
        />
        <label 
          htmlFor="file-upload"
          className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          選擇文件
        </label>
        <p className="mt-2 text-sm text-gray-600">或將文件拖放到此處</p>
        <p className="text-xs text-gray-500 mt-1">支持圖片和視頻文件</p>
      </div>

      {displayedGroups.map((group) => (
        <div key={group.id} className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              {editingPrompt?.index === group.id ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={editingPrompt.prompt}
                    onChange={(e) => setEditingPrompt({ ...editingPrompt, prompt: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="輸入提示詞..."
                  />
                  <button
                    onClick={handlePromptSave}
                    className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                  >
                    保存
                  </button>
                  <button
                    onClick={() => setEditingPrompt(null)}
                    className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  >
                    取消
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-medium text-gray-900 truncate">
                    {group.prompt || "未命名組"}
                  </h3>
                  <button
                    onClick={() => handlePromptEdit(group.id, group.prompt)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    編輯
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => handleDeleteGroup(group.id)}
              className="ml-4 text-gray-400 hover:text-gray-500"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {group.files.map((file, fileIndex) => (
              <div key={file.id} className="relative group">
                <div className="aspect-w-1 aspect-h-1 bg-gray-100 rounded-lg overflow-hidden">
                  {file.type.startsWith('image/') ? (
                    <img
                      src={file.data}
                      alt={file.name}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <video
                      src={file.data}
                      className="object-cover w-full h-full"
                      controls
                    />
                  )}
                </div>
                <button
                  onClick={() => handleDeleteFile(group.id, fileIndex)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default UploadForm;