import { app } from './app'
import { env } from './env'
app
  .listen({
    port: env.PORT,
    host: 'RENDER' in process.env ? '0.0.0.0' : 'localhost',
  })
  .then(() => {
    console.log(`Runninh HTTP server on port: ${env.PORT}`)
  })
