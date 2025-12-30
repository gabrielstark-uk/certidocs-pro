-- Create enum for document types
CREATE TYPE document_type AS ENUM ('single', 'report', 'bundle');

-- Create enum for certification status
CREATE TYPE certification_status AS ENUM ('pending', 'processing', 'ready', 'paid', 'expired');

-- Create certifications table
CREATE TABLE public.certifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id TEXT NOT NULL UNIQUE,
  email TEXT,
  document_type document_type NOT NULL DEFAULT 'single',
  status certification_status NOT NULL DEFAULT 'pending',
  total_files INTEGER NOT NULL DEFAULT 0,
  combined_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  certified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  payment_intent_id TEXT,
  payment_amount INTEGER,
  payment_currency TEXT DEFAULT 'usd',
  download_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create files table for individual uploaded files
CREATE TABLE public.certification_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  certification_id UUID NOT NULL REFERENCES public.certifications(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  file_hash TEXT NOT NULL,
  exhibit_label TEXT,
  storage_path TEXT,
  upload_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create audit log table
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  certification_id UUID REFERENCES public.certifications(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certification_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for certifications (public access for guest checkout)
CREATE POLICY "Anyone can create certifications"
  ON public.certifications
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view certifications by document_id"
  ON public.certifications
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can update their own certifications"
  ON public.certifications
  FOR UPDATE
  USING (true);

-- Create policies for certification files
CREATE POLICY "Anyone can create certification files"
  ON public.certification_files
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view certification files"
  ON public.certification_files
  FOR SELECT
  USING (true);

-- Create policies for audit logs
CREATE POLICY "Anyone can create audit logs"
  ON public.audit_logs
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Audit logs are viewable by all"
  ON public.audit_logs
  FOR SELECT
  USING (true);

-- Create indexes for performance
CREATE INDEX idx_certifications_document_id ON public.certifications(document_id);
CREATE INDEX idx_certifications_status ON public.certifications(status);
CREATE INDEX idx_certification_files_certification_id ON public.certification_files(certification_id);
CREATE INDEX idx_audit_logs_certification_id ON public.audit_logs(certification_id);

-- Create storage bucket for evidence files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'evidence-files',
  'evidence-files',
  false,
  104857600,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'audio/mpeg', 'audio/wav', 'audio/mp4', 'video/mp4', 'video/quicktime', 'video/webm', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- Storage policies for evidence files bucket
CREATE POLICY "Anyone can upload evidence files"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'evidence-files');

CREATE POLICY "Anyone can view evidence files"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'evidence-files');

CREATE POLICY "Anyone can update evidence files"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'evidence-files');

CREATE POLICY "Anyone can delete evidence files"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'evidence-files');