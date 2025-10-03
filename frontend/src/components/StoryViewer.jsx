// frontend/src/components/StoryViewer.jsx
import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  HeartIcon,
  PaperAirplaneIcon,
  EllipsisHorizontalIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import api from '../api/config';

export default function StoryViewer({ 
  isOpen, 
  onClose, 
  storyGroups = [], 
  initialGroupIndex = 0, 
  initialStoryIndex = 0,
  onStoryDelete
}) {
  const { user } = useAuth();
  const [currentGroupIndex, setCurrentGroupIndex] = useState(initialGroupIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [message, setMessage] = useState('');

  const currentGroup = storyGroups[currentGroupIndex] || {};
  const currentStories = currentGroup.stories || [];
  const currentStory = currentStories[currentStoryIndex];
  const isOwnStory = currentStory?.user?._id === user?.id;

  if (!isOpen || !currentStory) return null;

  // Auto-progress effect
  useEffect(() => {
    if (!isOpen || !currentStory || isPaused) return;

    const duration = 5000;
    const interval = 50;
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += interval;
      const progressPercent = (elapsed / duration) * 100;
      setProgress(progressPercent);

      if (elapsed >= duration) handleNextStory();
    }, interval);

    return () => clearInterval(timer);
  }, [isOpen, currentStory, isPaused, currentGroupIndex, currentStoryIndex]);

  // Mark story as viewed
  useEffect(() => {
    if (currentStory && !isOwnStory && !currentStory.hasViewed) {
      markStoryAsViewed(currentStory._id);
    }
  }, [currentStory]);

  const markStoryAsViewed = async (storyId) => {
    try {
      await api.post(`/stories/${storyId}/view`);
    } catch (err) {
      console.error('Error marking story as viewed:', err);
    }
  };

  const handleNextStory = () => {
    if (!currentStories.length) return;

    if (currentStoryIndex < currentStories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
      setProgress(0);
    } else if (currentGroupIndex < storyGroups.length - 1) {
      setCurrentGroupIndex(prev => prev + 1);
      setCurrentStoryIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePreviousStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
      setProgress(0);
    } else if (currentGroupIndex > 0) {
      const prevGroupIndex = currentGroupIndex - 1;
      const prevGroupStories = storyGroups[prevGroupIndex]?.stories || [];
      setCurrentGroupIndex(prevGroupIndex);
      setCurrentStoryIndex(prevGroupStories.length - 1);
      setProgress(0);
    }
  };

  const handleDeleteStory = async () => {
    if (!currentStory || !isOwnStory) return;
    if (!window.confirm('Are you sure you want to delete this story?')) return;

    try {
      await api.delete(`/stories/${currentStory._id}`);
      if (onStoryDelete) onStoryDelete(currentStory._id);
      handleNextStory();
    } catch (err) {
      console.error('Error deleting story:', err);
      alert('Failed to delete story');
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isOwnStory) return;
    console.log('Send message:', message, 'to:', currentStory.user?.username);
    setMessage('');
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'now';
    if (diffInHours < 24) return `${diffInHours}h`;
    return `${Math.floor(diffInHours / 24)}d`;
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Progress bars */}
      <div className="absolute top-4 left-4 right-4 flex gap-1 z-20">
        {currentStories.map((_, index) => (
          <div key={index} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-100 ease-linear"
              style={{
                width: index < currentStoryIndex ? '100%' :
                       index === currentStoryIndex ? `${progress}%` : '0%'
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
            {currentStory.user?.username?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <p className="text-white font-medium text-sm">{currentStory.user?.username || 'Unknown User'}</p>
            <p className="text-white/70 text-xs">{formatTimeAgo(currentStory.createdAt)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isOwnStory && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              >
                <EllipsisHorizontalIcon className="w-5 h-5" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg py-2 min-w-40 z-30">
                  <button className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <EyeIcon className="w-4 h-4" />
                    View Insights
                  </button>
                  <button
                    onClick={handleDeleteStory}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <TrashIcon className="w-4 h-4" />
                    Delete Story
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Story Content */}
      <div className="relative w-full h-full flex items-center justify-center">
        {currentStory.content?.type === 'image' ? (
          <img
            src={currentStory.content.image}
            alt="Story"
            className="max-w-full max-h-full object-contain"
            onError={(e) => { e.target.src = '/placeholder-image.png'; }}
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center p-8"
            style={{ background: currentStory.content?.backgroundColor || '#667eea' }}
          >
            <p className="text-white text-2xl font-bold text-center max-w-lg">
              {currentStory.content?.text || 'No content'}
            </p>
          </div>
        )}

        {/* Navigation areas */}
        <button
          onClick={handlePreviousStory}
          className="absolute left-0 top-0 w-1/3 h-full z-10 bg-transparent"
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onMouseLeave={() => setIsPaused(false)}
        ></button>

        <button
          onClick={handleNextStory}
          className="absolute right-0 top-0 w-1/3 h-full z-10 bg-transparent"
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onMouseLeave={() => setIsPaused(false)}
        ></button>

        {isPaused && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black/50 rounded-full p-4">
              <div className="w-8 h-8 border-l-4 border-r-4 border-white rounded-sm" />
            </div>
          </div>
        )}
      </div>

      {/* Bottom actions */}
      {!isOwnStory && (
        <div className="absolute bottom-4 left-4 right-4 z-20">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Send message..."
              className="flex-1 bg-white/20 backdrop-blur-sm text-white placeholder-white/70 border border-white/30 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-white/50"
              onKeyPress={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!message.trim()}
              className="p-2 text-white/80 hover:text-white disabled:text-white/40 transition-colors"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
            <button className="p-2 text-white/80 hover:text-white transition-colors">
              <HeartIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Navigation arrows */}
      {currentGroupIndex > 0 && (
        <button
          onClick={() => {
            setCurrentGroupIndex(prev => prev - 1);
            setCurrentStoryIndex(0);
            setProgress(0);
          }}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 text-white/80 hover:text-white bg-black/20 rounded-full hover:bg-black/40 transition-colors z-10"
        >
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
      )}
      
      {currentGroupIndex < storyGroups.length - 1 && (
        <button
          onClick={() => {
            setCurrentGroupIndex(prev => prev + 1);
            setCurrentStoryIndex(0);
            setProgress(0);
          }}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 text-white/80 hover:text-white bg-black/20 rounded-full hover:bg-black/40 transition-colors z-10"
        >
          <ChevronRightIcon className="w-6 h-6" />
        </button>
      )}

      {/* Click outside to close menu */}
      {showMenu && (
        <div
          className="absolute inset-0 z-10"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
}
