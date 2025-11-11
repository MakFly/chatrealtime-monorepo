/**
 * API Route for Product Chat Creation (V2)
 * POST /api/chat-v2/products/[productId]/chat
 * Proxies requests to Symfony backend with server-side cookie access
 */

import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost'
const API_URL = `${API_BASE_URL}/api`

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params

    // Get access token from cookies (server-side only)
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    console.log('[Product Chat API] 🍪 All cookies:', cookieStore.getAll().map(c => c.name))
    console.log('[Product Chat API] 🔑 Access token present:', !!accessToken)
    console.log('[Product Chat API] 📦 Product ID:', productId)

    if (!accessToken) {
      console.error('[Product Chat API] ❌ No access token in cookies!')
      return NextResponse.json(
        { error: 'Unauthorized - No access token' },
        { status: 401 }
      )
    }

    // Get request body
    const body = await request.json()
    console.log('[Product Chat API] 📤 Request body:', body)

    // Forward request to Symfony backend
    const url = `${API_URL}/v2/products/${productId}/chat`
    console.log('[Product Chat API] 📞 Posting to:', url)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    })

    console.log('[Product Chat API] 📥 Response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Product Chat API] ❌ Backend error:', errorText)

      // Enhanced error messages based on status code
      let errorMessage = errorText || response.statusText

      if (response.status === 401) {
        errorMessage = 'Votre session a expiré. Veuillez vous reconnecter.'
      } else if (response.status === 403) {
        errorMessage = 'Vous n\'avez pas l\'autorisation d\'accéder à cette conversation.'
      } else if (response.status === 404) {
        errorMessage = 'Produit introuvable.'
      } else if (response.status === 400) {
        errorMessage = 'Requête invalide. Vérifiez les données envoyées.'
      }

      return NextResponse.json(
        {
          error: errorMessage,
          status: response.status,
          details: errorText
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('[Product Chat API] ✅ Success:', data)

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('[Product Chat API] ❌ Exception:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
