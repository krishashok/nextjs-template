'use client'

import { useChat } from 'ai/react'
import { useState, useEffect } from 'react'
import { Search, ExternalLink, Moon, Sun, Copy, Check, Link2, RotateCcw } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface CodeProps extends React.HTMLAttributes<HTMLElement> {
  inline?: boolean;
}

interface Source {
  title: string;
  url: string;
  content: string;
  score: number;
  published_date?: string;
}

interface SourcesMetadata {
  type: 'sources';
  data: Source[];
}

function getDomainFromUrl(url: string) {
  try {
    const domain = new URL(url).hostname.replace('www.', '')
    return domain.split('.')[0] // Get the first part of the domain
  } catch {
    return 'link'
  }
}

function getDomainIcon(domain: string) {
  switch (domain.toLowerCase()) {
    case 'github':
      return <div className="w-5 h-5 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
      </div>
    case 'dev':
      return <div className="w-5 h-5 bg-black rounded-sm flex items-center justify-center text-white text-xs font-bold">DEV</div>
    case 'tavily':
      return <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
        <span className="text-white text-xs font-bold">T</span>
      </div>
    case 'aicontentlabs':
      return <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
        <span className="text-white text-xs">AI</span>
      </div>
    default:
      return <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
        <span className="text-gray-600 dark:text-gray-300 text-xs">{domain.charAt(0).toUpperCase()}</span>
      </div>
  }
}

interface MessageWithSources {
  messageId: string;
  sources: Source[];
}

export default function Chat() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [messagesSources, setMessagesSources] = useState<MessageWithSources[]>([])
  
  const { messages, input, handleInputChange, handleSubmit, error, isLoading, reload } = useChat({
    api: '/api/deepseek/chat',
    onResponse: (response) => {
      // Get sources from header
      const sourcesHeader = response.headers.get('x-sources');
      if (sourcesHeader) {
        try {
          const sourcesData = JSON.parse(sourcesHeader);
          // Store sources with a unique ID for the current message
          setMessagesSources(prev => [...prev, {
            messageId: messages[messages.length - 1]?.id || Date.now().toString(),
            sources: sourcesData
          }]);
        } catch (e) {
          console.error('Failed to parse sources:', e);
        }
      }
    }
  })

  // Initialize dark mode state from document class
  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'))
  }, [])

  // Update dark mode when toggled
  const toggleDarkMode = () => {
    const newMode = !isDarkMode
    setIsDarkMode(newMode)
    
    // Update localStorage and document class
    if (newMode) {
      localStorage.theme = 'dark'
      document.documentElement.classList.add('dark')
    } else {
      localStorage.theme = 'light'
      document.documentElement.classList.remove('dark')
    }
  }

  // Reset copied state after 2 seconds
  useEffect(() => {
    if (copiedIndex !== null) {
      const timer = setTimeout(() => {
        setCopiedIndex(null)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [copiedIndex])

  const handleCopy = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedIndex(index)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  // Function to get message data with its sources
  const getMessageData = (message: any) => {
    const messageSources = messagesSources.find(ms => ms.messageId === message.id)?.sources || [];
    return {
      content: message.content,
      sources: messageSources
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
      {/* Main Container */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12 relative">
          <div className="absolute right-0 top-0 flex items-center gap-2">
            <button
              onClick={() => {
                window.location.reload();
              }}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
              title="Start new chat"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              onClick={toggleDarkMode}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
              title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-400 dark:from-blue-400 dark:to-blue-200">
            Vismaya
          </h1>
        </div>

        {/* Search Form */}
        <div className="mb-12">
          <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto">
            <div className="relative group">
              <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/30 rounded-full blur-md opacity-30 group-hover:opacity-40 transition-opacity"></div>
              <input
                value={input}
                onChange={handleInputChange}
                placeholder="Ask anything..."
                className="w-full px-6 py-4 text-lg border-2 border-blue-100 dark:border-blue-900/30 rounded-full focus:outline-none focus:border-blue-300 dark:focus:border-blue-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-200 relative text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl shadow-sm">
              <p className="text-red-700 dark:text-red-400">Error: {error.message || 'Failed to send message'}</p>
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <div className="space-y-12">
          {messages.map((message, index) => {
            if (message.role === 'system') return null;

            if (message.role === 'user') {
              return (
                <div key={index} className="max-w-2xl mx-auto">
                  <h2 className="text-2xl text-gray-800 dark:text-gray-100 font-medium">{message.content}</h2>
                </div>
              );
            }

            if (message.role === 'assistant') {
              const messageData = getMessageData(message);

              return (
                <div key={index} className="max-w-3xl mx-auto space-y-6">
                  {/* Sources Block */}
                  {messageData.sources.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-5 h-5">
                          <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-400 dark:text-gray-500">
                            <path fill="currentColor" d="M13,9H18.5L13,3.5V9M6,2H14L20,8V20A2,2 0 0,1 18,22H6C4.89,22 4,21.1 4,20V4C4,2.89 4.89,2 6,2M6.12,15.5L9.86,19.24L11.28,17.83L8.95,15.5L11.28,13.17L9.86,11.76L6.12,15.5M17.28,15.5L13.54,11.76L12.12,13.17L14.45,15.5L12.12,17.83L13.54,19.24L17.28,15.5Z" />
                          </svg>
                        </div>
                        <h3 className="text-xl text-gray-800 dark:text-gray-200 font-semibold">Sources</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {messageData.sources.map((source, idx) => {
                          const domain = getDomainFromUrl(source.url);
                          return (
                            <a
                              key={idx}
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-900/80 dark:bg-gray-800 text-gray-100 rounded-lg hover:bg-gray-900 dark:hover:bg-gray-700 transition-colors duration-200"
                              title={source.title}
                            >
                              {getDomainIcon(domain)}
                              <span className="text-sm">{domain}</span>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Answer Block */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="p-6 relative">
                      {/* Copy Button */}
                      <button
                        onClick={() => handleCopy(messageData.content, index)}
                        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded-lg transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 group"
                        title="Copy to clipboard"
                      >
                        {copiedIndex === index ? (
                          <Check className="w-5 h-5 text-green-500 dark:text-green-400" />
                        ) : (
                          <Copy className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                        )}
                      </button>

                      <div className="prose prose-lg dark:prose-invert prose-blue dark:prose-blue max-w-none">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-8 mb-4" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mt-6 mb-3" {...props} />,
                            h3: ({node, ...props}) => <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-4 mb-2" {...props} />,
                            p: ({node, ...props}) => <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc ml-6 space-y-2 mb-4" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal ml-6 space-y-2 mb-4" {...props} />,
                            li: ({node, children, ...props}) => (
                              <li className="text-gray-700 dark:text-gray-300" {...props}>
                                <span className="relative -left-2">{children}</span>
                              </li>
                            ),
                            a: ({node, ...props}) => (
                              <a 
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline" 
                                target="_blank"
                                rel="noopener noreferrer"
                                {...props} 
                              />
                            ),
                            blockquote: ({node, ...props}) => (
                              <blockquote 
                                className="border-l-4 border-blue-200 dark:border-blue-800 pl-4 italic text-gray-700 dark:text-gray-300 my-4" 
                                {...props} 
                              />
                            ),
                            code: ({inline, ...props}: CodeProps) => (
                              inline 
                                ? <code className="bg-gray-100 dark:bg-gray-700 rounded px-1 py-0.5 text-sm text-gray-800 dark:text-gray-200" {...props} />
                                : <code className="block bg-gray-100 dark:bg-gray-700 rounded-lg p-4 text-sm text-gray-800 dark:text-gray-200 overflow-x-auto" {...props} />
                            ),
                          }}
                        >
                          {messageData.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            return null;
          })}

          {/* Loading State */}
          {isLoading && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-3/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-1/2"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 