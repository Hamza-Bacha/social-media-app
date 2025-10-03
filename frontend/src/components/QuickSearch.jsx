import React, { useState, useEffect } from 'react';
import api from '../api/config';

export default function QuickSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ users: [], posts: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Handle search on form submit or input change (real-time search)
  const handleSearch = async (e) => {
    e?.preventDefault(); // Allow calling without event for real-time
    if (!query.trim()) {
      setResults({ users: [], posts: [] });
      setIsOpen(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.get('/api/search', {
        params: { query: query.trim(), limit: 5 }
      });
      setResults(res.data);
      setIsOpen(true);
    } catch (err) {
      console.error('Error in quick search:', err);
      setError(err.response?.data?.message || 'Search failed');
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  };

  // Real-time search with debounce-like effect
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 300); // 300ms debounce
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="relative p-2">
      <form onSubmit={handleSearch} className="flex items-center gap-2">
        <div className="relative w-full">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users or posts..."
            className="w-full border px-3 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-700 placeholder-gray-400 transition-all"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          )}
        </div>
        <button
          type="submit"
          disabled={!query.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded-full disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors text-sm"
        >
          Search
        </button>
      </form>

      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}

      {isOpen && (results.users.length > 0 || results.posts.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-72 overflow-y-auto z-50">
          {/* Users Section */}
          {results.users.length > 0 && (
            <div className="p-3">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Users</h3>
              <ul className="space-y-2">
                {results.users.map((user) => (
                  <li key={user._id}>
                    <a
                      href={`/profile/${user.username}`}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-blue-50 transition-colors text-sm"
                    >
                      <img
                        src={user.avatar || "https://via.placeholder.com/40"}
                        alt={user.username}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span className="font-medium text-gray-900">{user.username}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Posts Section */}
          {results.posts.length > 0 && (
            <div className="p-3 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Posts</h3>
              <ul className="space-y-2">
                {results.posts.map((post) => (
                  <li key={post._id}>
                    <a
                      href={`/post/${post._id}`}
                      className="flex items-start gap-3 p-2 rounded-md hover:bg-blue-50 transition-colors text-sm"
                    >
                      {post.image && (
                        <img
                          src={post.image}
                          alt={post.caption}
                          className="w-12 h-12 rounded-md object-cover flex-shrink-0"
                        />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{post.caption.slice(0, 30)}...</p>
                        <p className="text-xs text-gray-500">By @{post.author?.username || 'Unknown'}</p>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}