// frontend/src/components/StoriesSection.jsx
import React, { useState, useEffect } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import api from '../api/config';
import CreateStory from './CreateStory';
import StoryViewer from './StoryViewer';
import LoadingSpinner from './LoadingSpinner';

export default function StoriesSection() {
  const { user } = useAuth();
  const [storyGroups, setStoryGroups] = useState([]);
  const [myStories, setMyStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewerModal, setShowViewerModal] = useState(false);
  const [viewerConfig, setViewerConfig] = useState({
    groupIndex: 0,
    storyIndex: 0
  });

  useEffect(() => {
    fetchStories();
    fetchMyStories();
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

  const fetchMyStories = async () => {
    try {
      const response = await api.get('/api/stories/my-stories');
      setMyStories(response.data.stories || []);
    } catch (err) {
      console.error('Error fetching my stories:', err);
    }
  };

  const handleStoryCreated = (newStory) => {
    setMyStories(prev => [newStory, ...prev]);
    fetchStories(); // Refresh the feed
  };

  const handleViewStory = (groupIndex, storyIndex = 0) => {
    setViewerConfig({ groupIndex, storyIndex });
    setShowViewerModal(true);
  };

  const handleViewMyStory = (storyIndex = 0) => {
    // Create a temporary story group for own stories
    const myStoryGroup = {
      user: { _id: user.id, username: user.username, avatar: user.avatar },
      stories: myStories,
      hasUnviewed: false
    };
    const allGroups = [myStoryGroup, ...storyGroups];
    setViewerConfig({ groupIndex: 0, storyIndex });
    setShowViewerModal(true);
  };

  const handleStoryDelete = (deletedStoryId) => {
    // Remove from my stories
    setMyStories(prev => prev.filter(story => story._id !== deletedStoryId));
    
    // Remove from story groups if needed
    setStoryGroups(prev => prev.map(group => ({
      ...group,
      stories: group.stories.filter(story => story._id !== deletedStoryId)
    })).filter(group => group.stories.length > 0));
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'now';
    if (diffInHours < 24) return `${diffInHours}h`;
    return `${Math.floor(diffInHours / 24)}d`;
  };

  // Combine my stories with others' stories for viewer
  const allStoryGroups = myStories.length > 0 
    ? [
        {
          user: { _id: user.id, username: user.username, avatar: user.avatar },
          stories: myStories,
          hasUnviewed: false
        },
        ...storyGroups
      ]
    : storyGroups;

  if (loading) {
    return (
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex space-x-4 overflow-x-auto">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex-shrink-0 animate-pulse">
              <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
              <div className="w-12 h-3 bg-gray-200 rounded mt-2 mx-auto"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white border-b border-gray-200 p-4 sticky top-16 z-40">
        <div className="flex space-x-4 overflow-x-auto scrollbar-hide">
          {/* Add Story Button */}
          <div className="flex-shrink-0 text-center">
            <button
              onClick={() => setShowCreateModal(true)}
              className="relative w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
            >
              <PlusIcon className="w-8 h-8 text-white" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center border-2 border-blue-500">
                <PlusIcon className="w-3 h-3 text-blue-500" />
              </div>
            </button>
            <p className="text-xs text-gray-600 mt-1 truncate w-16">Your Story</p>
          </div>

          {/* My Stories (if any) */}
          {myStories.length > 0 && (
            <div className="flex-shrink-0 text-center">
              <button
                onClick={() => handleViewMyStory(0)}
                className="relative w-16 h-16 rounded-full overflow-hidden border-3 border-blue-500 hover:scale-105 transition-transform"
              >
                {myStories[0]?.content?.type === 'image' ? (
                  <img
                    src={myStories[0].content.image}
                    alt="My story"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div 
                    className="w-full h-full flex items-center justify-center"
                    style={{ background: myStories[0]?.content?.backgroundColor || '#667eea' }}
                  >
                    <span className="text-white text-xs font-bold">
                      {myStories[0]?.content?.text?.charAt(0) || 'A'}
                    </span>
                  </div>
                )}
                
                {/* Story count badge */}
                {myStories.length > 1 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                    <span className="text-white text-xs font-bold">{myStories.length}</span>
                  </div>
                )}
              </button>
              <p className="text-xs text-gray-600 mt-1 truncate w-16">
                {formatTimeAgo(myStories[0]?.createdAt)}
              </p>
            </div>
          )}

          {/* Other Users' Stories */}
          {storyGroups.map((group, groupIndex) => (
            <div key={group.user._id} className="flex-shrink-0 text-center">
              <button
                onClick={() => handleViewStory(myStories.length > 0 ? groupIndex + 1 : groupIndex)}
                className={`relative w-16 h-16 rounded-full overflow-hidden border-3 hover:scale-105 transition-transform ${
                  group.hasUnviewed 
                    ? 'border-gradient-to-r from-pink-500 via-red-500 to-yellow-500' 
                    : 'border-gray-300'
                }`}
              >
                {/* Gradient border for unviewed stories */}
                {group.hasUnviewed && (
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 p-[3px]">
                    <div className="w-full h-full rounded-full bg-white p-[2px]">
                      <div className="w-full h-full rounded-full overflow-hidden">
                        {group.user?.avatar ? (
                          <img
                            src={group.user.avatar}
                            alt={group.user.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                            {group.user?.username?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Regular border for viewed stories */}
                {!group.hasUnviewed && (
                  <div className="w-full h-full rounded-full overflow-hidden">
                    {group.user?.avatar ? (
                      <img
                        src={group.user.avatar}
                        alt={group.user.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                        {group.user?.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Story count badge */}
                {group.storiesCount > 1 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                    <span className="text-white text-xs font-bold">{group.storiesCount}</span>
                  </div>
                )}
              </button>
              <p className="text-xs text-gray-600 mt-1 truncate w-16">
                {group.user?.username || 'Unknown'}
              </p>
            </div>
          ))}

          {/* Empty state */}
          {storyGroups.length === 0 && myStories.length === 0 && (
            <div className="flex-1 text-center py-4">
              <p className="text-sm text-gray-500">No stories available</p>
              <p className="text-xs text-gray-400 mt-1">Be the first to share a story!</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Story Modal */}
      <CreateStory
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onStoryCreated={handleStoryCreated}
      />

      {/* Story Viewer Modal */}
      <StoryViewer
        isOpen={showViewerModal}
        onClose={() => setShowViewerModal(false)}
        storyGroups={allStoryGroups}
        initialGroupIndex={viewerConfig.groupIndex}
        initialStoryIndex={viewerConfig.storyIndex}
        onStoryDelete={handleStoryDelete}
      />
    </>
  );
}