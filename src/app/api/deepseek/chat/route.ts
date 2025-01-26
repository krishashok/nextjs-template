import { StreamingTextResponse, OpenAIStream } from 'ai'
import { NextResponse } from 'next/server'

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'
const TAVILY_API_KEY = process.env.TAVILY_API_KEY
const TAVILY_API_URL = 'https://api.tavily.com/search'

if (!DEEPSEEK_API_KEY) {
  throw new Error('DEEPSEEK_API_KEY is not set in environment variables')
}

if (!TAVILY_API_KEY) {
  throw new Error('TAVILY_API_KEY is not set in environment variables')
}

// Configure the runtime to use edge for better streaming support
export const runtime = 'edge'

// Prevent response caching
export const dynamic = 'force-dynamic'

interface Message {
  role: string;
  content: string;
}

async function searchTavily(query: string) {
  const response = await fetch(TAVILY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TAVILY_API_KEY as string}`,
    },
    body: JSON.stringify({
      query,
      search_depth: 'advanced',
      include_answer: true,
      include_images: false,
      max_results: 5,
    }),
  })

  if (!response.ok) {
    console.error('Tavily API Error:', await response.json())
    throw new Error('Failed to get response from Tavily')
  }

  return response.json()
}

export async function POST(request: Request) {
  try {
    const { messages } = await request.json()
    
    // Get the latest user message for search
    const latestUserMessage = messages[messages.length - 1]
    
    // Only search if it's a user message
    if (latestUserMessage.role === 'user') {
      try {
        // Perform Tavily search for the latest user message
        const searchResults = await searchTavily(latestUserMessage.content)
        
        // Format search results for the model
        const formattedSources = searchResults.results.map((result: any) => ({
          title: result.title || 'Untitled',
          url: result.url,
          content: result.content,
          score: result.score,
          published_date: result.published_date
        }));

        console.log('Formatted sources:', formattedSources);

        // Create messages array for model without sources metadata
        const modelMessages = [
          {
            role: 'system',
            content: 'You are a helpful assistant that provides accurate answers based on search results. Always cite your sources when providing information.'
          },
          // Add search results for the model
          {
            role: 'system',
            content: `Here are relevant search results for the user's question:\n\n${formattedSources.map((source: any) => 
              `[Source: ${source.url}]\n${source.content}`
            ).join('\n\n')}`
          },
          ...messages.slice(0, -1),  // Previous conversation
          latestUserMessage  // Current user message must be last
        ];

        const response = await fetch(DEEPSEEK_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'deepseek-reasoner',
            messages: modelMessages,
            stream: true,
            max_tokens: 4000,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          console.error('DeepSeek API Error:', error)
          return NextResponse.json(
            { error: error.message || 'Failed to get response from DeepSeek' },
            { status: response.status }
          )
        }

        // Create response with sources metadata in header
        const stream = OpenAIStream(response);
        const streamResponse = new StreamingTextResponse(stream);
        streamResponse.headers.set('x-sources', JSON.stringify(formattedSources));
        
        return streamResponse;
      } catch (searchError) {
        console.error('Search Error:', searchError)
        // If search fails, fall back to regular conversation without search
        const response = await fetch(DEEPSEEK_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'deepseek-reasoner',
            messages: [
              {
                role: 'system',
                content: 'You are a helpful assistant. Please provide the best answer based on the conversation history.'
              },
              ...messages
            ],
            stream: true,
            max_tokens: 4000,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          console.error('DeepSeek Fallback Error:', error)
          return NextResponse.json(
            { error: error.message || 'Failed to get response from DeepSeek' },
            { status: response.status }
          )
        }

        const stream = OpenAIStream(response)
        return new StreamingTextResponse(stream)
      }
    } else {
      // If not a user message, just pass through to DeepSeek without search
      const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'deepseek-reasoner',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant. Please provide the best answer based on the conversation history.'
            },
            ...messages
          ],
          stream: true,
          max_tokens: 4000,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('DeepSeek Direct Error:', error)
        return NextResponse.json(
          { error: error.message || 'Failed to get response from DeepSeek' },
          { status: response.status }
        )
      }

      const stream = OpenAIStream(response)
      return new StreamingTextResponse(stream)
    }
  } catch (error) {
    console.error('General Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process request' },
      { status: 500 }
    )
  }
} 