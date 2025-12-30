export type DocumentType = 'single' | 'report' | 'bundle';
export type CertificationStatus = 'pending' | 'processing' | 'ready' | 'paid' | 'expired';

export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  hash?: string;
  exhibitLabel?: string;
  uploadProgress: number;
  status: 'pending' | 'uploading' | 'hashing' | 'complete' | 'error';
  errorMessage?: string;
}

export interface Certification {
  id: string;
  documentId: string;
  email?: string;
  documentType: DocumentType;
  status: CertificationStatus;
  totalFiles: number;
  combinedHash?: string;
  createdAt: string;
  certifiedAt?: string;
  expiresAt?: string;
  paymentIntentId?: string;
  paymentAmount?: number;
  paymentCurrency?: string;
  downloadCount?: number;
  files: CertificationFile[];
}

export interface CertificationFile {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileHash: string;
  exhibitLabel?: string;
  storagePath?: string;
  uploadTimestamp: string;
}

export interface PricingTier {
  type: DocumentType;
  name: string;
  description: string;
  price: number;
  features: string[];
}

export const PRICING: Record<DocumentType, PricingTier> = {
  single: {
    type: 'single',
    name: 'Single Certified Document',
    description: 'Certification for a single evidence file',
    price: 999, // $9.99 in cents
    features: [
      'SHA-256 cryptographic hash',
      'UTC timestamp certification',
      'Unique document ID',
      'Professional PDF certificate',
      '7-day secure storage',
    ],
  },
  report: {
    type: 'report',
    name: 'Evidence Report',
    description: 'Comprehensive report for multiple files',
    price: 2499, // $24.99 in cents
    features: [
      'Up to 10 evidence files',
      'Exhibit indexing (A, B, C...)',
      'Combined integrity hash',
      'Professional evidence report',
      'Individual file certificates',
      '14-day secure storage',
    ],
  },
  bundle: {
    type: 'bundle',
    name: 'Court-Ready Bundle',
    description: 'Complete documentation package',
    price: 4999, // $49.99 in cents
    features: [
      'Up to 25 evidence files',
      'Exhibit indexing with descriptions',
      'Full provenance documentation',
      'Cover sheet with case details',
      'Index of exhibits',
      'ZIP bundle with all certificates',
      '30-day secure storage',
    ],
  },
};

export const EXHIBIT_LABELS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
  'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T',
  'U', 'V', 'W', 'X', 'Y', 'Z',
];
