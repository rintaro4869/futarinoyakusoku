import { Hono } from 'hono'
import { Variables } from '../../app.js'
import { makeError } from '../../lib/error-codes.js'
import { trackEvent } from '../../services/analytics.js'

export function privacyRoutes(app: Hono<{ Variables: Variables }>) {
  app.delete('/users/:user_id/data', async (c) => {
    const userId = c.get('userId')
    const prisma = c.get('prisma')
    const targetUserId = c.req.param('user_id')

    if (userId !== targetUserId) return c.json(makeError('FORBIDDEN'), 403)

    const user = await prisma.user.findUnique({ where: { id: targetUserId } })
    if (!user) return c.json(makeError('NOT_FOUND'), 404)

    await trackEvent(prisma, { eventName: 'data_deletion_requested', userId })
    await prisma.user.update({ where: { id: targetUserId }, data: { deletedAt: new Date() } })

    return new Response(null, { status: 204 })
  })
}
