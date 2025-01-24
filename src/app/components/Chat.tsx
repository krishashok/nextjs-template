'use client'

import { useChat } from 'ai/react'
import { useState } from 'react'
import { Search, ExternalLink } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface CodeProps extends React.HTMLAttributes<HTMLElement> {
  inline?: boolean;
}

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, error, isLoading } = useChat({
    api: '/api/deepseek/chat',
  })

  return (
    <div className="min-h-screen bg-white">
      {/* Main Container */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-800">Where knowledge begins</h1>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="relative">
            <input
              value={input}
              onChange={handleInputChange}
              placeholder="Ask anything..."
              className="w-full px-6 py-3 text-lg border-2 border-blue-200 rounded-full focus:outline-none focus:border-blue-500 bg-blue-50/50 text-gray-800 placeholder-gray-500"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-lg">
            <p>Error: {error.message || 'Failed to send message'}</p>
          </div>
        )}

        {/* Chat Messages */}
        <div className="space-y-8">
          {messages.map((message, index) => {
            // Skip system messages
            if (message.role === 'system') return null;

            // For user messages, show the question with a subtle background
            if (message.role === 'user') {
              return (
                <div key={index} className="space-y-2">
                  <h2 className="text-xl text-gray-800 font-medium">{message.content}</h2>
                </div>
              );
            }

            // For assistant messages, parse and format the response
            const content = message.content;
            const sources = content.match(/\[Source: (.*?)\]/g) || [];
            const cleanContent = content.replace(/\[Source: .*?\]/g, '').trim();

            return (
              <div key={index} className="space-y-6 bg-white rounded-xl">
                {/* Sources */}
                {sources.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Sources</h3>
                    <div className="flex flex-wrap gap-2">
                      {sources.map((source, idx) => {
                        const match = source.match(/\[Source: (.*?)\]/);
                        const url = match ? match[1] : '#';
                        return (
                          <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors"
                          >
                            <span>Source {idx + 1}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Answer with Markdown Support */}
                <div className="prose prose-lg prose-blue max-w-none">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-gray-900 mt-8 mb-4" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-xl font-bold text-gray-800 mt-6 mb-3" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2" {...props} />,
                      p: ({node, ...props}) => <p className="text-gray-700 leading-relaxed mb-4" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc ml-6 space-y-2 mb-4" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal ml-6 space-y-2 mb-4" {...props} />,
                      li: ({node, children, ...props}) => {
                        return (
                          <li className="text-gray-700 pl-1.5" {...props}>
                            {children}
                          </li>
                        );
                      },
                      a: ({node, ...props}) => (
                        <a 
                          className="text-blue-600 hover:text-blue-800 underline" 
                          target="_blank"
                          rel="noopener noreferrer"
                          {...props} 
                        />
                      ),
                      blockquote: ({node, ...props}) => (
                        <blockquote 
                          className="border-l-4 border-blue-200 pl-4 italic text-gray-700 my-4" 
                          {...props} 
                        />
                      ),
                      code: ({inline, ...props}: CodeProps) => (
                        inline 
                          ? <code className="bg-gray-100 rounded px-1 py-0.5 text-sm text-gray-800" {...props} />
                          : <code className="block bg-gray-100 rounded-lg p-4 text-sm text-gray-800 overflow-x-auto" {...props} />
                      ),
                    }}
                  >
                    {cleanContent}
                  </ReactMarkdown>
                </div>
              </div>
            );
          })}

          {/* Loading State */}
          {isLoading && (
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 