import { Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'light';
}

export function Logo({ className, size = 'md', variant = 'default' }: LogoProps) {
  const sizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn(
        'flex items-center justify-center rounded-lg p-1.5',
        variant === 'default' ? 'bg-primary text-primary-foreground' : 'bg-primary-foreground/10 text-primary-foreground'
      )}>
        <Shield className={iconSizes[size]} />
      </div>
      <span className={cn(
        'font-display font-semibold tracking-tight',
        sizes[size],
        variant === 'default' ? 'text-foreground' : 'text-primary-foreground'
      )}>
        CertiDocs
      </span>
    </div>
  );
}
