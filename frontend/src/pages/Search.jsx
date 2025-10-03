// frontend/src/pages/Search.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  MagnifyingGlassIcon,
  XMarkIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';
import api from '../api/config';
import LoadingSpinner from '../components/LoadingSpinner';
import PostCard from '../components/PostCard';

export default function Search() {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      const response = await api.get('/api/search/suggestions');
      setSuggestions(response.data.suggestions || []);
    } catch (err) {
      console.error('Error loading suggestions:', err);
    }
  };

  const performSearch = async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) return;
    
    try {
      setLoading(true);
      const response = await api.get('/api/search', {
        params: { query: searchQuery }
      });
      setSearchResults(response.data);
    } catch (err) {
      console.error('Error performing search:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    performSearch(query);
  };

  const handleFollowUser = async (userId) => {
    try {
      await api.post(`/api/users/${userId}/follow`);
      loadSuggestions();
    } catch (err) {
      console.error('Error following user:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Search</h1>
        <p className="text-gray-600">Find people and posts</p>
      </div>

      <form onSubmit={handleSubmit} className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="block w-full pl-12 pr-12 py-4 border border-gray-300 rounded-xl bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
            placeholder="Search for people or posts..."
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setSearchResults(null); }}
              className="absolute inset-y-0 right-0 pr-4 flex items-center"
            >
              <XMarkIcon className="h-5 w-5 text-gray-400" />
            </button>
          )}
        </div>
      </form>

      {loading && <LoadingSpinner size="large" text="Searching..." />}

      {searchResults && !loading && (
        <div className="space-y-8">
          {searchResults.users?.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">People</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {searchResults.users.map(user => (
                  <div key={user._id} className="bg-white rounded-lg border p-6">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                        {user.username?.charAt(0).toUpperCase()}
                      </div>
                      <Link to={`/user/${user.username}`}>
                        <h3 className="font-semibold text-gray-900">{user.username}</h3>
                      </Link>
                      {user.bio && <p className="text-sm text-gray-600 mt-2">{user.bio}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchResults.posts?.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Posts</h2>
              <div className="space-y-6">
                {searchResults.posts.map(post => (
                  <PostCard key={post._id} post={post} />
                ))}
              </div>
            </div>
          )}

          {searchResults.totalResults === 0 && (
            <div className="text-center py-12">
              <MagnifyingGlassIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">No results found</h3>
            </div>
          )}
        </div>
      )}

      {!searchResults && suggestions.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Suggested Users</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {suggestions.map(user => (
              <div key={user._id} className="bg-white rounded-lg border p-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                    {user.username?.charAt(0).toUpperCase()}
                  </div>
                  <Link to={`/user/${user.username}`}>
                    <h3 className="font-semibold text-gray-900">{user.username}</h3>
                  </Link>
                  <button
                    onClick={() => handleFollowUser(user._id)}
                    className="mt-4 flex items-center justify-center gap-1 px-4 py-2 bg-blue-500 text-white rounded-full text-sm w-full hover:bg-blue-600"
                  >
                    <UserPlusIcon className="w-4 h-4" />
                    Follow
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}