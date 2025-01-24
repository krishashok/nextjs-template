'use client'

import { useChat } from 'ai/react'
import { useState } from 'react'
import { Send, AlertCircle } from 'lucide-react'

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, error, isLoading } = useChat({
    api: '/api/deepseek/chat',
    onResponse: (response) => {
      // Log the response headers and status
      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))
    },
    onFinish: (message) => {
      console.log('Finished message:', message)
    },
  })

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <h1 className="text-xl font-semibold text-gray-800">Deepseek Reasoner Chat</h1>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-4 text-red-800 bg-red-100 rounded-lg">
            <AlertCircle className="w-5 h-5" />
            <p>Error: {error.message || 'Failed to send message'}</p>
          </div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-3xl p-4 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-800 border'
              }`}
            >
              <div className="text-sm font-medium mb-1">
                {message.role === 'user' ? 'You' : 'Deepseek'}
              </div>
              <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-3xl p-4 rounded-lg bg-white text-gray-800 border">
              <div className="text-sm font-medium mb-1">Deepseek</div>
              <div className="animate-pulse">Thinking...</div>
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-4 border-t bg-white">
        <div className="flex items-center space-x-2">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask anything..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  )
} 