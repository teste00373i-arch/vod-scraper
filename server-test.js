import express from 'express'
import cors from 'cors'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  console.log('✅ Health check OK')
  res.json({ status: 'ok', message: 'Server is running' })
})

app.get('/test', (req, res) => {
  console.log('✅ Test endpoint OK')
  res.json({ test: 'working', timestamp: new Date().toISOString() })
})

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server listening on http://localhost:${PORT}`)
})

server.on('error', (error) => {
  console.error('❌ Server error:', error)
})

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught:', error.message)
})
