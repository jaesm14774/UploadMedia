import React, { useState } from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { useMedia } from '../context/MediaContext';
import { MediaItem } from '../types';

const MediaGallery: React.FC = () => {
  const { mediaItems, updatePrompt, deleteMediaItem } = useMedia();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState('');

  const handleEdit = (item: MediaItem) => {
    setEditingId(item.id);
    setEditPrompt(item.prompt);
  };

  const handleSave = (id: string) => {
    updatePrompt(id, editPrompt);
    setEditingId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (mediaItems.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Your Gallery</h2>
        <p className="text-gray-500">No media items yet. Upload some to get started!</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">Your Gallery</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {mediaItems.map(item => (
          <div key={item.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
              {item.type === 'image' ? (
                <img 
                  src={item.url} 
                  alt={`Media ${item.id}`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <video 
                  src={item.url} 
                  controls
                  className="w-full h-full object-contain"
                />
              )}
            </div>
            
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-gray-500">
                  {formatDate(item.createdAt)}
                </span>
                <div className="flex space-x-2">
                  {editingId !== item.id && (
                    <>
                      <button 
                        onClick={() => handleEdit(item)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit prompt"
                      >
                        <Pencil size={18} />
                      </button>
                      <button 
                        onClick={() => deleteMediaItem(item.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete item"
                      >
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              {editingId === item.id ? (
                <div>
                  <textarea
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                    rows={3}
                  />
                  <div className="flex justify-end space-x-2">
                    <button 
                      onClick={handleCancel}
                      className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"
                      title="Cancel"
                    >
                      <X size={16} />
                    </button>
                    <button 
                      onClick={() => handleSave(item.id)}
                      className="p-1 rounded-full bg-green-200 hover:bg-green-300"
                      title="Save"
                    >
                      <Check size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-700 whitespace-pre-wrap">
                  {item.prompt || <span className="text-gray-400 italic">No prompt provided</span>}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MediaGallery;