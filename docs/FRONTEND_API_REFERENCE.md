# Frontend API Reference
> Referencia rápida para el frontend. Todo lo que necesitas saber para conectar con el backend sin leer su código.

---

## Conexión Socket.io

```ts
// apps/web/lib/socket.ts — ya existe, úsalo así:
import { getSocket } from '@/lib/socket'

const socket = getSocket()
socket.connect()
```

El socket NO se conecta automáticamente — llama a `socket.connect()` cuando el usuario entre a una sala.

---

## Estado global (Zustand)

```ts
import { useGameStore } from '@/store/gameStore'

const { room, localPlayer, phase, setRoom, setLocalPlayer } = useGameStore()
```

Siempre que recibas `room:updated` del servidor, llama a `setRoom(room)`.

---

## Eventos de Sala

### Crear sala
```ts
socket.emit('room:create', { nickname: 'BoldFox' })
// nickname es opcional — si lo omites el servidor genera uno aleatorio

socket.on('room:updated', ({ room }) => {
  setRoom(room)
  setLocalPlayer(room.players.find(p => p.id === socket.id))
  router.push(`/room/${room.code}`)
})
```

### Unirse a sala
```ts
socket.emit('room:join', { code: 'KRTX', nickname: 'SwiftBear' })
// code debe ser 4 letras mayúsculas

socket.on('room:updated', ({ room }) => {
  setRoom(room)
  setLocalPlayer(room.players.find(p => p.id === socket.id))
})
```

### Actualización del lobby (escucha siempre)
```ts
// Se emite a TODOS los jugadores de la sala cuando alguien entra, sale o cambia algo
socket.on('room:updated', ({ room }) => {
  setRoom(room)
})
```

### Iniciar partida (solo el host)
```ts
socket.emit('room:start', { code: room.code })
// El servidor responde con room:updated con phase: 'record'
```

### Manejo de errores
```ts
socket.on('room:error', ({ message }) => {
  // Muestra toast o mensaje de error al usuario
  console.error(message)
})
```

---

## Tipos (de @dub/shared-types)

```ts
import type { Room, Player, GamePhase, Clip, Recording, RoundScore } from '@dub/shared-types'

// Room
interface Room {
  code: string           // 'KRTX'
  players: Player[]
  phase: GamePhase       // 'lobby' | 'record' | 'playback' | 'vote' | 'results'
  round: number          // ronda actual (empieza en 0)
  maxRounds: number      // por defecto 3
  currentClip: Clip | null
  recordings: Recording[]
}

// Player
interface Player {
  id: string             // socket.id del jugador
  nickname: string
  isHost: boolean        // solo uno por sala
  isReady: boolean
}

// Clip
interface Clip {
  id: string
  youtubeId: string      // ID del vídeo de YouTube
  startSec: number       // segundo de inicio del clip
  endSec: number         // segundo de fin del clip
  title: string
  category: string
}
```

---

## REST API

### Obtener clip aleatorio ✅ IMPLEMENTADA
```ts
// GET /clips/random?exclude=id1,id2
const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/clips/random`)
const clip: Clip = await res.json()

// Para excluir clips ya vistos en la sesión:
const usedIds = ['id1', 'id2']
const res = await fetch(
  `${process.env.NEXT_PUBLIC_SERVER_URL}/clips/random?exclude=${usedIds.join(',')}`
)
const clip: Clip = await res.json()
// Respuesta: { id, youtubeId, startSec, endSec, title, category }
```

### Subir grabación de audio ✅ IMPLEMENTADA
```ts
// POST /audio/upload — multipart/form-data
const formData = new FormData()
formData.append('audioBlob', blob, 'recording.webm')  // blob del MediaRecorder
formData.append('roomCode', room.code)
formData.append('playerId', socket.id)
formData.append('sessionId', sessionId)               // ID único de la ronda, genéralo en el cliente: crypto.randomUUID()

const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/audio/upload`, {
  method: 'POST',
  body: formData,
})
const { url } = await res.json()
// url = URL pública de Supabase Storage para reproducir el audio con <audio src={url} />
```

---

## Fases del juego y qué renderizar

```
'lobby'    → <Lobby />         — lista de jugadores, botón start (host)
'record'   → <AudioRecorder /> — countdown + grabación de micro
'playback' → <Playback />      — reproduce vídeo + audio de cada jugador
'vote'     → <VoteScreen />    — botones de voto
'results'  → <Results />       — ranking y puntuación
```

Escucha `room:updated` y usa `room.phase` para decidir qué componente renderizar en `/room/[code]`.

---

## Identificar al jugador local

```ts
// socket.id es el ID del jugador local
import { getSocket } from '@/lib/socket'
const socket = getSocket()
const localPlayer = room.players.find(p => p.id === socket.id)
const isHost = localPlayer?.isHost ?? false
```

---

## Eventos de juego (fase record → playback → vote → results)

### Cuando empieza la grabación
```ts
// El servidor emite esto al iniciar cada ronda
socket.on('game:start', ({ clip, roundDurationSec }) => {
  // clip: Clip — el vídeo a doblar
  // roundDurationSec: number — segundos para grabar (por defecto 30)
})
```

### Cuando el jugador termina de grabar y sube el audio
```ts
// Después de POST /audio/upload, emite esto:
socket.emit('player:audioReady', {
  playerId: socket.id,
  audioUrl: url, // la URL que devuelve /audio/upload
})
```

### Cuando el frontend termina de reproducir todos los doblajes
```ts
// El host (o cualquier jugador) emite esto para pasar a votación:
socket.emit('game:playbackFinished', { roomCode: room.code })
```

### Para votar
```ts
socket.emit('player:vote', {
  roomCode: room.code,
  targetPlayerId: 'id-del-jugador-votado',
})
```

### Resultados
```ts
socket.on('game:results', ({ scores, isLastRound }) => {
  // scores: RoundScore[] — ranking de la ronda
  // isLastRound: boolean — si es true, la partida termina
})

socket.on('game:end', () => {
  // La partida ha terminado, volver al lobby
})
```

### Cambios de fase
```ts
// El servidor emite esto en cada transición
socket.on('game:phaseChange', ({ phase }) => {
  // phase: GamePhase — 'record' | 'playback' | 'vote' | 'results'
  // También llega en room:updated, usa el que prefieras
})
```

---

## Checklist de conexión (orden recomendado)

- [ ] `socket.connect()` al entrar a `/room/[code]`
- [ ] Escuchar `room:updated` y llamar a `setRoom()` siempre
- [ ] Escuchar `room:error` y mostrar feedback al usuario
- [ ] Escuchar `game:start` para iniciar grabación
- [ ] Emitir `player:audioReady` tras subir el audio
- [ ] Emitir `game:playbackFinished` tras reproducir todos los doblajes
- [ ] Emitir `player:vote` al votar
- [ ] Escuchar `game:results` para mostrar el ranking
- [ ] `socket.disconnect()` al salir de la página (cleanup en useEffect)
- [ ] Usar `room.phase` para renderizar el componente correcto
