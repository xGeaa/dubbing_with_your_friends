'use client'
// apps/web/app/admin/ClipManagerClient.tsx
//
// Panel completo de gestión de clips:
//  • Lista todos los clips con acciones de editar/eliminar
//  • Editor con preview de YouTube + selector de timestamps
//  • Asignador de personajes
//  • Guarda en Supabase via server actions

import { useState, useRef, useCallback, useEffect } from 'react'
import { createClip, updateClip, deleteClip, type ClipRow } from './actions'

// ── Tipos de YouTube IFrame API ───────────────────────────────────────────────
declare global {
  interface Window {
    YT: typeof YT
    onYouTubeIframeAPIReady: () => void
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function extractYouTubeId(input: string): string {
  // Acepta: ID directo, https://youtu.be/ID, https://youtube.com/watch?v=ID
  const patterns = [
    /^([a-zA-Z0-9_-]{11})$/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /[?&]v=([a-zA-Z0-9_-]{11})/,
  ]
  for (const pattern of patterns) {
    const m = input.match(pattern)
    if (m?.[1]) return m[1]
  }
  return input.trim()
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

const CATEGORIES = ['animation', 'classic', 'meme', 'nature', 'sport', 'other']

// ── Clip vacío por defecto ────────────────────────────────────────────────────
const emptyClip = (): Omit<ClipRow, 'id'> => ({
  youtube_id: '',
  start_sec: 0,
  end_sec: 30,
  title: '',
  category: 'animation',
  characters: [],
})

// ══════════════════════════════════════════════════════════════════════════════
// ClipManagerClient
// ══════════════════════════════════════════════════════════════════════════════
interface Props {
  initialClips: ClipRow[]
  adminKey: string | undefined
}

export function ClipManagerClient({ initialClips }: Props) {
  const [clips, setClips] = useState<ClipRow[]>(initialClips)
  const [editingId, setEditingId] = useState<string | null>(null)   // null = nuevo clip
  const [showEditor, setShowEditor] = useState(false)
  const [form, setForm] = useState<Omit<ClipRow, 'id'>>(emptyClip())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const filteredClips = clips.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase()) ||
    c.youtube_id.toLowerCase().includes(search.toLowerCase())
  )

  function openNew() {
    setEditingId(null)
    setForm(emptyClip())
    setShowEditor(true)
    setError(null)
  }

  function openEdit(clip: ClipRow) {
    setEditingId(clip.id)
    setForm({
      youtube_id: clip.youtube_id,
      start_sec: clip.start_sec,
      end_sec: clip.end_sec,
      title: clip.title,
      category: clip.category,
      characters: [...clip.characters],
    })
    setShowEditor(true)
    setError(null)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      if (editingId) {
        const updated = await updateClip(editingId, form)
        setClips(prev => prev.map(c => c.id === editingId ? updated : c))
      } else {
        const created = await createClip(form)
        setClips(prev => [...prev, created])
      }
      setShowEditor(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este clip?')) return
    try {
      await deleteClip(id)
      setClips(prev => prev.filter(c => c.id !== id))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al eliminar')
    }
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex gap-3 items-center">
        <input
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-500"
          placeholder="Buscar por título, categoría o ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button
          onClick={openNew}
          className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Nuevo clip
        </button>
      </div>

      {/* Editor modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center p-6 overflow-y-auto">
          <div className="bg-gray-900 rounded-2xl w-full max-w-4xl shadow-2xl border border-gray-700 mt-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold">
                {editingId ? '✏️ Editar clip' : '➕ Nuevo clip'}
              </h2>
              <button
                onClick={() => setShowEditor(false)}
                className="text-gray-400 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Columna izquierda: preview + timestamps */}
              <div className="space-y-4">
                <YouTubeTimestampPicker
                  form={form}
                  onChange={setForm}
                />
              </div>

              {/* Columna derecha: metadatos */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Título</label>
                  <input
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Scrat y la bellota — Ice Age"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Categoría</label>
                  <select
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <CharacterEditor
                  characters={form.characters}
                  onChange={chars => setForm(f => ({ ...f, characters: chars }))}
                />

                {error && (
                  <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowEditor(false)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !form.youtube_id || !form.title}
                    className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    {saving ? 'Guardando...' : '💾 Guardar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de clips */}
      <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 text-gray-400 text-xs uppercase">
              <th className="text-left px-4 py-3">Título</th>
              <th className="text-left px-4 py-3">Categoría</th>
              <th className="text-left px-4 py-3">YouTube ID</th>
              <th className="text-left px-4 py-3">Tiempo</th>
              <th className="text-left px-4 py-3">Personajes</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filteredClips.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-gray-500 py-8">
                  No hay clips
                </td>
              </tr>
            )}
            {filteredClips.map(clip => (
              <tr key={clip.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                <td className="px-4 py-3 font-medium">{clip.title}</td>
                <td className="px-4 py-3">
                  <span className="bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full text-xs">
                    {clip.category}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <a
                    href={`https://youtu.be/${clip.youtube_id}?t=${clip.start_sec}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 font-mono text-xs"
                  >
                    {clip.youtube_id}
                  </a>
                </td>
                <td className="px-4 py-3 text-gray-300 font-mono text-xs">
                  {formatTime(clip.start_sec)} → {formatTime(clip.end_sec)}{' '}
                  <span className="text-gray-500">
                    ({clip.end_sec - clip.start_sec}s)
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {clip.characters.map(ch => (
                      <span key={ch} className="bg-purple-900/50 text-purple-300 px-1.5 py-0.5 rounded text-xs">
                        {ch}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => openEdit(clip)}
                      className="text-gray-400 hover:text-white transition-colors text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => handleDelete(clip.id)}
                      className="text-gray-400 hover:text-red-400 transition-colors text-xs px-2 py-1 bg-gray-700 hover:bg-red-900/30 rounded"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// YouTubeTimestampPicker
// Preview del vídeo con controles para marcar start/end
// ══════════════════════════════════════════════════════════════════════════════
interface PickerProps {
  form: Omit<ClipRow, 'id'>
  onChange: (f: Omit<ClipRow, 'id'>) => void
}

function YouTubeTimestampPicker({ form, onChange }: PickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YT.Player | null>(null)
  const [ytInput, setYtInput] = useState(form.youtube_id)
  const [loaded, setLoaded] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Sincroniza el input si el form.youtube_id cambia desde fuera
  useEffect(() => {
    setYtInput(form.youtube_id)
  }, [form.youtube_id])

  const destroyPlayer = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current)
    if (playerRef.current) {
      playerRef.current.destroy()
      playerRef.current = null
    }
    setLoaded(false)
  }, [])

  const initPlayer = useCallback((videoId: string) => {
    if (!containerRef.current) return
    destroyPlayer()

    const create = () => {
      if (!containerRef.current) return
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: { controls: 1, rel: 0, modestbranding: 1 },
        events: {
          onReady: () => {
            setLoaded(true)
            tickRef.current = setInterval(() => {
              const t = playerRef.current?.getCurrentTime() ?? 0
              setCurrentTime(Math.floor(t))
            }, 500)
          },
        },
      })
    }

    if (window.YT?.Player) {
      create()
    } else if (document.getElementById('youtube-iframe-api')) {
      const prev = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => { prev?.(); create() }
    } else {
      window.onYouTubeIframeAPIReady = create
      const script = document.createElement('script')
      script.id = 'youtube-iframe-api'
      script.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(script)
    }
  }, [destroyPlayer])

  useEffect(() => () => destroyPlayer(), [destroyPlayer])

  function handleLoad() {
    const id = extractYouTubeId(ytInput)
    if (!id) return
    onChange({ ...form, youtube_id: id })
    initPlayer(id)
  }

  function markStart() {
    const t = playerRef.current?.getCurrentTime() ?? 0
    onChange({ ...form, start_sec: Math.floor(t) })
  }

  function markEnd() {
    const t = playerRef.current?.getCurrentTime() ?? 0
    onChange({ ...form, end_sec: Math.ceil(t) })
  }

  function previewClip() {
    if (!playerRef.current) return
    playerRef.current.seekTo(form.start_sec, true)
    playerRef.current.playVideo()
    // Para al llegar a end_sec
    const check = setInterval(() => {
      const t = playerRef.current?.getCurrentTime() ?? 0
      if (t >= form.end_sec) {
        playerRef.current?.pauseVideo()
        clearInterval(check)
      }
    }, 200)
  }

  return (
    <div className="space-y-3">
      {/* Input YouTube URL/ID */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">YouTube URL o ID</label>
        <div className="flex gap-2">
          <input
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-purple-500"
            value={ytInput}
            onChange={e => setYtInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLoad()}
            placeholder="dQw4w9WgXcQ  ó  https://youtu.be/..."
          />
          <button
            onClick={handleLoad}
            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
          >
            Cargar ▶
          </button>
        </div>
      </div>

      {/* Player */}
      <div className="relative w-full aspect-video bg-gray-800 rounded-xl overflow-hidden">
        <div ref={containerRef} className="absolute inset-0 w-full h-full" />
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
            {form.youtube_id ? 'Cargando...' : 'Introduce un ID y pulsa Cargar'}
          </div>
        )}
      </div>

      {/* Tiempo actual */}
      {loaded && (
        <p className="text-center text-gray-400 text-xs font-mono">
          Tiempo actual: <span className="text-white">{formatTime(currentTime)}</span>
        </p>
      )}

      {/* Botones de timestamp */}
      <div className="grid grid-cols-2 gap-2">
        <button
          disabled={!loaded}
          onClick={markStart}
          className="bg-green-700 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          📍 Marcar inicio ({formatTime(form.start_sec)})
        </button>
        <button
          disabled={!loaded}
          onClick={markEnd}
          className="bg-red-700 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          🏁 Marcar fin ({formatTime(form.end_sec)})
        </button>
      </div>

      {/* Input manual de segundos */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Inicio (segundos)</label>
          <input
            type="number"
            min={0}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-purple-500"
            value={form.start_sec}
            onChange={e => onChange({ ...form, start_sec: Number(e.target.value) })}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Fin (segundos)</label>
          <input
            type="number"
            min={0}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-purple-500"
            value={form.end_sec}
            onChange={e => onChange({ ...form, end_sec: Number(e.target.value) })}
          />
        </div>
      </div>

      {/* Preview del clip */}
      <button
        disabled={!loaded || form.start_sec >= form.end_sec}
        onClick={previewClip}
        className="w-full bg-purple-700 hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        ▶ Preview del clip ({formatTime(form.start_sec)} → {formatTime(form.end_sec)},{' '}
        {form.end_sec - form.start_sec}s)
      </button>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// CharacterEditor
// Lista editable de personajes del clip
// ══════════════════════════════════════════════════════════════════════════════
interface CharacterEditorProps {
  characters: string[]
  onChange: (chars: string[]) => void
}

function CharacterEditor({ characters, onChange }: CharacterEditorProps) {
  const [input, setInput] = useState('')

  function addCharacter() {
    const name = input.trim()
    if (!name || characters.includes(name)) return
    onChange([...characters, name])
    setInput('')
  }

  function removeCharacter(name: string) {
    onChange(characters.filter(c => c !== name))
  }

  return (
    <div>
      <label className="block text-sm text-gray-400 mb-2">
        Personajes{' '}
        <span className="text-gray-600 text-xs">
          (cada jugador recibirá uno al empezar la ronda)
        </span>
      </label>

      <div className="flex flex-wrap gap-2 mb-2 min-h-[36px]">
        {characters.length === 0 && (
          <span className="text-gray-600 text-xs italic">Sin personajes</span>
        )}
        {characters.map(ch => (
          <span
            key={ch}
            className="flex items-center gap-1 bg-purple-900/50 text-purple-300 border border-purple-700/50 px-2 py-1 rounded-full text-xs"
          >
            {ch}
            <button
              onClick={() => removeCharacter(ch)}
              className="text-purple-400 hover:text-red-400 leading-none"
            >
              ×
            </button>
          </span>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-purple-500"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addCharacter()}
          placeholder="Nombre del personaje (Enter para añadir)"
        />
        <button
          onClick={addCharacter}
          className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
        >
          +
        </button>
      </div>
    </div>
  )
}
