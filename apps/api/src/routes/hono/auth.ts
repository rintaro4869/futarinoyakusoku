import { Hono } from 'hono'
import { z } from 'zod'
import { Variables } from '../../app.js'
import { generateId } from '../../lib/id.js'
import { signToken } from '../../lib/jwt.js'
import { trackEvent } from '../../services/analytics.js'

const createSchema = z.object({
  locale: z.string().default('ja-JP'),
  timezone: z.string().default('Asia/Tokyo'),
})

export function authRoutes(app: Hono<{ Variables: Variables }>) {
  app.get('/health', (c) => c.json({ ok: true }))

  app.post('/auth/anonymous', async (c) => {
    const raw = await c.req.json().catch(() => ({}))
    const body = createSchema.parse(raw)
    const prisma = c.get('prisma')
    const jwtSecret = c.get('jwtSecret')

    const userId = generateId()
    await prisma.user.create({
      data: { id: userId, locale: body.locale, timezone: body.timezone },
    })

    const token = await signToken(userId, jwtSecret)

    await trackEvent(prisma, {
      eventName: 'signup_completed',
      userId,
      payload: { locale: body.locale },
    })

    return c.json({ user_id: userId, device_token: token })
  })
}
