import { motion } from 'framer-motion';
import { Shield, Clock, Hash, FileText, Lock, AlertTriangle } from 'lucide-react';
import { UploadedFile, DocumentType, PRICING } from '@/types/certification';
import { formatTimestamp, formatFileSize, computeCombinedHash } from '@/lib/hash';

interface CertificationPreviewProps {
  files: UploadedFile[];
  documentType: DocumentType;
  documentId: string;
}

export function CertificationPreview({ files, documentType, documentId }: CertificationPreviewProps) {
  const tier = PRICING[documentType];
  const now = new Date();
  const hashes = files.filter(f => f.hash).map(f => f.hash!);
  const combinedHash = hashes.length > 1 ? computeCombinedHash(hashes) : hashes[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="certificate-paper p-8 max-w-3xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-8 pb-6 border-b border-certificate-border">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-6 h-6 text-accent" />
            <span className="text-sm font-semibold text-accent uppercase tracking-wide">
              Certificate Preview
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Digital Evidence Certification
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{tier.name}</p>
        </div>
        
        <div className="seal-badge">
          <Lock className="w-6 h-6 text-primary" />
        </div>
      </div>

      {/* Document Info */}
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Document ID
          </label>
          <p className="font-mono text-sm text-foreground bg-muted px-3 py-2 rounded">
            {documentId}
          </p>
        </div>
        
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Certification Timestamp
          </label>
          <div className="flex items-center gap-2 text-sm text-foreground bg-muted px-3 py-2 rounded">
            <Clock className="w-4 h-4 text-muted-foreground" />
            {formatTimestamp(now)}
          </div>
        </div>
      </div>

      {/* Combined Hash */}
      {combinedHash && (
        <div className="mb-8 p-4 bg-muted/50 rounded-lg border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Hash className="w-4 h-4 text-accent" />
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {files.length > 1 ? 'Combined SHA-256 Hash' : 'SHA-256 Hash'}
            </label>
          </div>
          <p className="font-mono text-xs text-foreground break-all">
            {combinedHash}
          </p>
        </div>
      )}

      {/* Evidence Files */}
      <div className="mb-8">
        <h3 className="font-display text-lg font-semibold text-foreground mb-4">
          Certified Evidence ({files.length} {files.length === 1 ? 'file' : 'files'})
        </h3>
        
        <div className="space-y-3">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-4 p-3 bg-card border border-border rounded-lg"
            >
              <div className="w-10 h-10 rounded bg-muted flex items-center justify-center font-display font-semibold text-muted-foreground">
                {file.exhibitLabel}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground truncate">
                    Exhibit {file.exhibitLabel}: {file.name}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                  <span>{formatFileSize(file.size)}</span>
                  {file.hash && (
                    <span className="font-mono text-accent">
                      SHA-256: {file.hash.substring(0, 16)}...
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
          <div className="text-sm text-foreground">
            <p className="font-semibold mb-1">Important Disclaimer</p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              This certificate attests to the integrity, timestamp, and provenance of the uploaded 
              files only. CertiDocs does not verify the accuracy, authenticity, or legal validity 
              of the content. This certification is not a substitute for legal advice, official 
              notarization, or court authentication. The certified files have been cryptographically 
              hashed and timestamped at the moment of certification.
            </p>
          </div>
        </div>
      </div>

      {/* Watermark */}
      <div className="mt-8 pt-6 border-t border-certificate-border text-center">
        <p className="text-xs text-muted-foreground">
          Preview Only • Payment required to unlock official certificate
        </p>
      </div>
    </motion.div>
  );
}
