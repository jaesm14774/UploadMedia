import React from 'react';
import { Database, Image, Video } from 'lucide-react';
import { MediaProvider } from './context/MediaContext';
import UploadForm from './components/UploadForm';

function App() {
  return (
    <MediaProvider>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Database className="h-8 w-8 text-blue-600 mr-2" />
                <h1 className="text-2xl font-bold text-gray-900">Media Prompt Gallery</h1>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <Image size={20} />
                <span>+</span>
                <Video size={20} />
                <span>+</span>
                <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">prompt</span>
              </div>
            </div>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <UploadForm />
        </main>
        
        <footer className="bg-white border-t mt-12 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-gray-500 text-sm">
              Media Prompt Gallery - Store your media with their prompts
            </p>
          </div>
        </footer>
      </div>
    </MediaProvider>
  );
}

export default App;