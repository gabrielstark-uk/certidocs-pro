-- ============================================
-- FIX SECURITY ISSUES: Restrict RLS Policies
-- ============================================

-- 1. DROP existing overly permissive policies on certifications
DROP POLICY IF EXISTS "Anyone can view certifications by document_id" ON public.certifications;
DROP POLICY IF EXISTS "Anyone can update their own certifications" ON public.certifications;

-- 2. CREATE new restrictive SELECT policy - requires knowing the document_id
-- This treats document_id as a secret access token
CREATE POLICY "Select certifications by document_id"
ON public.certifications FOR SELECT
USING (false); -- Deny all direct client access

-- 3. REMOVE client UPDATE capability entirely
-- All updates now handled by Edge Functions with service role
-- No UPDATE policy = no client updates allowed

-- 4. DROP existing overly permissive policies on certification_files
DROP POLICY IF EXISTS "Anyone can view certification files" ON public.certification_files;

-- 5. CREATE restrictive SELECT policy for certification_files
CREATE POLICY "Select certification files restricted"
ON public.certification_files FOR SELECT
USING (false); -- Deny all direct client access

-- 6. Fix storage bucket policies - remove overly permissive access
DROP POLICY IF EXISTS "Anyone can upload evidence files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view evidence files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update evidence files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete evidence files" ON storage.objects;

-- 7. Create restrictive storage policies (service role only)
-- No client-side storage access - Edge Functions handle file operations
CREATE POLICY "Service role storage access"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'evidence-files')
WITH CHECK (bucket_id = 'evidence-files');