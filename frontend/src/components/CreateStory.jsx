// frontend/src/components/CreateStory.jsx
import React, { useState } from 'react';
import { 
  XMarkIcon, 
  PhotoIcon, 
  PaintBrushIcon,
  CheckIcon 
} from '@heroicons/react/24/outline';
import api from '../api/config';
import ImageUpload from './ImageUpload';

const gradientBackgrounds = [
  { name: 'Blue Ocean', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { name: 'Sunset', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { name: 'Forest', value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { name: 'Lavender', value: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  { name: 'Fire', value: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { name: 'Night', value: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
  { name: 'Royal', value: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' },
  { name: 'Space', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }
];

export default function CreateStory({ isOpen, onClose, onStoryCreated }) {
  const [storyType, setStoryType] = useState('text');
  const [textContent, setTextContent] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedBackground, setSelectedBackground] = useState(gradientBackgrounds[0].value);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (storyType === 'text' && !textContent.trim()) {
      setError('Please add some text content');
      return;
    }

    if (storyType === 'image' && !selectedImage) {
      setError('Please select an image');
      return;
    }

    if (storyType === 'text' && textContent.length > 200) {
      setError('Text must be less than 200 characters');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      let imageUrl = null;
      
      // Upload image if it's an image story
      if (storyType === 'image' && selectedImage) {
        console.log('Uploading image for story:', selectedImage.name);
        
        const formData = new FormData();
        formData.append('image', selectedImage.file);
        
        const imageResponse = await api.post('/api/upload/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        imageUrl = imageResponse.data.imageUrl;
        console.log('Image uploaded successfully:', imageUrl);
      }

      // Create story data
      const storyData = {
        type: storyType,
        backgroundColor: selectedBackground
      };

      if (storyType === 'text') {
        storyData.text = textContent.trim();
        console.log('Creating text story:', storyData);
      } else {
        storyData.image = imageUrl;
        console.log('Creating image story:', storyData);
      }

      const response = await api.post('/api/stories', storyData);
      console.log('Story created successfully:', response.data);
      
      if (onStoryCreated) {
        onStoryCreated(response.data.story);
      }
      
      handleClose();
    } catch (err) {
      console.error('Error creating story:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to create story. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTextContent('');
    setSelectedImage(null);
    setSelectedBackground(gradientBackgrounds[0].value);
    setStoryType('text');
    setError('');
    onClose();
  };

  const handleImageSelect = (imageData) => {
    setSelectedImage(imageData);
    setStoryType('image');
  };

  const handleImageRemove = () => {
    setSelectedImage(null);
    setStoryType('text');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Create Story</h2>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Story Type Selector */}
          <div className="flex gap-2">
            <button
              onClick={() => setStoryType('text')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium transition-colors ${
                storyType === 'text'
                  ? 'bg-blue-100 text-blue-600 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <PaintBrushIcon className="w-5 h-5" />
              Text
            </button>
            <button
              onClick={() => setStoryType('image')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium transition-colors ${
                storyType === 'image'
                  ? 'bg-blue-100 text-blue-600 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <PhotoIcon className="w-5 h-5" />
              Photo
            </button>
          </div>

          {/* Text Story */}
          {storyType === 'text' && (
            <div className="space-y-4">
              {/* Preview */}
              <div 
                className="relative h-64 rounded-lg flex items-center justify-center p-4 text-white"
                style={{ background: selectedBackground }}
              >
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="What's on your mind?"
                  className="w-full h-full bg-transparent text-white placeholder-white/70 text-xl font-medium text-center resize-none focus:outline-none"
                  maxLength={200}
                />
                <div className="absolute bottom-2 right-2 text-white/70 text-xs">
                  {textContent.length}/200
                </div>
              </div>

              {/* Background Selector */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Choose Background</p>
                <div className="grid grid-cols-4 gap-2">
                  {gradientBackgrounds.map((bg, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedBackground(bg.value)}
                      className={`relative h-12 rounded-lg border-2 transition-all ${
                        selectedBackground === bg.value
                          ? 'border-blue-500 scale-105'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      style={{ background: bg.value }}
                    >
                      {selectedBackground === bg.value && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <CheckIcon className="w-4 h-4 text-white drop-shadow-md" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Debug info for text stories */}
              <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
                Debug: Text length: {textContent.length}, Type: {storyType}
              </div>
            </div>
          )}

          {/* Image Story */}
          {storyType === 'image' && (
            <div className="space-y-4">
              {selectedImage ? (
                <div className="relative">
                  <img
                    src={selectedImage.preview}
                    alt="Story preview"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <button
                    onClick={handleImageRemove}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="h-64">
                  <ImageUpload
                    onImageSelect={handleImageSelect}
                    onImageRemove={handleImageRemove}
                    selectedImage={selectedImage}
                  />
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || (storyType === 'text' && !textContent.trim()) || (storyType === 'image' && !selectedImage)}
            className={`flex-1 py-3 px-4 rounded-lg font-medium text-white transition-colors ${
              isSubmitting || (storyType === 'text' && !textContent.trim()) || (storyType === 'image' && !selectedImage)
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {isSubmitting ? 'Sharing...' : 'Share Story'}
          </button>
        </div>
      </div>
    </div>
  );
}