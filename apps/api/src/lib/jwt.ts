import { SignJWT, jwtVerify } from 'jose'

function getSecret(secret: string): Uint8Array {
  return new TextEncoder().encode(secret)
}

export async function signToken(userId: string, secret: string, tokenVersion = 0): Promise<string> {
  return new SignJWT({ sub: userId, tv: tokenVersion })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(getSecret(secret))
}

export async function verifyToken(token: string, secret: string): Promise<{ userId: string; tokenVersion: number }> {
  const { payload } = await jwtVerify(token, getSecret(secret))
  if (!payload.sub) throw new Error('Missing sub')
  return {
    userId: payload.sub,
    tokenVersion: typeof payload.tv === 'number' ? payload.tv : 0,
  }
}
