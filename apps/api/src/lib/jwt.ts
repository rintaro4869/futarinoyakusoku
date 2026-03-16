import { SignJWT, jwtVerify } from 'jose'

function getSecret(secret: string): Uint8Array {
  return new TextEncoder().encode(secret)
}

export async function signToken(userId: string, secret: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('365d')
    .sign(getSecret(secret))
}

export async function verifyToken(token: string, secret: string): Promise<string> {
  const { payload } = await jwtVerify(token, getSecret(secret))
  if (!payload.sub) throw new Error('Missing sub')
  return payload.sub
}
