import { Logo } from './Logo';
import { Shield, Lock, FileCheck } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo size="lg" />
            <p className="mt-4 text-sm text-muted-foreground max-w-md">
            CertiDocs provides court-admissible digital certification and legal document 
              drafting services. All certified evidence and drafted legal documents are fully 
              admissible in court proceedings.
            </p>
          </div>

          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Security</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-accent" />
                SHA-256 Hashing
              </li>
              <li className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-accent" />
                Encrypted Storage
              </li>
              <li className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-accent" />
                Immutable Timestamps
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Certification Disclaimer
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            © {new Date().getFullYear()} CertiDocs. All rights reserved. 
            All certified documents and drafted legal documents are court-admissible.
          </p>
        </div>
      </div>
    </footer>
  );
}
