import { Router } from 'express'
import { supabase } from '../services/supabase'
import type { Clip } from '@dub/shared-types'

const router = Router()

// GET /clips/random?exclude=id1,id2
router.get('/random', async (req, res) => {
  try {
    const excludeParam = req.query['exclude']
    const excludeIds = typeof excludeParam === 'string' && excludeParam
      ? excludeParam.split(',').filter(Boolean)
      : []

    let query = supabase
      .from('clips')
      .select('id, youtube_id, start_sec, end_sec, title, category')

    if (excludeIds.length > 0) {
      query = query.not('id', 'in', `(${excludeIds.join(',')})`)
    }

    const { data, error } = await query

    if (error) throw error
    if (!data || data.length === 0) {
      res.status(404).json({ message: 'No clips available' })
      return
    }

    // Clip aleatorio del resultado
    const random = data[Math.floor(Math.random() * data.length)]

    if (!random) {
      res.status(404).json({ message: 'No clips available' })
      return
    }

    // Mapear snake_case de Supabase a camelCase del tipo Clip
    const clip: Clip = {
      id: random['id'] as string,
      youtubeId: random['youtube_id'] as string,
      startSec: random['start_sec'] as number,
      endSec: random['end_sec'] as number,
      title: random['title'] as string,
      category: random['category'] as string,
    }

    res.json(clip)
  } catch (err) {
    console.error('[clips] GET /random error', err)
    res.status(500).json({ message: 'Internal server error' })
  }
})

export default router
