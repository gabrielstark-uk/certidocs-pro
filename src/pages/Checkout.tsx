import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, CreditCard, Shield, Lock } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { PRICING, DocumentType } from '@/types/certification';
import { useToast } from '@/hooks/use-toast';

interface CertificationData {
  id: string;
  document_id: string;
  document_type: DocumentType;
  total_files: number;
  email: string | null;
}

export default function Checkout() {
  const { certificationId } = useParams<{ certificationId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [certification, setCertification] = useState<CertificationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    async function fetchCertification() {
      if (!certificationId) {
        navigate('/upload');
        return;
      }

      try {
        // Use secure edge function instead of direct DB access
        const { data, error } = await supabase.functions.invoke('get-certification', {
          body: { certificationId },
        });

        if (error || !data?.certification) {
          toast({
            title: 'Certification not found',
            description: 'Please start a new certification.',
            variant: 'destructive',
          });
          navigate('/upload');
          return;
        }

        setCertification(data.certification as CertificationData);
      } catch (err) {
        console.error('Error fetching certification:', err);
        toast({
          title: 'Error',
          description: 'Failed to load certification. Please try again.',
          variant: 'destructive',
        });
        navigate('/upload');
      } finally {
        setIsLoading(false);
      }
    }

    fetchCertification();
  }, [certificationId, navigate, toast]);

  const handlePayment = async () => {
    if (!certification) return;

    setIsProcessing(true);

    try {
      // Call edge function to create Stripe checkout session
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          certificationId: certification.id,
          documentType: certification.document_type,
          email: certification.email,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: 'Payment Error',
        description: 'Failed to initiate payment. Please try again.',
        variant: 'destructive',
      });
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!certification) return null;

  const tier = PRICING[certification.document_type];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        <div className="container py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-lg mx-auto"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-accent/10 text-accent flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8" />
              </div>
              <h1 className="font-display text-3xl font-bold text-foreground mb-2">
                Complete Payment
              </h1>
              <p className="text-muted-foreground">
                Secure checkout powered by Stripe
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 mb-6">
              <h2 className="font-display text-lg font-semibold text-foreground mb-4">
                Order Summary
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Document ID</span>
                  <span className="font-mono text-foreground">{certification.document_id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Document Type</span>
                  <span className="text-foreground">{tier.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Files to Certify</span>
                  <span className="text-foreground">{certification.total_files}</span>
                </div>
                {certification.email && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Receipt Email</span>
                    <span className="text-foreground">{certification.email}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-border pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="font-display text-2xl font-bold text-foreground">
                    ${(tier.price / 100).toFixed(2)} USD
                  </span>
                </div>
              </div>
            </div>

            <Button
              variant="accent"
              size="xl"
              className="w-full mb-6"
              onClick={handlePayment}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Redirecting to Stripe...
                </span>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Pay ${(tier.price / 100).toFixed(2)} with Stripe
                </>
              )}
            </Button>

            <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Shield className="w-4 h-4 text-success" />
                SSL Encrypted
              </div>
              <div className="flex items-center gap-1">
                <Lock className="w-4 h-4 text-success" />
                Secure Payment
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
