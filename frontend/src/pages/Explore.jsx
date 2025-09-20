import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  MagnifyingGlassIcon, 
  UserPlusIcon,
  UserGroupIcon,
  HashtagIcon
} from "@heroicons/react/24/outline";
import api from "../api/config";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("people");

  useEffect(() => {
    // Load initial users when component mounts
    fetchUsers();
  }, []);

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchUsers();
      } else {
        fetchUsers();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/users");
      setUsers(response.data.users || []);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/users?search=${encodeURIComponent(searchQuery)}`);
      setUsers(response.data.users || []);
    } catch (err) {
      console.error("Error searching users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId) => {
    try {
      const response = await api.post(`/api/users/${userId}/follow`);
      setUsers(prev => prev.map(user => 
        user._id === userId 
          ? { ...user, isFollowing: response.data.isFollowing }
          : user
      ));
    } catch (err) {
      console.error("Error following user:", err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Explore</h1>
        <p className="text-gray-600">Discover new people and content</p>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-full leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search for people..."
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("people")}
            className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "people"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <UserGroupIcon className="w-5 h-5" />
            People
          </button>
          <button
            onClick={() => setActiveTab("trending")}
            className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "trending"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <HashtagIcon className="w-5 h-5" />
            Trending
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === "people" && (
        <div>
          {loading ? (
            <div className="text-center py-8">
              <LoadingSpinner size="medium" text="Searching..." />
            </div>
          ) : users.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {users.map(user => (
                <div key={user._id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="text-center">
                    {/* Avatar */}
                    <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                      {user.username?.charAt(0).toUpperCase() || "U"}
                    </div>
                    
                    {/* User Info */}
                    <Link 
                      to={`/user/${user.username}`}
                      className="block hover:text-blue-600 transition-colors"
                    >
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {user.username}
                      </h3>
                    </Link>
                    
                    {user.bio && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {user.bio}
                      </p>
                    )}
                    
                    {/* Stats */}
                    <div className="flex justify-center gap-4 text-sm text-gray-500 mb-4">
                      <span><strong>{user.postsCount || 0}</strong> posts</span>
                      <span><strong>{user.followersCount || 0}</strong> followers</span>
                    </div>
                    
                    {/* Follow Button */}
                    {!user.isOwnProfile && (
                      <button
                        onClick={() => handleFollow(user._id)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          user.isFollowing
                            ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
                            : "bg-blue-500 text-white hover:bg-blue-600"
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <UserPlusIcon className="w-4 h-4" />
                          {user.isFollowing ? "Unfollow" : "Follow"}
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchQuery ? "No users found" : "No users available"}
              </h3>
              <p className="text-gray-600">
                {searchQuery 
                  ? `No users match "${searchQuery}"`
                  : "Check back later for new people to follow"
                }
              </p>
            </div>
          )}
        </div>
      )}

      {/* Trending Tab */}
      {activeTab === "trending" && (
        <div className="text-center py-12">
          <HashtagIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Trending Topics
          </h3>
          <p className="text-gray-600 mb-6">
            Discover what's happening right now
          </p>
          
          {/* Placeholder trending topics */}
          <div className="max-w-md mx-auto space-y-3">
            {[
              "#SocialApp",
              "#Technology", 
              "#WebDevelopment",
              "#React",
              "#NodeJS"
            ].map((hashtag, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                <div className="flex justify-between items-center">
                  <div className="text-left">
                    <p className="font-medium text-blue-600">{hashtag}</p>
                    <p className="text-sm text-gray-500">
                      {Math.floor(Math.random() * 1000) + 100} posts
                    </p>
                  </div>
                  <HashtagIcon className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}