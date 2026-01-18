import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRICING: Record<string, { name: string; price: number }> = {
  single: { name: "Single Certified Document", price: 799 },
  report: { name: "Evidence Report", price: 1999 },
  bundle: { name: "Court-Ready Bundle", price: 3999 },
};

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // checkout attempts per minute
const RATE_WINDOW = 60000; // 1 minute

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
      console.log("Rate limit exceeded for IP:", ip);
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const stripeKey = Deno.env.get("Stripe");
    if (!stripeKey) {
      console.error("Stripe secret key not configured");
      throw new Error("Payment service not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { certificationId, documentType, email, documentId } = body;

    console.log("Creating checkout session for:", { certificationId, documentType });

    // Input validation
    if (!certificationId || typeof certificationId !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid certification ID" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!documentType || typeof documentType !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid document type" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // UUID format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(certificationId)) {
      return new Response(
        JSON.stringify({ error: "Invalid certification ID format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Email validation if provided
    if (email && typeof email === "string") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email) || email.length > 255) {
        return new Response(
          JSON.stringify({ error: "Invalid email format" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Validate document type
    const pricingTier = PRICING[documentType];
    if (!pricingTier) {
      return new Response(
        JSON.stringify({ error: "Invalid document type" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify certification exists in database
    const { data: certification, error: certError } = await supabase
      .from("certifications")
      .select("*")
      .eq("id", certificationId)
      .single();

    if (certError || !certification) {
      console.error("Certification not found:", certError);
      throw new Error("Certification not found");
    }

    // Check if already paid
    if (certification.status === "paid") {
      throw new Error("This certification has already been paid for");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    // Get the origin for redirect URLs
    const origin = req.headers.get("origin") || "https://certidocs.com";

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: pricingTier.name,
              description: `Document ID: ${certification.document_id}`,
              metadata: {
                certification_id: certificationId,
                document_id: certification.document_id,
              },
            },
            unit_amount: pricingTier.price,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/${certificationId}`,
      customer_email: email || undefined,
      metadata: {
        certification_id: certificationId,
        document_id: certification.document_id,
        document_type: documentType,
      },
    });

    console.log("Checkout session created:", session.id);

    // Update certification with pending payment info
    await supabase
      .from("certifications")
      .update({
        status: "processing",
        payment_intent_id: session.payment_intent as string,
      })
      .eq("id", certificationId);

    // Log the checkout attempt
    await supabase.from("audit_logs").insert({
      certification_id: certificationId,
      action: "checkout_initiated",
      details: {
        session_id: session.id,
        amount: pricingTier.price,
        currency: "gbp",
      },
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Create checkout error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
