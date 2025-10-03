// frontend/src/components/Navbar.jsx
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  HomeIcon, 
  MagnifyingGlassIcon, 
  UserIcon, 
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ChatBubbleOvalLeftIcon,
} from "@heroicons/react/24/outline";
import {
  HomeIcon as HomeIconSolid,
  MagnifyingGlassIcon as SearchIconSolid,
  UserIcon as UserIconSolid,
  ChatBubbleOvalLeftIcon as MessagesIconSolid,
} from "@heroicons/react/24/solid";
import NotificationCenter from "./NotificationCenter";
import QuickSearch from "./QuickSearch";

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
    setIsMobileMenuOpen(false);
  };

  const navigation = [
    { name: "Home", path: "/", icon: HomeIcon, iconSolid: HomeIconSolid },
    { name: "Search", path: "/search", icon: MagnifyingGlassIcon, iconSolid: SearchIconSolid },
    { name: "Messages", path: "/messages", icon: ChatBubbleOvalLeftIcon, iconSolid: MessagesIconSolid },
    { name: "Profile", path: "/profile", icon: UserIcon, iconSolid: UserIconSolid },
  ];

  const isActivePath = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center">
            <h1 className="text-2xl font-bold text-blue-600">SocialApp</h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navigation.map((item) => {
              const Icon = isActivePath(item.path) ? item.iconSolid : item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    isActivePath(item.path)
                      ? "text-blue-600 bg-blue-100"
                      : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                  }`}
                  aria-label={item.name}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Desktop Right Section */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="w-64 lg:w-80">
              <QuickSearch />
            </div>
            <NotificationCenter />
            <div className="relative">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} // Toggle mobile menu for user actions
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                aria-label="User menu"
              >
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  {user?.username?.charAt(0).toUpperCase() || "U"}
                </div>
                <span className="hidden lg:inline">{user?.username || "User"}</span>
              </button>
              {isMobileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 ring-1 ring-black ring-opacity-5">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <UserIcon className="w-4 h-4" />
                    Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Cog6ToothIcon className="w-4 h-4" />
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <ArrowRightOnRectangleIcon className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-700 hover:text-blue-600 rounded-md"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <div className="mb-4">
              <QuickSearch />
            </div>
            {navigation.map((item) => {
              const Icon = isActivePath(item.path) ? item.iconSolid : item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium ${
                    isActivePath(item.path)
                      ? "text-blue-600 bg-blue-50"
                      : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                  }`}
                  aria-label={item.name}
                >
                  <Icon className="w-6 h-6" />
                  {item.name}
                </Link>
              );
            })}

            {/* Mobile User Info */}
            <div className="px-3 py-2 border-t border-gray-200 mt-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  {user?.username?.charAt(0).toUpperCase() || "U"}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{user?.username || "User"}</p>
                  <p className="text-sm text-gray-500">{user?.email || "user@example.com"}</p>
                </div>
              </div>

              <NotificationCenter />

              <div className="space-y-1 mt-4">
                <Link
                  to="/settings"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  <Cog6ToothIcon className="w-5 h-5" />
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-red-600 hover:bg-red-50"
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}