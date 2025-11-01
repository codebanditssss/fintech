'use client';

import { useState } from 'react';
import { FileText, Settings, LogOut, Trash2, Eye } from 'lucide-react';

interface Document {
  id: string;
  name: string;
  termsCount: number;
  date: string;
}

interface LeftSidebarProps {
  documents: Document[];
  currentUser: {
    name: string;
    email: string;
  };
  onDocumentSelect: (id: string) => void;
  onDocumentDelete: (id: string) => void;
  onLogout: () => void;
  onSettings: () => void;
}

export default function LeftSidebar({
  documents,
  currentUser,
  onDocumentSelect,
  onDocumentDelete,
  onLogout,
  onSettings,
}: LeftSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      {/* Sidebar Container */}
      <div
        className={`fixed left-0 top-0 h-screen bg-white transition-all duration-300 ease-in-out z-40 ${
          isExpanded 
            ? 'w-64 border-r border-zinc-200 shadow-xl' 
            : 'w-16 border-r border-zinc-200'
        }`}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        {/* Logo Section */}
        <div className={`h-16 border-b border-zinc-200 flex items-center transition-all duration-300 ${
          isExpanded ? 'px-4 justify-start' : 'px-0 justify-center'
        }`}>
          <FileText className="w-6 h-6 text-zinc-900 shrink-0" />
          <div
            className={`ml-3 transition-all duration-300 ${
              isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'
            } overflow-hidden`}
          >
            <h1 className="text-sm font-semibold text-zinc-900 whitespace-nowrap">
              Finance
            </h1>
            <p className="text-xs text-zinc-500 whitespace-nowrap">Translator</p>
          </div>
        </div>

        {/* Document History */}
        <div className="flex-1 overflow-y-auto py-4">
          {isExpanded && (
            <div className="px-4 mb-2">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                History
              </p>
            </div>
          )}

          <div className={`space-y-1 ${isExpanded ? 'px-2' : 'px-0'}`}>
            {documents.length === 0 ? (
              isExpanded && (
                <div className="px-2 py-8 text-center">
                  <p className="text-xs text-zinc-400">No documents yet</p>
                </div>
              )
            ) : (
              documents.map((doc) => (
                <div
                  key={doc.id}
                  className={`group relative flex items-center rounded-lg hover:bg-zinc-50 transition-colors cursor-pointer ${
                    isExpanded 
                      ? 'gap-3 px-2 py-2 mx-2' 
                      : 'justify-center py-2 mx-1'
                  }`}
                  onClick={() => onDocumentSelect(doc.id)}
                  title={isExpanded ? '' : doc.name}
                >
                  {/* Icon */}
                  <FileText className="w-5 h-5 text-zinc-600 shrink-0" />

                  {/* Document Info */}
                  <div
                    className={`flex-1 min-w-0 transition-all duration-300 ${
                      isExpanded ? 'opacity-100' : 'opacity-0 w-0'
                    } overflow-hidden`}
                  >
                    <p className="text-sm text-zinc-900 truncate font-medium">
                      {doc.name}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {doc.termsCount} terms • {doc.date}
                    </p>
                  </div>

                  {/* Actions (on hover) */}
                  {isExpanded && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDocumentSelect(doc.id);
                        }}
                        className="p-1 hover:bg-zinc-200 rounded"
                        title="View"
                      >
                        <Eye className="w-3 h-3 text-zinc-600" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDocumentDelete(doc.id);
                        }}
                        className="p-1 hover:bg-red-100 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3 text-red-600" />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* User Profile Section */}
        <div className={`border-t border-zinc-200 transition-all duration-300 ${
          isExpanded ? 'p-4' : 'p-2'
        }`}>
          {/* User Info */}
          <div
            className={`flex items-center mb-3 ${
              isExpanded ? 'gap-3' : 'justify-center'
            }`}
          >
            <div className="w-8 h-8 bg-zinc-900 rounded-full flex items-center justify-center shrink-0">
              <span className="text-white text-sm font-semibold">
                {currentUser.name.charAt(0).toUpperCase()}
              </span>
            </div>
            {isExpanded && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 whitespace-nowrap">
                  {currentUser.name}
                </p>
                <p className="text-xs text-zinc-500 whitespace-nowrap truncate">
                  {currentUser.email}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-1">
            <button
              onClick={onSettings}
              className={`w-full flex items-center rounded-lg hover:bg-zinc-100 transition-colors ${
                isExpanded ? 'gap-3 px-2 py-2' : 'justify-center py-2'
              }`}
              title="Settings"
            >
              <Settings className="w-4 h-4 text-zinc-600 shrink-0" />
              {isExpanded && (
                <span className="text-sm text-zinc-700 whitespace-nowrap">
                  Settings
                </span>
              )}
            </button>

            <button
              onClick={onLogout}
              className={`w-full flex items-center rounded-lg hover:bg-red-50 transition-colors ${
                isExpanded ? 'gap-3 px-2 py-2' : 'justify-center py-2'
              }`}
              title="Logout"
            >
              <LogOut className="w-4 h-4 text-red-600 shrink-0" />
              {isExpanded && (
                <span className="text-sm text-red-600 whitespace-nowrap">
                  Logout
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Spacer to prevent content overlap */}
      <div className="w-16" />
    </>
  );
}

