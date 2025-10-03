import React, { useState, useEffect } from 'react';
import { PlusIcon, EyeIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import api from '../api/config';
import StoryViewer from './StoryViewer';
import CreateStory from './CreateStory';

export default function Stories() {
  const { user } = useAuth();
  const [storyGroups, setStoryGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStoryGroup, setSelectedStoryGroup] = useState(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [showCreateStory, setShowCreateStory] = useState(false);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/stories');
      setStoryGroups(response.data.storyGroups || []);
    } catch (err) {
      console.error('Error fetching stories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStoryGroupClick = async (storyGroup, groupIndex) => {
    setSelectedStoryGroup(storyGroup);
    setCurrentStoryIndex(0);
    
    // Mark first story as viewed
    if (storyGroup.stories[0] && !storyGroup.stories[0].hasViewed) {
      await viewStory(storyGroup.stories[0]._id);
    }
  };

  const viewStory = async (storyId) => {
    try {
      await api.post(`/api/stories/${storyId}/view`);
    } catch (err) {
      console.error('Error viewing story:', err);
    }
  };

  const handleStoryCreated = (newStory) => {
    // Add new story to current user's group or create new group
    setStoryGroups(prev => {
      const userGroupIndex = prev.findIndex(group => 
        group.user._id === user.id
      );
      
      if (userGroupIndex >= 0) {
        // Update existing group
        const newGroups = [...prev];
        newGroups[userGroupIndex].stories.unshift(newStory);
        return newGroups;
      } else {
        // Create new group for user
        const newGroup = {
          user: { _id: user.id, username: user.username, avatar: user.avatar },
          stories: [newStory],
          hasUnviewed: false
        };
        return [newGroup, ...prev];
      }
    });
    
    setShowCreateStory(false);
  };

  const nextStory = async () => {
    if (selectedStoryGroup && currentStoryIndex < selectedStoryGroup.stories.length - 1) {
      const nextIndex = currentStoryIndex + 1;
      setCurrentStoryIndex(nextIndex);
      
      const nextStory = selectedStoryGroup.stories[nextIndex];
      if (!nextStory.hasViewed) {
        await viewStory(nextStory._id);
      }
    } else {
      closeStoryViewer();
    }
  };

  const previousStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    }
  };

  const closeStoryViewer = () => {
    setSelectedStoryGroup(null);
    setCurrentStoryIndex(0);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex space-x-4 overflow-x-auto">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex-shrink-0 animate-pulse">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="w-12 h-3 bg-gray-200 dark:bg-gray-700 rounded mt-2 mx-auto"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex space-x-4 overflow-x-auto scrollbar-hide">
          {/* Add Story Button */}
          <div className="flex-shrink-0 text-center">
            <button
              onClick={() => setShowCreateStory(true)}
              className="relative w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-3 border-white dark:border-gray-800 hover:scale-105 transition-transform shadow-lg"
            >
              <PlusIcon className="w-8 h-8 text-white" />
            </button>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate w-16">Your Story</p>
          </div>

          {/* Story Groups */}
          {storyGroups.map((storyGroup, groupIndex) => (
            <div key={storyGroup.user._id} className="flex-shrink-0 text-center">
              <button
                onClick={() => handleStoryGroupClick(storyGroup, groupIndex)}
                className="relative w-16 h-16 rounded-full overflow-hidden p-0.5 hover:scale-105 transition-transform"
                style={{
                  background: storyGroup.hasUnviewed 
                    ? 'linear-gradient(45deg, #f59e0b, #ef4444, #8b5cf6)' 
                    : '#d1d5db'
                }}
              >
                <div className="w-full h-full rounded-full overflow-hidden bg-white dark:bg-gray-800 p-0.5">
                  <div className="w-full h-full rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                    {storyGroup.user.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </div>
              </button>
              
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate w-16">
                {storyGroup.user._id === user?.id ? 'You' : storyGroup.user.username}
              </p>
            </div>
          ))}

          {/* Empty State */}
          {storyGroups.length === 0 && (
            <div className="flex-1 text-center py-8 text-gray-500 dark:text-gray-400">
              <div className="max-w-sm mx-auto">
                <EyeIcon className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                <p className="text-sm font-medium mb-1">No stories yet</p>
                <p className="text-xs">Be the first to share a story!</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Story Viewer */}
      {selectedStoryGroup && (
        <StoryViewer
          storyGroup={selectedStoryGroup}
          currentIndex={currentStoryIndex}
          onNext={nextStory}
          onPrevious={previousStory}
          onClose={closeStoryViewer}
          totalGroups={storyGroups.length}
        />
      )}

      {/* Create Story Modal */}
      {showCreateStory && (
        <CreateStory
          onClose={() => setShowCreateStory(false)}
          onStoryCreated={handleStoryCreated}
        />
      )}
    </>
  );
}