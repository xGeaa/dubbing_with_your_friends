'use server'

import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export interface ClipRow {
  id: string
  youtube_id: string
  start_sec: number
  end_sec: number
  title: string
  category: string
  characters: string[]
}

export async function listClips(): Promise<ClipRow[]> {
  const { data, error } = await getSupabase()
    .from('clips')
    .select('*')
    .order('category', { ascending: true })
    .order('title', { ascending: true })
  if (error) throw new Error(error.message)
  return data as ClipRow[]
}

export async function createClip(clip: Omit<ClipRow, 'id'>): Promise<ClipRow> {
  const { data, error } = await getSupabase()
    .from('clips')
    .insert({ id: `clip-${Date.now()}`, ...clip })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as ClipRow
}

export async function updateClip(id: string, clip: Omit<ClipRow, 'id'>): Promise<ClipRow> {
  const { data, error } = await getSupabase()
    .from('clips')
    .update(clip)
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as ClipRow
}

export async function deleteClip(id: string): Promise<void> {
  const { error } = await getSupabase().from('clips').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
