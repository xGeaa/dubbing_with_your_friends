'use client'

import { Dices } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { randomNickname } from '@/lib/nickname'

const MAX_NICKNAME_LENGTH = 16

interface NicknameFieldProps {
  value: string
  onValueChange: (nickname: string) => void
  disabled?: boolean
  id?: string
}

/** Campo de nickname opcional con botón para generar uno aleatorio. */
export function NicknameField({
  value,
  onValueChange,
  disabled,
  id = 'nickname',
}: NicknameFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
      >
        Tu nombre <span className="normal-case">(opcional)</span>
      </label>
      <div className="flex gap-2">
        <Input
          id={id}
          value={value}
          onChange={(event) =>
            onValueChange(event.target.value.slice(0, MAX_NICKNAME_LENGTH))
          }
          maxLength={MAX_NICKNAME_LENGTH}
          placeholder="BoldFox"
          autoComplete="nickname"
          disabled={disabled}
        />
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="h-12 w-12 shrink-0"
          onClick={() => onValueChange(randomNickname())}
          disabled={disabled}
          aria-label="Generar nombre aleatorio"
          title="Generar nombre aleatorio"
        >
          <Dices />
        </Button>
      </div>
    </div>
  )
}
