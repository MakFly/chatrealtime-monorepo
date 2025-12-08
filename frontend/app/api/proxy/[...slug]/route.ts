import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import https from 'https'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost'

async function forward(request: Request, params: { slug: string[] }) {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access_token')?.value

  const url = new URL(request.url)
  const targetPath = params.slug.join('/')
  const targetUrl = `${API_BASE_URL}/api/${targetPath}${url.search}`

  const headers = new Headers()
  headers.set('Content-Type', request.headers.get('content-type') || 'application/json')
  // Avoid gzip to prevent double-decoding issues when relaying through Next
  headers.set('accept-encoding', 'identity')
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.text(),
    redirect: 'manual',
  }

  const res = await fetch(targetUrl, {
    ...init,
    // Allow self-signed certs in local/dev
    ...(process.env.NODE_ENV === 'development' && {
      agent: new https.Agent({ rejectUnauthorized: false }),
    }),
  })

  // Normalize headers to avoid double-encoding issues in the browser
  const responseHeaders = new Headers(res.headers)
  responseHeaders.delete('content-encoding')
  responseHeaders.delete('content-length')
  responseHeaders.delete('transfer-encoding')

  const body = await res.arrayBuffer()
  return new NextResponse(body, {
    status: res.status,
    headers: responseHeaders,
  })
}

export async function GET(request: Request, { params }: { params: { slug: string[] } }) {
  const resolved = await params
  return forward(request, resolved)
}

export async function POST(request: Request, { params }: { params: { slug: string[] } }) {
  const resolved = await params
  return forward(request, resolved)
}

export async function PUT(request: Request, { params }: { params: { slug: string[] } }) {
  const resolved = await params
  return forward(request, resolved)
}

export async function PATCH(request: Request, { params }: { params: { slug: string[] } }) {
  const resolved = await params
  return forward(request, resolved)
}

export async function DELETE(request: Request, { params }: { params: { slug: string[] } }) {
  const resolved = await params
  return forward(request, resolved)
}
