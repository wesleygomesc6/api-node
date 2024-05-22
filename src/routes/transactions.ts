import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'
import { randomUUID } from 'crypto'

export async function transactionsRoutes(app: FastifyInstance) {
  // create transactions
  app.post('/', async (request, reply) => {
    const createTransactionBodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(['credit', 'debit']),
    })

    const { title, amount, type } = createTransactionBodySchema.parse(
      request.body,
    )

    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()

      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
    }

    await knex('transactions').insert({
      id: crypto.randomUUID(),
      title,
      amount: type === 'credit' ? amount : amount * -1,
      session_id: sessionId,
    })

    return reply.status(201).send()
  })

  // get all transactions
  app.get('/', async (request, reply) => {
    const sessionId = request.cookies.sessionId

    if (!sessionId) {
      return reply.status(401).send({
        error: 'Não autorização',
      })
    }

    const transactins = await knex('transactions').select()

    return {
      transactins,
    }
  })

  // get one transactions
  app.get('/:id', async (request) => {
    const getTransactionParamSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = getTransactionParamSchema.parse(request.params)

    const transaction = await knex('transactions').where('id', id).first()

    return { transaction }
  })

  // resume of transactions
  app.get('/summary', async () => {
    const summary = await knex('transactions')
      .sum('amount', { as: 'amount' })
      .first()

    return { summary }
  })
}
