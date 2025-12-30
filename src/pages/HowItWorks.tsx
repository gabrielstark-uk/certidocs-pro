import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Upload, 
  Hash, 
  Clock, 
  CreditCard, 
  Download, 
  Shield,
  FileCheck,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';

const steps = [
  {
    number: 1,
    icon: Upload,
    title: 'Upload Your Evidence',
    description: 'Drag and drop or select your files. We support images, PDFs, audio, video, and text files up to 100MB each.',
  },
  {
    number: 2,
    icon: Hash,
    title: 'Cryptographic Hashing',
    description: 'Each file receives a unique SHA-256 hash—a digital fingerprint that proves the file has not been altered.',
  },
  {
    number: 3,
    icon: Clock,
    title: 'Timestamp Recording',
    description: 'We record the exact UTC timestamp of certification, creating an immutable record of when your evidence existed.',
  },
  {
    number: 4,
    icon: CreditCard,
    title: 'Secure Payment',
    description: 'Complete payment via Stripe. Your certification is locked until payment is confirmed.',
  },
  {
    number: 5,
    icon: Download,
    title: 'Download Certificate',
    description: 'Instantly download your professional PDF certificate with all cryptographic proofs and documentation.',
  },
];

const faqs = [
  {
    question: 'What does CertiDocs certify?',
    answer: 'CertiDocs certifies that your digital files existed in their exact state at a specific point in time. We create cryptographic hashes that prove file integrity and record immutable timestamps.',
  },
  {
    question: 'Is this legally binding or notarization?',
    answer: 'No. CertiDocs is NOT a substitute for legal advice, official notarization, or court authentication. Our certificates attest to file integrity and provenance only—not legal validity.',
  },
  {
    question: 'What file types are supported?',
    answer: 'We support images (JPEG, PNG, GIF, WebP), PDFs, audio (MP3, WAV, M4A), video (MP4, MOV, WebM), and text files. Maximum file size is 100MB per file.',
  },
  {
    question: 'How long are files stored?',
    answer: 'Storage duration depends on your plan: Single (7 days), Report (14 days), Bundle (30 days). After expiration, files are securely deleted.',
  },
  {
    question: 'Can certificates be verified?',
    answer: 'Yes. Each certificate includes the SHA-256 hash which can be independently verified against the original file using standard cryptographic tools.',
  },
  {
    question: 'Is my data secure?',
    answer: 'Yes. Files are encrypted in transit and at rest. We use industry-standard security practices and Stripe for payment processing.',
  },
];

export default function HowItWorks() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto text-center"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm mb-6">
                <Shield className="w-4 h-4" />
                <span>How It Works</span>
              </div>

              <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
                Understanding Digital Evidence Certification
              </h1>

              <p className="text-lg text-muted-foreground">
                CertiDocs uses cryptographic hashing and precise timestamps to create 
                verifiable proof of your digital evidence's existence and integrity.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Process Steps */}
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              {steps.map((step, index) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex gap-6 mb-12 last:mb-0"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 rounded-xl bg-accent text-accent-foreground flex items-center justify-center">
                      <step.icon className="w-6 h-6" />
                    </div>
                    {index < steps.length - 1 && (
                      <div className="w-px h-full bg-border mt-4" />
                    )}
                  </div>
                  <div className="pb-8">
                    <div className="text-sm font-semibold text-accent mb-1">
                      Step {step.number}
                    </div>
                    <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* What We Certify */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-12"
              >
                <h2 className="font-display text-3xl font-bold text-foreground mb-4">
                  What Our Certification Proves
                </h2>
              </motion.div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center gap-2 text-success mb-4">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-semibold">What We Certify</span>
                  </div>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                      File existed at the timestamp of certification
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                      File has not been altered since certification
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                      Cryptographic hash matches original file
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                      Chain of custody from upload to certification
                    </li>
                  </ul>
                </div>

                <div className="bg-card border border-warning/30 rounded-xl p-6">
                  <div className="flex items-center gap-2 text-warning mb-4">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-semibold">What We Don't Certify</span>
                  </div>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                      Accuracy or truthfulness of content
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                      Legal validity or admissibility in court
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                      Authenticity of document source
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                      Official notarization or legal status
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="max-w-3xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-12"
              >
                <h2 className="font-display text-3xl font-bold text-foreground mb-4">
                  Frequently Asked Questions
                </h2>
              </motion.div>

              <div className="space-y-6">
                {faqs.map((faq, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-card border border-border rounded-xl p-6"
                  >
                    <h3 className="font-display font-semibold text-foreground mb-2">
                      {faq.question}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {faq.answer}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-24 gradient-hero text-primary-foreground">
          <div className="container text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-display text-3xl font-bold mb-4">
                Ready to Certify Your Evidence?
              </h2>
              <p className="text-lg text-primary-foreground/80 mb-8 max-w-xl mx-auto">
                Get started in minutes. No account required.
              </p>
              <Button variant="hero-outline" size="xl" asChild className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                <Link to="/upload">
                  <FileCheck className="w-5 h-5 mr-2" />
                  Start Certification
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
