import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { FileUploader } from '@/components/FileUploader';
import { DocumentTypeSelector } from '@/components/DocumentTypeSelector';
import { CertificationPreview } from '@/components/CertificationPreview';
import { PricingSummary } from '@/components/PricingSummary';
import { Button } from '@/components/ui/button';
import { UploadedFile, DocumentType } from '@/types/certification';
import { generateDocumentId } from '@/lib/hash';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type Step = 'upload' | 'select' | 'preview';

export default function Upload() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('upload');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [documentType, setDocumentType] = useState<DocumentType>('single');
  const [documentId] = useState(() => generateDocumentId());
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Auto-select document type based on file count
  useEffect(() => {
    if (files.length > 10) {
      setDocumentType('bundle');
    } else if (files.length > 1) {
      setDocumentType('report');
    } else {
      setDocumentType('single');
    }
  }, [files.length]);

  const allFilesReady = files.length > 0 && files.every(f => f.status === 'complete');

  const handleNext = () => {
    if (step === 'upload' && allFilesReady) {
      setStep('select');
    } else if (step === 'select') {
      setStep('preview');
    }
  };

  const handleBack = () => {
    if (step === 'select') {
      setStep('upload');
    } else if (step === 'preview') {
      setStep('select');
    }
  };

  const handleCheckout = async () => {
    if (files.length === 0) {
      toast({
        title: 'No files uploaded',
        description: 'Please upload at least one file to certify.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create certification record
      const { data: certification, error: certError } = await supabase
        .from('certifications')
        .insert({
          document_id: documentId,
          email: email || null,
          document_type: documentType,
          status: 'pending',
          total_files: files.length,
          combined_hash: files.length > 1 
            ? files.map(f => f.hash).sort().join('') 
            : files[0]?.hash,
        })
        .select()
        .single();

      if (certError) throw certError;

      // Create file records
      const fileRecords = files.map(file => ({
        certification_id: certification.id,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        file_hash: file.hash || '',
        exhibit_label: file.exhibitLabel,
      }));

      const { error: filesError } = await supabase
        .from('certification_files')
        .insert(fileRecords);

      if (filesError) throw filesError;

      // Log the action
      await supabase.from('audit_logs').insert({
        certification_id: certification.id,
        action: 'certification_created',
        details: {
          document_type: documentType,
          file_count: files.length,
          email: email || null,
        },
      });

      // Navigate to checkout (Stripe integration will be added)
      toast({
        title: 'Certification prepared',
        description: 'Redirecting to payment...',
      });

      // For now, navigate to success page (Stripe will be integrated)
      navigate(`/checkout/${certification.id}`);
    } catch (error) {
      console.error('Error creating certification:', error);
      toast({
        title: 'Error',
        description: 'Failed to create certification. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Progress Steps */}
        <div className="border-b border-border bg-card">
          <div className="container py-6">
            <div className="flex items-center justify-center gap-4">
              {(['upload', 'select', 'preview'] as Step[]).map((s, index) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      step === s
                        ? 'bg-accent text-accent-foreground'
                        : index < ['upload', 'select', 'preview'].indexOf(step)
                        ? 'bg-success text-success-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className={`ml-2 text-sm ${step === s ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                    {s === 'upload' ? 'Upload Files' : s === 'select' ? 'Select Type' : 'Review & Pay'}
                  </span>
                  {index < 2 && <div className="w-12 h-px bg-border mx-4" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="container py-12">
          {step === 'upload' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="max-w-3xl mx-auto"
            >
              <div className="text-center mb-8">
                <h1 className="font-display text-3xl font-bold text-foreground mb-2">
                  Upload Your Evidence Files
                </h1>
                <p className="text-muted-foreground">
                  Add the files you want to certify. We'll generate cryptographic hashes 
                  for each file to prove their integrity.
                </p>
              </div>

              <FileUploader files={files} setFiles={setFiles} maxFiles={25} />

              <div className="flex justify-end mt-8">
                <Button
                  variant="accent"
                  size="lg"
                  onClick={handleNext}
                  disabled={!allFilesReady}
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'select' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="max-w-5xl mx-auto"
            >
              <div className="text-center mb-8">
                <h1 className="font-display text-3xl font-bold text-foreground mb-2">
                  Select Document Type
                </h1>
                <p className="text-muted-foreground">
                  Choose the certification format that best fits your needs.
                </p>
              </div>

              <DocumentTypeSelector
                selected={documentType}
                onSelect={setDocumentType}
                fileCount={files.length}
              />

              <div className="flex justify-between mt-8">
                <Button variant="outline" size="lg" onClick={handleBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button variant="accent" size="lg" onClick={handleNext}>
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'preview' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="text-center mb-8">
                <h1 className="font-display text-3xl font-bold text-foreground mb-2">
                  Review & Complete Certification
                </h1>
                <p className="text-muted-foreground">
                  Review your certificate preview and proceed to payment.
                </p>
              </div>

              <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <CertificationPreview
                    files={files}
                    documentType={documentType}
                    documentId={documentId}
                  />

                  <div className="mt-6">
                    <Button variant="outline" size="lg" onClick={handleBack}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                  </div>
                </div>

                <div>
                  <PricingSummary
                    documentType={documentType}
                    fileCount={files.length}
                    email={email}
                    setEmail={setEmail}
                    onCheckout={handleCheckout}
                    isLoading={isLoading}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
