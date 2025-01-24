import { StreamingTextResponse, OpenAIStream } from 'ai'
import { NextResponse } from 'next/server'

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'

if (!DEEPSEEK_API_KEY) {
  throw new Error('DEEPSEEK_API_KEY is not set in environment variables')
}

// Configure the runtime to use edge for better streaming support
export const runtime = 'edge'

// Prevent response caching
export const dynamic = 'force-dynamic'

interface Message {
  role: string;
  content: string;
}

export async function POST(request: Request) {
  try {
    const { messages } = await request.json()

    // Filter out any system messages that might confuse the model
    const userMessages = messages.filter((m: Message) => m.role !== 'system')

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-reasoner',
        messages: [
          // Add a system message to prevent reasoning output
          {
            role: 'system',
            content: 'You are a helpful assistant. Respond directly without explaining your reasoning.'
          },
          ...userMessages
        ],
        stream: true,
        max_tokens: 4000,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(
        { error: error.message || 'Failed to get response from DeepSeek' },
        { status: response.status }
      )
    }

    // Use OpenAIStream since DeepSeek's format is compatible
    const stream = OpenAIStream(response)
    
    return new StreamingTextResponse(stream)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process request' },
      { status: 500 }
    )
  }
} 