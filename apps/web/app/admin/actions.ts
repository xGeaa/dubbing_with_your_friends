// apps/web/app/admin/actions.ts
'use server'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,  // server-only — nunca exponer al cliente
)

export interface ClipRow {
  id: string
  youtube_id: string
  start_sec: number
  end_sec: number
  title: string
  category: string
  characters: string[]
}

// ── Listar todos los clips ──────────────────────────────────────────────────────
export async function listClips(): Promise<ClipRow[]> {
  const { data, error } = await supabase
    .from('clips')
    .select('*')
    .order('category', { ascending: true })
    .order('title', { ascending: true })

  if (error) throw new Error(error.message)
  return data as ClipRow[]
}

// ── Crear clip ─────────────────────────────────────────────────────────────────
export async function createClip(clip: Omit<ClipRow, 'id'>): Promise<ClipRow> {
  const id = `clip-${Date.now()}`
  const { data, error } = await supabase
    .from('clips')
    .insert({ id, ...clip })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as ClipRow
}

// ── Actualizar clip ────────────────────────────────────────────────────────────
export async function updateClip(id: string, clip: Omit<ClipRow, 'id'>): Promise<ClipRow> {
  const { data, error } = await supabase
    .from('clips')
    .update(clip)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as ClipRow
}

// ── Eliminar clip ──────────────────────────────────────────────────────────────
export async function deleteClip(id: string): Promise<void> {
  const { error } = await supabase.from('clips').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
