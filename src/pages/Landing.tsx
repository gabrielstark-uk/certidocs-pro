import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Shield, 
  FileCheck, 
  Clock, 
  Hash, 
  Lock, 
  Download,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  FileText,
  FileStack,
  FolderArchive
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { Footer } from '@/components/Footer';
import { PRICING } from '@/types/certification';

const features = [
  {
    icon: Hash,
    title: 'SHA-256 Hashing',
    description: 'Every file receives a unique cryptographic fingerprint that proves its contents have not been altered.',
  },
  {
    icon: Clock,
    title: 'Immutable Timestamps',
    description: 'UTC timestamps permanently record when your evidence was certified, creating an irrefutable timeline.',
  },
  {
    icon: Shield,
    title: 'Integrity Certification',
    description: 'Our certificates attest that your files existed in their exact state at the moment of certification.',
  },
  {
    icon: Lock,
    title: 'Secure Storage',
    description: 'Files are encrypted and stored securely for the duration of your chosen retention period.',
  },
  {
    icon: FileCheck,
    title: 'Professional Documents',
    description: 'Generate court-ready evidence reports with exhibit indexing and comprehensive documentation.',
  },
  {
    icon: Download,
    title: 'Instant Download',
    description: 'Receive your certified documents immediately after payment, with email backup included.',
  },
];

const ICONS = {
  single: FileText,
  report: FileStack,
  bundle: FolderArchive,
};

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="gradient-hero text-primary-foreground">
        <header className="container py-6">
          <Logo variant="light" size="lg" />
        </header>

        <div className="container py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 text-sm mb-6">
              <Shield className="w-4 h-4" />
              <span>Digital Evidence Certification</span>
            </div>

            <h1 className="font-display text-4xl md:text-6xl font-bold leading-tight mb-6">
              Certify Your Digital Evidence with Cryptographic Integrity
            </h1>

            <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 max-w-2xl">
              Generate professional certificates that prove when your files existed and that 
              they haven't been tampered with. Perfect for legal documentation, evidence 
              preservation, and proof of provenance.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button variant="hero-outline" size="xl" asChild className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                <Link to="/upload">
                  <FileCheck className="w-5 h-5 mr-2" />
                  Certify Documents
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
              
              <Button variant="ghost" size="xl" asChild className="text-primary-foreground border border-primary-foreground/20 hover:bg-primary-foreground/10">
                <Link to="/how-it-works">
                  Learn How It Works
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="border-b border-border bg-card">
        <div className="container py-8">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-success" />
              <span>SHA-256 Encryption</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-success" />
              <span>Instant Certification</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-success" />
              <span>No Account Required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-success" />
              <span>Secure Payments via Stripe</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 md:py-32">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              How CertiDocs Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our certification process creates an immutable record of your digital evidence, 
              providing proof of existence and integrity.
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 rounded-xl bg-card border border-border hover:shadow-elevated transition-shadow duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 md:py-32 bg-muted/30">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the certification level that fits your needs. No subscriptions, no hidden fees.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            {(Object.entries(PRICING) as [keyof typeof PRICING, typeof PRICING.single][]).map(([key, tier], index) => {
              const Icon = ICONS[key];
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`p-6 rounded-xl bg-card border-2 transition-all duration-300 ${
                    key === 'report' ? 'border-accent shadow-elevated scale-105' : 'border-border hover:border-accent/30'
                  }`}
                >
                  {key === 'report' && (
                    <div className="text-xs font-semibold text-accent uppercase tracking-wide mb-4">
                      Most Popular
                    </div>
                  )}
                  
                  <div className="w-12 h-12 rounded-xl bg-muted text-muted-foreground flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6" />
                  </div>

                  <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                    {tier.name}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground mb-4">
                    {tier.description}
                  </p>

                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-3xl font-display font-bold text-foreground">
                      ${(tier.price / 100).toFixed(2)}
                    </span>
                    <span className="text-sm text-muted-foreground">USD</span>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button 
                    variant={key === 'report' ? 'accent' : 'outline'} 
                    className="w-full"
                    asChild
                  >
                    <Link to="/upload">Get Started</Link>
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-12 border-t border-border">
        <div className="container">
          <div className="max-w-3xl mx-auto p-6 bg-warning/5 border border-warning/20 rounded-xl">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-warning flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-display font-semibold text-foreground mb-2">
                  Important Legal Disclaimer
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  CertiDocs provides digital certification services that attest to file integrity, 
                  timestamps, and provenance only. Our service is <strong>not</strong> a substitute 
                  for legal advice, official notarization, or court-ordered authentication. 
                  CertiDocs does not verify the accuracy or authenticity of file contents, nor 
                  do we provide any form of legal validity to documents. Users should consult 
                  with legal professionals regarding the admissibility and use of certified 
                  documents in legal proceedings.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-32 gradient-hero text-primary-foreground">
        <div className="container text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Ready to Certify Your Evidence?
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8 max-w-xl mx-auto">
              Start now—no account required. Upload, certify, and download in minutes.
            </p>
            <Button variant="hero-outline" size="xl" asChild className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
              <Link to="/upload">
                <FileCheck className="w-5 h-5 mr-2" />
                Certify Documents Now
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
