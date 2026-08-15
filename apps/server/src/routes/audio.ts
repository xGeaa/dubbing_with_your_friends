import { Router, type Request, type Response } from 'express'
import multer from 'multer'
import { supabase } from '../services/supabase'

const router = Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máximo
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true)
    } else {
      cb(new Error('Only audio files are allowed'))
    }
  },
})

// POST /audio/upload
router.post('/upload', upload.single('audioBlob'), (req: Request, res: Response) => {
  void (async () => {
    try {
      const { roomCode, playerId, sessionId } = req.body as {
        roomCode?: string
        playerId?: string
        sessionId?: string
      }

      if (!roomCode || !playerId || !sessionId) {
        res.status(400).json({ message: 'Missing roomCode, playerId or sessionId' })
        return
      }

      if (!req.file) {
        res.status(400).json({ message: 'No audio file provided' })
        return
      }

      const bucket = process.env.AUDIO_BUCKET_NAME ?? 'audio-recordings'
      const path = `${roomCode}/${sessionId}/${playerId}.webm`

      const { error } = await supabase.storage
        .from(bucket)
        .upload(path, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true, // permite re-grabación
        })

      if (error) throw error

      const { data } = supabase.storage.from(bucket).getPublicUrl(path)

      res.json({ url: data.publicUrl })
    } catch (err) {
      console.error('[audio] POST /upload error', err)
      res.status(500).json({ message: 'Internal server error' })
    }
  })()
})

export default router
