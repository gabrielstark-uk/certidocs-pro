import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory rate limiting (resets on function cold start)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 20; // requests per minute
const RATE_WINDOW = 60000; // 1 minute in ms

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }
  
  if (record.count >= RATE_LIMIT) {
    return false;
  }
  
  record.count++;
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    if (!checkRateLimit(ip)) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { certificationId, documentId } = await req.json();

    // Support lookup by either certificationId or documentId
    if (!certificationId && !documentId) {
      return new Response(
        JSON.stringify({ error: "Missing certification ID or document ID" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // If certificationId provided, validate UUID format
    if (certificationId) {
      if (typeof certificationId !== "string") {
        return new Response(
          JSON.stringify({ error: "Invalid certification ID" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(certificationId)) {
        return new Response(
          JSON.stringify({ error: "Invalid certification ID format" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Validate documentId if provided
    if (documentId && (typeof documentId !== "string" || documentId.length > 100)) {
      return new Response(
        JSON.stringify({ error: "Invalid document ID" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Fetching certification:", certificationId || documentId);

    let query = supabase
      .from("certifications")
      .select("id, document_id, document_type, total_files, status, created_at, combined_hash, certified_at");

    if (certificationId) {
      query = query.eq("id", certificationId);
    }
    if (documentId) {
      query = query.eq("document_id", documentId);
    }

    const { data: certification, error: certError } = await query.single();

    if (certError || !certification) {
      console.log("Certification not found");
      return new Response(
        JSON.stringify({ error: "Certification not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Return only non-sensitive fields
    return new Response(
      JSON.stringify({
        certification: {
          id: certification.id,
          document_id: certification.document_id,
          document_type: certification.document_type,
          total_files: certification.total_files,
          status: certification.status,
          created_at: certification.created_at,
          combined_hash: certification.combined_hash,
          certified_at: certification.certified_at,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Get certification error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
