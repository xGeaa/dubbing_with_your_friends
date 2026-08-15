import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { RoomManager } from './rooms/RoomManager'
import { registerRoomHandlers } from './socket/handlers/roomHandlers'
import clipsRouter from './routes/clips'

const app = express()
const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL ?? 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
})

app.use(cors({ origin: process.env.CLIENT_URL ?? 'http://localhost:3000' }))
app.use(express.json())

// ── REST ──────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/clips', clipsRouter)

// ── Socket.io ─────────────────────────────────────────────────────────────────
const roomManager = new RoomManager()

io.on('connection', (socket) => {
  console.log(`[socket] connected: ${socket.id}`)
  registerRoomHandlers(io, socket, roomManager)
})

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT ?? 3001
httpServer.listen(PORT, () => {
  console.log(`🎙️  Server running on port ${PORT}`)
})
