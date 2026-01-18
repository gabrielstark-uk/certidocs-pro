import { Link, useLocation } from 'react-router-dom';
import { Logo } from './Logo';
import { Button } from './ui/button';
import { FileCheck, Info, User, LogOut, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/components/ThemeProvider';

export function Header() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  const handleSignOut = async () => {
    await signOut();
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

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
            size="icon"
            onClick={toggleTheme}
            className={cn(
              isHome && 'text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10'
            )}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>

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

          {user ? (
            <>
              <Button 
                variant="ghost" 
                size="sm" 
                asChild
                className={cn(
                  isHome && 'text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10'
                )}
              >
                <Link to="/dashboard">
                  <User className="w-4 h-4 mr-1" />
                  Dashboard
                </Link>
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleSignOut}
                className={cn(
                  isHome && 'text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10'
                )}
              >
                <LogOut className="w-4 h-4 mr-1" />
                Sign Out
              </Button>
            </>
          ) : (
            <Button 
              variant={isHome ? "ghost" : "outline"} 
              size="sm" 
              asChild
              className={cn(
                isHome && 'text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 border border-primary-foreground/20'
              )}
            >
              <Link to="/auth">
                <User className="w-4 h-4 mr-1" />
                Sign In
              </Link>
            </Button>
          )}
          
          {!isHome && (
            <Button variant="default" size="sm" asChild>
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