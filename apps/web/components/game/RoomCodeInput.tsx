'use client'

import * as React from 'react'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { ROOM_CODE_LENGTH, normalizeRoomCode } from '@/lib/room'

interface RoomCodeInputProps
  extends Omit<React.ComponentProps<typeof Input>, 'onChange' | 'value'> {
  value: string
  onValueChange: (code: string) => void
}

/** Input del código de sala: 4 caracteres, siempre en mayúsculas. */
export const RoomCodeInput = React.forwardRef<
  HTMLInputElement,
  RoomCodeInputProps
>(({ value, onValueChange, className, ...props }, ref) => (
  <Input
    ref={ref}
    value={value}
    onChange={(event) => onValueChange(normalizeRoomCode(event.target.value))}
    maxLength={ROOM_CODE_LENGTH}
    inputMode="text"
    autoCapitalize="characters"
    autoComplete="off"
    autoCorrect="off"
    spellCheck={false}
    placeholder="ABCD"
    aria-label="Código de sala"
    className={cn(
      'h-14 text-center font-mono text-2xl font-bold uppercase tracking-[0.5em] placeholder:tracking-[0.5em] placeholder:text-muted-foreground/40 sm:h-16 sm:text-3xl',
      className
    )}
    {...props}
  />
))
RoomCodeInput.displayName = 'RoomCodeInput'
