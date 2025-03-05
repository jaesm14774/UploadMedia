import { Database, Image, Video } from 'lucide-react';
import MediaGallery from './components/MediaGallery';
import UploadForm from './components/UploadForm';
import { MediaProvider } from './context/MediaContext';

function App() {
  return (
    <MediaProvider>
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Media Gallery</h1>
            <p className="text-gray-600">Upload and manage your media files with AI-generated prompts</p>
          </header>
          
          <div className="space-y-8">
            <UploadForm />
            <MediaGallery />
          </div>
        </div>
      </div>
    </MediaProvider>
  );
}

export default App;