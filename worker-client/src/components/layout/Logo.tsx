import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
}

export function Logo({ className }: LogoProps) {
  return (
    <img
      src="/logo.svg"
      alt="WorkerHub"
      className={cn('h-9 w-9 rounded-xl', className)}
      width={1211}
      height={1211}
    />
  )
}
