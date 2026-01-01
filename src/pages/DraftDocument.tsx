import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Sparkles, 
  Download, 
  Loader2,
  Scale,
  FileSignature,
  ScrollText,
  Handshake,
  Lock,
  UserCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';

const DOCUMENT_TYPES = [
  {
    id: 'witness-statement',
    name: 'Witness Statement',
    icon: UserCheck,
    description: 'Formal statement for UK court proceedings',
    fields: [
      { key: 'witnessName', label: 'Witness Full Name', type: 'text', required: true },
      { key: 'witnessAddress', label: 'Witness Address', type: 'text', required: true },
      { key: 'witnessOccupation', label: 'Occupation', type: 'text', required: true },
      { key: 'courtName', label: 'Court Name', type: 'text', required: false },
      { key: 'caseNumber', label: 'Case Number', type: 'text', required: false },
      { key: 'statementContent', label: 'Statement Details', type: 'textarea', required: true },
    ],
  },
  {
    id: 'letter-before-action',
    name: 'Letter Before Action',
    icon: FileSignature,
    description: 'Pre-action protocol letter for disputes',
    fields: [
      { key: 'senderName', label: 'Your Full Name/Company', type: 'text', required: true },
      { key: 'senderAddress', label: 'Your Address', type: 'text', required: true },
      { key: 'recipientName', label: 'Recipient Name/Company', type: 'text', required: true },
      { key: 'recipientAddress', label: 'Recipient Address', type: 'text', required: true },
      { key: 'claimDetails', label: 'Details of Your Claim', type: 'textarea', required: true },
      { key: 'amountClaimed', label: 'Amount Claimed (if applicable)', type: 'text', required: false },
      { key: 'remedySought', label: 'Remedy/Action Required', type: 'textarea', required: true },
    ],
  },
  {
    id: 'statutory-declaration',
    name: 'Statutory Declaration',
    icon: ScrollText,
    description: 'Declaration under the Statutory Declarations Act 1835',
    fields: [
      { key: 'declarantName', label: 'Declarant Full Name', type: 'text', required: true },
      { key: 'declarantAddress', label: 'Declarant Address', type: 'text', required: true },
      { key: 'declarantOccupation', label: 'Occupation', type: 'text', required: true },
      { key: 'declarationSubject', label: 'Subject Matter', type: 'text', required: true },
      { key: 'declarationContent', label: 'Declaration Content', type: 'textarea', required: true },
    ],
  },
  {
    id: 'affidavit',
    name: 'Affidavit',
    icon: Scale,
    description: 'Sworn statement for court proceedings',
    fields: [
      { key: 'deponentName', label: 'Deponent Full Name', type: 'text', required: true },
      { key: 'deponentAddress', label: 'Deponent Address', type: 'text', required: true },
      { key: 'deponentOccupation', label: 'Occupation', type: 'text', required: true },
      { key: 'courtName', label: 'Court Name', type: 'text', required: true },
      { key: 'caseNumber', label: 'Case Number', type: 'text', required: true },
      { key: 'affidavitContent', label: 'Affidavit Content', type: 'textarea', required: true },
    ],
  },
  {
    id: 'contract',
    name: 'Contract',
    icon: Handshake,
    description: 'Commercial contract under English law',
    fields: [
      { key: 'party1Name', label: 'Party 1 Name', type: 'text', required: true },
      { key: 'party1Address', label: 'Party 1 Address', type: 'text', required: true },
      { key: 'party2Name', label: 'Party 2 Name', type: 'text', required: true },
      { key: 'party2Address', label: 'Party 2 Address', type: 'text', required: true },
      { key: 'contractPurpose', label: 'Purpose/Subject of Contract', type: 'textarea', required: true },
      { key: 'keyTerms', label: 'Key Terms and Obligations', type: 'textarea', required: true },
      { key: 'paymentTerms', label: 'Payment Terms (if applicable)', type: 'textarea', required: false },
    ],
  },
  {
    id: 'nda',
    name: 'Non-Disclosure Agreement',
    icon: Lock,
    description: 'Confidentiality agreement under English law',
    fields: [
      { key: 'disclosingParty', label: 'Disclosing Party Name', type: 'text', required: true },
      { key: 'disclosingAddress', label: 'Disclosing Party Address', type: 'text', required: true },
      { key: 'receivingParty', label: 'Receiving Party Name', type: 'text', required: true },
      { key: 'receivingAddress', label: 'Receiving Party Address', type: 'text', required: true },
      { key: 'purpose', label: 'Purpose of Disclosure', type: 'textarea', required: true },
      { key: 'confidentialInfo', label: 'Description of Confidential Information', type: 'textarea', required: true },
      { key: 'duration', label: 'Duration of Confidentiality (e.g., 2 years)', type: 'text', required: true },
    ],
  },
];

export default function DraftDocument() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);

  const selectedDoc = DOCUMENT_TYPES.find(d => d.id === selectedType);

  const handleFieldChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleGenerate = async () => {
    if (!selectedType || !selectedDoc) return;

    const missingRequired = selectedDoc.fields
      .filter(f => f.required && !formData[f.key]?.trim())
      .map(f => f.label);

    if (missingRequired.length > 0) {
      toast.error(`Please fill in: ${missingRequired.join(', ')}`);
      return;
    }

    setIsGenerating(true);
    setGeneratedContent(null);

    try {
      const { data, error } = await supabase.functions.invoke('draft-legal-document', {
        body: { documentType: selectedType, details: formData },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to generate document');

      setGeneratedContent(data.content);
      toast.success('Document drafted successfully!');
    } catch (err: any) {
      console.error('Error generating document:', err);
      toast.error(err.message || 'Failed to generate document');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadDocx = async () => {
    if (!generatedContent || !selectedDoc) return;

    try {
      const paragraphs = generatedContent.split('\n').map(line => {
        const trimmed = line.trim();
        
        if (trimmed.match(/^(#|[A-Z]{2,})/)) {
          return new Paragraph({
            children: [new TextRun({ text: trimmed.replace(/^#+\s*/, ''), bold: true, size: 28 })],
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 },
          });
        }
        
        if (trimmed.match(/^(\d+\.|[a-z]\)|\([a-z]\))/)) {
          return new Paragraph({
            children: [new TextRun({ text: trimmed, size: 24 })],
            spacing: { after: 120 },
            indent: { left: 720 },
          });
        }
        
        if (trimmed === '') {
          return new Paragraph({ children: [], spacing: { after: 120 } });
        }

        return new Paragraph({
          children: [new TextRun({ text: trimmed, size: 24 })],
          spacing: { after: 120 },
          alignment: AlignmentType.JUSTIFIED,
        });
      });

      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              children: [new TextRun({ text: selectedDoc.name.toUpperCase(), bold: true, size: 32 })],
              heading: HeadingLevel.TITLE,
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            new Paragraph({
              children: [new TextRun({ text: `Generated by CertiDocs on ${new Date().toLocaleDateString('en-GB')}`, italics: true, size: 20, color: '666666' })],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            ...paragraphs,
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedType}-${Date.now()}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Document downloaded!');
    } catch (err) {
      console.error('Error creating DOCX:', err);
      toast.error('Failed to create DOCX file');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              AI-Powered Legal Drafting
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Draft UK Legal Documents
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Generate professional legal documents compliant with UK law. Our AI drafts 
              documents following proper legal formatting and conventions.
            </p>
          </div>

          {!selectedType ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {DOCUMENT_TYPES.map((docType, index) => (
                <motion.button
                  key={docType.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedType(docType.id)}
                  className="p-6 rounded-xl bg-card border border-border hover:border-accent/50 hover:shadow-elevated transition-all text-left group"
                >
                  <div className="w-12 h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-4 group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                    <docType.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-display font-semibold text-foreground mb-2">
                    {docType.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {docType.description}
                  </p>
                </motion.button>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <Button
                variant="ghost"
                onClick={() => {
                  setSelectedType(null);
                  setFormData({});
                  setGeneratedContent(null);
                }}
                className="mb-4"
              >
                ← Back to document types
              </Button>

              <div className="p-6 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-4 mb-6">
                  {selectedDoc && <selectedDoc.icon className="w-8 h-8 text-accent" />}
                  <div>
                    <h2 className="font-display text-xl font-semibold text-foreground">
                      {selectedDoc?.name}
                    </h2>
                    <p className="text-sm text-muted-foreground">{selectedDoc?.description}</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {selectedDoc?.fields.map(field => (
                    <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                      <Label htmlFor={field.key}>
                        {field.label}
                        {field.required && <span className="text-destructive ml-1">*</span>}
                      </Label>
                      {field.type === 'textarea' ? (
                        <Textarea
                          id={field.key}
                          value={formData[field.key] || ''}
                          onChange={e => handleFieldChange(field.key, e.target.value)}
                          rows={4}
                          className="mt-1"
                          placeholder={`Enter ${field.label.toLowerCase()}...`}
                        />
                      ) : (
                        <Input
                          id={field.key}
                          value={formData[field.key] || ''}
                          onChange={e => handleFieldChange(field.key, e.target.value)}
                          className="mt-1"
                          placeholder={`Enter ${field.label.toLowerCase()}...`}
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    size="lg"
                    className="gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Drafting Document...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate Document
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {generatedContent && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 rounded-xl bg-card border border-border"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
                      <FileText className="w-5 h-5 text-accent" />
                      Generated Document
                    </h3>
                    <Button onClick={handleDownloadDocx} className="gap-2">
                      <Download className="w-4 h-4" />
                      Download DOCX
                    </Button>
                  </div>
                  
                  <div className="p-6 bg-muted/30 rounded-lg border border-border max-h-[500px] overflow-y-auto">
                    <pre className="whitespace-pre-wrap font-mono text-sm text-foreground leading-relaxed">
                      {generatedContent}
                    </pre>
                  </div>

                  <p className="mt-4 text-xs text-muted-foreground">
                    <strong>Disclaimer:</strong> This AI-generated document is a template only. 
                    It should be reviewed by a qualified solicitor before use in any legal proceedings.
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
