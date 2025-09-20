import React, { useState, useEffect } from 'react';
import { PlusIcon, PlayIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import api from '../api/config';

export default function Stories() {
  const { user } = useAuth();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/stories');
      setStories(response.data.stories || []);
    } catch (err) {
      console.error('Error fetching stories:', err);
    } finally {
      setLoading(false);
    }
  };

  const createStory = () => {
    // This would open a story creation modal/page
    console.log('Create story clicked');
  };

  const viewStory = (story, index) => {
    setSelectedStory(story);
    setCurrentStoryIndex(index);
  };

  const nextStory = () => {
    if (currentStoryIndex < stories.length - 1) {
      const nextIndex = currentStoryIndex + 1;
      setCurrentStoryIndex(nextIndex);
      setSelectedStory(stories[nextIndex]);
    } else {
      setSelectedStory(null);
    }
  };

  const previousStory = () => {
    if (currentStoryIndex > 0) {
      const prevIndex = currentStoryIndex - 1;
      setCurrentStoryIndex(prevIndex);
      setSelectedStory(stories[prevIndex]);
    }
  };

  const closeStoryViewer = () => {
    setSelectedStory(null);
  };

  if (loading) {
    return (
      <div className="flex space-x-4 p-4 overflow-x-auto">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex-shrink-0">
            <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="w-12 h-3 bg-gray-200 rounded mt-2 mx-auto animate-pulse"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex space-x-4 overflow-x-auto scrollbar-hide">
          {/* Add Story Button */}
          <div className="flex-shrink-0 text-center">
            <button
              onClick={createStory}
              className="relative w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors group"
            >
              <PlusIcon className="w-8 h-8 text-gray-400 group-hover:text-blue-500" />
            </button>
            <p className="text-xs text-gray-600 mt-1 truncate w-16">Your Story</p>
          </div>

          {/* Existing Stories */}
          {stories.map((story, index) => (
            <div key={story._id} className="flex-shrink-0 text-center">
              <button
                onClick={() => viewStory(story, index)}
                className="relative w-16 h-16 rounded-full overflow-hidden border-3 border-gradient-to-r from-pink-500 via-red-500 to-yellow-500 p-[2px] hover:scale-105 transition-transform"
              >
                <div className="w-full h-full rounded-full overflow-hidden bg-white p-[2px]">
                  {story.user?.avatar ? (
                    <img
                      src={story.user.avatar}
                      alt={story.user.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                      {story.user?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                
                {/* Unviewed indicator */}
                {!story.viewed && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>
                )}
              </button>
              <p className="text-xs text-gray-600 mt-1 truncate w-16">
                {story.user?.username || 'Unknown'}
              </p>
            </div>
          ))}

          {/* Empty state */}
          {stories.length === 0 && (
            <div className="flex-1 text-center py-8 text-gray-500">
              <p className="text-sm">No stories available</p>
              <p className="text-xs mt-1">Be the first to share a story!</p>
            </div>
          )}
        </div>
      </div>

      {/* Story Viewer Modal */}
      {selectedStory && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          {/* Story Progress Bar */}
          <div className="absolute top-4 left-4 right-4 flex space-x-1 z-10">
            {stories.map((_, index) => (
              <div
                key={index}
                className={`flex-1 h-1 rounded-full ${
                  index < currentStoryIndex
                    ? 'bg-white'
                    : index === currentStoryIndex
                    ? 'bg-white'
                    : 'bg-white/30'
                }`}
              >
                {index === currentStoryIndex && (
                  <div className="h-full bg-white rounded-full animate-progress"></div>
                )}
              </div>
            ))}
          </div>

          {/* Story Header */}
          <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-10">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {selectedStory.user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <p className="text-white font-medium text-sm">
                  {selectedStory.user?.username || 'Unknown'}
                </p>
                <p className="text-white/70 text-xs">2h ago</p>
              </div>
            </div>
            
            <button
              onClick={closeStoryViewer}
              className="text-white/70 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Story Content */}
          <div className="relative w-full h-full flex items-center justify-center">
            {selectedStory.type === 'image' ? (
              <img
                src={selectedStory.content}
                alt="Story"
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 w-full h-full flex items-center justify-center">
                <p className="text-white text-2xl font-bold p-8 text-center">
                  {selectedStory.content}
                </p>
              </div>
            )}

            {/* Navigation Areas */}
            <button
              onClick={previousStory}
              className="absolute left-0 top-0 w-1/3 h-full z-10"
              style={{ background: 'transparent' }}
            />
            <button
              onClick={nextStory}
              className="absolute right-0 top-0 w-1/3 h-full z-10"
              style={{ background: 'transparent' }}
            />
          </div>

          {/* Story Actions */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center space-x-4 z-10">
            <input
              type="text"
              placeholder="Send message..."
              className="flex-1 bg-white/20 text-white placeholder-white/70 border border-white/30 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <button className="text-white/70 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
            <button className="text-white/70 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}