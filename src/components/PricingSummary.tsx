import { motion } from 'framer-motion';
import { CreditCard, Shield, Download, Mail } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { DocumentType, PRICING } from '@/types/certification';

interface PricingSummaryProps {
  documentType: DocumentType;
  fileCount: number;
  email: string;
  setEmail: (email: string) => void;
  onCheckout: () => void;
  isLoading?: boolean;
}

export function PricingSummary({
  documentType,
  fileCount,
  email,
  setEmail,
  onCheckout,
  isLoading,
}: PricingSummaryProps) {
  const tier = PRICING[documentType];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-card border border-border rounded-xl p-6 sticky top-24"
    >
      <h3 className="font-display text-lg font-semibold text-foreground mb-4">
        Order Summary
      </h3>

      <div className="space-y-4 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{tier.name}</span>
          <span className="font-medium text-foreground">
            ${(tier.price / 100).toFixed(2)}
          </span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Files to certify</span>
          <span className="font-medium text-foreground">{fileCount}</span>
        </div>

        <div className="border-t border-border pt-4">
          <div className="flex justify-between">
            <span className="font-semibold text-foreground">Total</span>
            <span className="font-display text-xl font-bold text-foreground">
              ${(tier.price / 100).toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">USD, one-time payment</p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email for receipt & download link
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Optional but recommended for receiving your certificate
          </p>
        </div>
      </div>

      <Button
        variant="accent"
        size="xl"
        className="w-full mb-4"
        onClick={onCheckout}
        disabled={isLoading || fileCount === 0}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
            Processing...
          </span>
        ) : (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            Proceed to Payment
          </>
        )}
      </Button>

      <div className="space-y-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-success" />
          Secure payment via Stripe
        </div>
        <div className="flex items-center gap-2">
          <Download className="w-4 h-4 text-accent" />
          Instant download after payment
        </div>
      </div>
    </motion.div>
  );
}
