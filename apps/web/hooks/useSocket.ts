'use client'

import { useEffect, useState, useCallback } from 'react'
import { getSocket } from '@/lib/socket'
import type { Socket } from 'socket.io-client'

type SocketStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting'

interface UseSocketReturn {
  socket: Socket
  status: SocketStatus
  isConnected: boolean
}

export function useSocket(): UseSocketReturn {
  const socket = getSocket()
  const [status, setStatus] = useState<SocketStatus>(
    socket.connected ? 'connected' : 'disconnected'
  )

  const handleConnect = useCallback(() => setStatus('connected'), [])
  const handleDisconnect = useCallback(() => setStatus('disconnected'), [])
  const handleConnectError = useCallback(() => setStatus('disconnected'), [])
  const handleReconnectAttempt = useCallback(() => setStatus('reconnecting'), [])
  const handleReconnect = useCallback(() => setStatus('connected'), [])

  useEffect(() => {
    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('connect_error', handleConnectError)
    socket.io.on('reconnect_attempt', handleReconnectAttempt)
    socket.io.on('reconnect', handleReconnect)

    if (!socket.connected) {
      socket.connect()
    }

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('connect_error', handleConnectError)
      socket.io.off('reconnect_attempt', handleReconnectAttempt)
      socket.io.off('reconnect', handleReconnect)
      // NO desconectamos aquí — el socket es un singleton compartido
    }
  }, [socket, handleConnect, handleDisconnect, handleConnectError, handleReconnectAttempt, handleReconnect])

  return {
    socket,
    status,
    isConnected: status === 'connected',
  }
}
