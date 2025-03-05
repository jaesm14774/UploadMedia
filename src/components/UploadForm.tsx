import React, { useState, ChangeEvent } from 'react';
import { useMedia } from '../context/MediaContext';
import { X } from 'lucide-react';
import '../styles/UploadForm.css';

interface FileWithPreview extends File {
  preview?: string;
}

interface FileGroup {
  files: any[];
  coverImage: string | ArrayBuffer | null;
  prompt: string;
  timestamp: number;
  isExpanded: boolean;
  aiModel?: string;
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

const UploadForm = () => {
  const { fileGroups, addFileGroup, toggleGroupExpansion, deleteFileGroup, updatePrompt, deleteFile } = useMedia();
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [pendingFiles, setPendingFiles] = useState<FileWithPreview[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAiModel, setSelectedAiModel] = useState<string>('');
  const [customAiModel, setCustomAiModel] = useState<string>('');
  const [editingPrompt, setEditingPrompt] = useState<{index: number, prompt: string} | null>(null);
  const itemsPerPage = 9;

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files).map(file => {
        const preview = URL.createObjectURL(file);
        return Object.assign(file, { preview });
      });
      setPendingFiles(prev => [...prev, ...files]);
    }
  };

  const handleRemovePendingFile = (index: number) => {
    setPendingFiles(prev => {
      const file = prev[index];
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSave = async () => {
    if (pendingFiles.length > 0) {
      // 随机选择一个文件作为封面
      const coverIndex = Math.floor(Math.random() * pendingFiles.length);
      const coverFile = pendingFiles[coverIndex];
      
      // 将所有文件转换为Base64
      const processedFiles = await Promise.all(pendingFiles.map(async (file) => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({
              name: file.name,
              type: file.type,
              data: reader.result,
              preview: file.preview
            });
          };
          reader.readAsDataURL(file);
        });
      }));

      // 确定使用哪个AI模型
      let aiModel = selectedAiModel;
      if (selectedAiModel === 'custom' && customAiModel.trim()) {
        aiModel = customAiModel.trim();
      }

      const newGroup: FileGroup = {
        files: processedFiles,
        coverImage: await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(coverFile);
        }),
        prompt: currentPrompt.trim(),
        timestamp: Date.now(),
        isExpanded: false,
        aiModel: aiModel || undefined
      };
      
      addFileGroup(newGroup);
      
      // 清理 URL objects
      pendingFiles.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
      
      setPendingFiles([]);
      setCurrentPrompt('');
      setSelectedAiModel('');
      setCustomAiModel('');
    }
  };

  const totalPages = Math.ceil(fileGroups.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedGroups = fileGroups.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="upload-container">
      <div className="upload-section bg-white p-6 rounded-lg shadow-lg mb-8">
        <div className="preview-grid">
          {pendingFiles.map((file, index) => (
            <div key={index} className="preview-item">
              {file.type?.startsWith('image/') ? (
                <img src={file.preview || URL.createObjectURL(file)} alt={`Preview ${index}`} />
              ) : (
                <video src={file.preview || URL.createObjectURL(file)} controls />
              )}
              <button
                className="remove-button"
                onClick={() => handleRemovePendingFile(index)}
              >
                <X size={16} />
              </button>
            </div>
          ))}
          <label className="upload-trigger">
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="upload-placeholder">
              <span className="text-2xl">+</span>
              <span className="text-sm mt-2">Add Media</span>
            </div>
          </label>
        </div>

        <textarea 
          value={currentPrompt}
          onChange={(e) => setCurrentPrompt(e.target.value)}
          placeholder="Add a description for your media..."
          className="w-full mt-6 mb-4 p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
        />
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">AI Model (Optional)</label>
          <div className="grid grid-cols-5 gap-2 mb-2">
            {AI_MODELS.map((model, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setSelectedAiModel(model.name)}
                className={`flex items-center justify-center p-2 rounded-md border ${selectedAiModel === model.name ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
              >
                <span className="mr-1">{model.icon}</span>
                <span className="text-xs">{model.name}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center mt-2">
            <button
              type="button"
              onClick={() => setSelectedAiModel('custom')}
              className={`flex items-center justify-center p-2 rounded-md border mr-2 ${selectedAiModel === 'custom' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
            >
              <span className="text-xs">Custom</span>
            </button>
            <input
              type="text"
              value={customAiModel}
              onChange={(e) => setCustomAiModel(e.target.value)}
              placeholder="Enter custom AI model name"
              className="flex-1 p-2 border rounded-md"
              disabled={selectedAiModel !== 'custom'}
            />
          </div>
        </div>
        
        <button 
          onClick={handleSave}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!pendingFiles.length}
        >
          Save
        </button>
      </div>

      <div className="gallery-grid">
        {displayedGroups.map((group, index) => (
          <div key={group.timestamp} className="gallery-item">
            <div 
              className="gallery-content"
              onClick={() => toggleGroupExpansion(index)}
            >
              <img src={typeof group.coverImage === 'string' ? group.coverImage : group.files[0]?.data as string} alt="Cover" className="gallery-image" />
              <div className="gallery-overlay">
                <p className="gallery-prompt">{group.prompt || "No description"}</p>
                <div className="flex justify-between items-center">
                  <span className="gallery-count">{group.files.length} items</span>
                  {group.aiModel && (
                    <span className="gallery-ai-model">
                      {AI_MODELS.find(m => m.name === group.aiModel)?.icon || '🤖'} {group.aiModel}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {group.isExpanded && (
              <div className="expanded-view">
                <div className="expanded-header">
                  <button 
                    className="close-expanded-view"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleGroupExpansion(index + startIndex);
                      setEditingPrompt(null);
                    }}
                  >
                    <X size={24} />
                  </button>
                  
                  <div className="expanded-controls">
                    <button 
                      className="delete-group-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('Are you sure you want to delete this entire group?')) {
                          deleteFileGroup(index + startIndex);
                        }
                      }}
                      title="Delete group"
                    >
                      Delete Group
                    </button>
                  </div>
                </div>
                
                <div className="expanded-prompt-section">
                  {editingPrompt !== null && editingPrompt.index === (index + startIndex) ? (
                    <div className="edit-prompt-container">
                      <textarea
                        value={editingPrompt.prompt}
                        onChange={(e) => setEditingPrompt({...editingPrompt, prompt: e.target.value})}
                        className="edit-prompt-textarea"
                        rows={3}
                      />
                      <div className="edit-prompt-buttons">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingPrompt(null);
                          }}
                          className="cancel-button"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            updatePrompt(editingPrompt.index, editingPrompt.prompt);
                            setEditingPrompt(null);
                          }}
                          className="save-button"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="prompt-display" onClick={(e) => e.stopPropagation()}>
                      <p className="prompt-text">{group.prompt || "No description"}</p>
                      <button 
                        className="edit-prompt-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingPrompt({index: index + startIndex, prompt: group.prompt});
                        }}
                      >
                        Edit Description
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="expanded-grid">
                  {group.files.map((file, fileIndex) => (
                    <div key={fileIndex} className="expanded-item">
                      {file.type?.startsWith('image/') ? (
                        <img src={file.data as string} alt={`File ${fileIndex}`} />
                      ) : (
                        <video src={file.data as string} controls />
                      )}
                      <div className="expanded-item-controls">
                        <a 
                          href={file.data as string}
                          download={file.name}
                          className="download-button"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Download
                        </a>
                        <button 
                          className="delete-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Are you sure you want to delete this file?')) {
                              deleteFile(index + startIndex, fileIndex);
                            }
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => setCurrentPage(i + 1)}
              className={`pagination-button ${currentPage === i + 1 ? 'active' : ''}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default UploadForm;