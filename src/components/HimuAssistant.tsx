'use client'

import { useState } from 'react'

export default function HimuAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white rounded-full p-4 shadow-lg transition-all duration-300 transform hover:scale-110"
      >
        {/* 3D Cartoon Avatar */}
        <div className="w-12 h-12 relative">
          <img
            src="/logos/himuassistantavatar.jpg"
            alt="Himu Assistant"
            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-lg hover:scale-110 transition-transform duration-300"
            onError={(e) => {
              // Fallback to CSS avatar if image fails to load
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />

          {/* Fallback CSS Avatar (hidden by default) */}
          <div className="hidden w-12 h-12 bg-gradient-to-br from-blue-400 via-purple-500 to-cyan-500 rounded-full relative border-2 border-white shadow-lg">
            <div className="absolute inset-1 bg-gradient-to-br from-pink-100 to-white rounded-full">
              {/* Simple fallback face */}
              <div className="absolute top-3 left-3 w-1.5 h-2 bg-blue-600 rounded-full"></div>
              <div className="absolute top-3 right-3 w-1.5 h-2 bg-blue-600 rounded-full"></div>
              <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 w-3 h-1.5 bg-pink-400 rounded-full"></div>
            </div>
          </div>

          {/* Online indicator */}
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse relative">
            <div className="absolute -top-0.5 -left-0.5 w-1 h-1 bg-yellow-300 rounded-full animate-ping"></div>
          </div>
        </div>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 h-96 bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-cyan-600 text-white p-4 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Small avatar in header */}
                <img
                  src="/logos/himuassistantavatar.jpg"
                  alt="Himu Assistant"
                  className="w-8 h-8 rounded-full object-cover border border-white shadow-sm"
                  onError={(e) => {
                    // Fallback to simple avatar
                    e.currentTarget.outerHTML = `
                      <div class="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full border border-white shadow-sm flex items-center justify-center">
                        <span class="text-white text-xs font-bold">H</span>
                      </div>
                    `;
                  }}
                />
                <h3 className="font-semibold">Himu Assistant</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                {/* Message avatar */}
                <img
                  src="/logos/himuassistantavatar.jpg"
                  alt="Himu Assistant"
                  className="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-md flex-shrink-0 mt-1"
                  onError={(e) => {
                    // Fallback to simple avatar
                    e.currentTarget.outerHTML = `
                      <div class="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full border border-gray-200 shadow-md flex-shrink-0 mt-1 flex items-center justify-center">
                        <span class="text-white text-sm font-bold">H</span>
                      </div>
                    `;
                  }}
                />

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 flex-1 border border-purple-100">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium text-purple-600">Konnichiwa!</span> ✨ I'm Himu-chan, your kawaii IT support assistant! (◕‿◕)♡
                    <br />
                    <span className="text-xs text-gray-500 mt-1 block">How can I help you today, senpai? 🌸</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    // Handle send message
                    setMessage('')
                  }
                }}
              />
              <button
                onClick={() => {
                  // Handle send message
                  setMessage('')
                }}
                className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
