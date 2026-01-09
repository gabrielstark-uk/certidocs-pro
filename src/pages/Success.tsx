import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Download, Mail, FileText, Shield, ArrowRight, Loader2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function Success() {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const sessionId = searchParams.get('session_id');
  const [isLoading, setIsLoading] = useState(true);
  const [certification, setCertification] = useState<any>(null);

  useEffect(() => {
    async function verifyCertification() {
      if (!sessionId) {
        setIsLoading(false);
        return;
      }

      try {
        // Call edge function to verify payment and get certification
        const { data, error } = await supabase.functions.invoke('verify-payment', {
          body: { sessionId },
        });

        if (error) throw error;

        if (data?.certification) {
          setCertification(data.certification);
        }
      } catch (error) {
        console.error('Verification error:', error);
        toast({
          title: 'Verification Issue',
          description: 'We could not verify your payment. Please contact support.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }

    verifyCertification();
  }, [sessionId, toast]);

  const handleDownload = async () => {
    if (!certification) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-certificate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ certificationId: certification.id }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate certificate');
      }

      // Get the HTML content and create a download
      const html = await response.text();
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `CertiDocs-${certification.document_id}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Download Error',
        description: 'Failed to generate certificate. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-accent mx-auto mb-4" />
            <p className="text-muted-foreground">Verifying your payment...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        <div className="container py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-20 h-20 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle2 className="w-10 h-10" />
            </motion.div>

            <h1 className="font-display text-4xl font-bold text-foreground mb-4">
              Certification Complete!
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8">
              Your digital evidence has been successfully certified. You can now download 
              your official certificate and documentation.
            </p>

            {certification && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-card border border-border rounded-xl p-6 mb-8"
              >
                <div className="grid gap-4 md:grid-cols-2 text-left mb-6">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Document ID
                    </label>
                    <p className="font-mono text-sm text-foreground mt-1">
                      {certification.document_id}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Certified At
                    </label>
                    <p className="text-sm text-foreground mt-1">
                      {new Date(certification.certified_at).toLocaleString()} UTC
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Files Certified
                    </label>
                    <p className="text-sm text-foreground mt-1">
                      {certification.total_files} {certification.total_files === 1 ? 'file' : 'files'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Expires
                    </label>
                    <p className="text-sm text-foreground mt-1">
                      {new Date(certification.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <Button variant="accent" size="lg" className="w-full" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Certificate
                </Button>
              </motion.div>
            )}

            <div className="grid gap-4 md:grid-cols-3 mb-8">
              <div className="p-4 bg-muted/50 rounded-lg">
                <FileText className="w-6 h-6 text-accent mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  PDF Certificate with cryptographic proof
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <Shield className="w-6 h-6 text-accent mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  SHA-256 hashes for each file
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <Mail className="w-6 h-6 text-accent mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Email confirmation sent
                </p>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="outline" size="lg" asChild>
                <Link to="/upload">
                  Certify More Documents
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button variant="ghost" size="lg" asChild>
                <Link to="/">
                  Return Home
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
