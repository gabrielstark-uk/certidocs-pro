import { Link, useLocation } from 'react-router-dom';
import { Logo } from './Logo';
import { Button } from './ui/button';
import { FileCheck, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Header() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <header className={cn(
      'sticky top-0 z-50 w-full border-b transition-colors duration-200',
      isHome 
        ? 'border-primary-foreground/10 bg-primary' 
        : 'border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60'
    )}>
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center">
          <Logo variant={isHome ? 'light' : 'default'} />
        </Link>

        <nav className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            asChild
            className={cn(
              isHome && 'text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10'
            )}
          >
            <Link to="/how-it-works">
              <Info className="w-4 h-4 mr-1" />
              How It Works
            </Link>
          </Button>
          
          {!isHome && (
            <Button variant="hero" size="sm" asChild>
              <Link to="/upload">
                <FileCheck className="w-4 h-4 mr-1" />
                Certify Documents
              </Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
