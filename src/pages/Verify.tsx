import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Shield, FileCheck, Clock, Hash, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/Logo';
import { Footer } from '@/components/Footer';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface VerificationResult {
  id: string;
  document_id: string;
  document_type: string;
  total_files: number;
  status: string;
  created_at: string;
}

export default function Verify() {
  const [documentId, setDocumentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState('');

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentId.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('get-certification', {
        body: { documentId: documentId.trim() },
      });

      if (fnError) throw fnError;
      if (data?.error) {
        setError('No certificate found with that Document ID.');
        return;
      }

      setResult(data.certification);
    } catch {
      setError('Could not verify. Please check the Document ID and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-card">
        <div className="container flex items-center justify-between py-4">
          <Link to="/"><Logo size="md" /></Link>
          <Link to="/auth">
            <Button variant="outline" size="sm">Sign In</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 container py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mx-auto mb-6">
            <Search className="w-8 h-8" />
          </div>

          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Verify a Certificate
          </h1>
          <p className="text-muted-foreground mb-8">
            Enter a Document ID to verify the authenticity of a CertiDocs certificate.
          </p>

          <form onSubmit={handleVerify} className="flex gap-3 max-w-lg mx-auto mb-12">
            <Input
              value={documentId}
              onChange={(e) => setDocumentId(e.target.value)}
              placeholder="Enter Document ID (e.g., CD-XXXXXX)"
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !documentId.trim()}>
              {loading ? 'Verifying...' : 'Verify'}
            </Button>
          </form>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-6 rounded-xl bg-destructive/10 border border-destructive/30 text-center"
            >
              <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-3" />
              <p className="text-foreground font-medium">{error}</p>
            </motion.div>
          )}

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-8 rounded-xl bg-card border-2 border-accent/30 text-left"
            >
              <div className="flex items-center gap-3 mb-6">
                <CheckCircle2 className="w-8 h-8 text-accent" />
                <div>
                  <h2 className="font-display text-xl font-bold text-foreground">
                    Certificate Verified
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    This is an authentic CertiDocs certificate
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 rounded-lg bg-muted">
                  <div className="flex items-center gap-2 mb-1">
                    <Hash className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Document ID</span>
                  </div>
                  <p className="font-mono text-sm text-foreground">{result.document_id}</p>
                </div>

                <div className="p-4 rounded-lg bg-muted">
                  <div className="flex items-center gap-2 mb-1">
                    <FileCheck className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Type</span>
                  </div>
                  <p className="text-sm text-foreground capitalize">{result.document_type}</p>
                </div>

                <div className="p-4 rounded-lg bg-muted">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Certified</span>
                  </div>
                  <p className="text-sm text-foreground">
                    {new Date(result.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-muted">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Status</span>
                  </div>
                  <p className="text-sm text-foreground capitalize">{result.status}</p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-accent/10 border border-accent/20 rounded-lg">
                <p className="text-sm text-foreground">
                  <strong>Court-Admissible:</strong> This certificate is fully admissible as evidence in court proceedings.
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
