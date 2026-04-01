import { NextRequest, NextResponse } from 'next/server';

interface RateLimitStore {
  [key: string]: { count: number; reset: number };
}

const store: RateLimitStore = {};

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;

export function rateLimit(identifier: string): { success: boolean; remaining: number } {
  const now = Date.now();
  const entry = store[identifier];

  if (!entry || now > entry.reset) {
    store[identifier] = { count: 1, reset: now + WINDOW_MS };
    return { success: true, remaining: MAX_REQUESTS - 1 };
  }

  entry.count++;
  const remaining = Math.max(0, MAX_REQUESTS - entry.count);

  if (entry.count > MAX_REQUESTS) {
    return { success: false, remaining: 0 };
  }

  return { success: true, remaining };
}

export function withRateLimit(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || 'unknown';

    const { success, remaining } = rateLimit(ip);

    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'Retry-After': '60',
          },
        },
      );
    }

    const response = await handler(req);
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    return response;
  };
}
