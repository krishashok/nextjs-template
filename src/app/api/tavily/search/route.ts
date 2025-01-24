import { NextResponse } from 'next/server'

const TAVILY_API_KEY = process.env.TAVILY_API_KEY
const TAVILY_API_URL = 'https://api.tavily.com/search'

if (!TAVILY_API_KEY) {
  throw new Error('TAVILY_API_KEY is not set in environment variables')
}

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { query } = await request.json()

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
      const error = await response.json()
      console.error('Tavily API Error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to get response from Tavily' },
        { status: response.status }
      )
    }

    const searchResults = await response.json()
    return NextResponse.json(searchResults)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process request' },
      { status: 500 }
    )
  }
} 