import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  variant?: 'default' | 'square' | 'light'
  width  ?: number,
  height? : number
}

export function Logo({ className, variant = 'default', width, height }: LogoProps) {

  if (variant === 'square') {
    return (
      <img
        src="/logo-square.svg"
        alt="WorkerHub"
        className={cn('h-14 w-14 rounded-2xl', className)}
        width={width ?? 1211}
        height={height ?? 1211}
      />
    )
  }

  if (variant === 'light') {
    return (
      <img
        src="/logo-light.svg"
        alt="WorkerHub"
        className={cn('h-9 w-auto', className)}
        width={ width ?? 420}
        height={height ?? 170}
      />
    )
  }

  return (
    <img
      src="/logo.svg"
      alt="WorkerHub"
      className={cn('h-9 w-auto', className)}
      width={width ?? 420}
      height={height ?? 170}
    />
  )
}
