// frontend/src/components/Sidebar.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ChatBubbleOvalLeftIcon,
  UserIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import {
  ChatBubbleOvalLeftIcon as MessagesIconSolid,
  UserIcon as UserIconSolid,
  MagnifyingGlassIcon as SearchIconSolid,
} from "@heroicons/react/24/solid";
import QuickSearch from "./QuickSearch";

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();

  const navigation = [
    { name: "Messages", path: "/messages", icon: ChatBubbleOvalLeftIcon, iconSolid: MessagesIconSolid },
    { name: "Users", path: "/users", icon: UserIcon, iconSolid: UserIconSolid },
    { name: "Posts", path: "/posts", icon: UserIcon, iconSolid: UserIconSolid }, // Adjust icon as needed
  ];

  const isActivePath = (path) => location.pathname === path;

  return (
    <aside
      className={`fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-gray-200 shadow-lg overflow-y-auto transition-transform duration-300 z-40 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0 md:static md:top-0 md:h-auto`}
    >
      <div className="p-4">
        {/* Search at the top */}
        <QuickSearch />

        {/* Navigation Links */}
        <nav className="mt-6 space-y-1">
          {navigation.map((item) => {
            const Icon = isActivePath(item.path) ? item.iconSolid : item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  isActivePath(item.path)
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}