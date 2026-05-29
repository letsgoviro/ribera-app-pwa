import type { Metadata } from 'next'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1'

async function fetchEvent(slug: string) {
  try {
    const res = await fetch(`${API_BASE}/events/${encodeURIComponent(slug)}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    const json = await res.json()
    return json.data ?? null
  } catch {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const event = await fetchEvent(slug)

  if (!event) {
    return {
      title: 'Event — Ribera',
      description: 'Discover events on Ribera',
    }
  }

  const title = event.title
  const description = event.description
    ? event.description.slice(0, 160)
    : `Join us at ${event.venue_name ?? 'this amazing event'}. Get your tickets on Ribera.`

  const images = event.cover_image_url
    ? [{ url: event.cover_image_url, width: 1200, height: 630, alt: title }]
    : [{ url: 'https://ribera.app/og.png', width: 1200, height: 630 }]

  const eventUrl = `https://ribera.app/events/${event.slug ?? slug}`

  return {
    title,
    description,
    openGraph: {
      type: 'website',
      locale: 'en_TZ',
      url: eventUrl,
      siteName: 'Ribera',
      title,
      description,
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: images.map((i) => i.url),
    },
    alternates: {
      canonical: eventUrl,
    },
  }
}

export default function EventLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
