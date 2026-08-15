import { CircleAlert } from 'lucide-react'

import { cn } from '@/lib/utils'

export function ErrorMessage({
  message,
  className,
}: {
  message: string
  className?: string
}) {
  return (
    <p
      role="alert"
      className={cn(
        'flex animate-fade-in-up items-start gap-2 rounded-lg border border-crimson/40 bg-crimson/10 px-3 py-2 text-sm text-crimson',
        className
      )}
    >
      <CircleAlert className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </p>
  )
}
