import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("Stripe");
    if (!stripeKey) {
      console.error("Stripe secret key not configured");
      throw new Error("Payment service not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { sessionId } = await req.json();

    console.log("Verifying payment for session:", sessionId);

    if (!sessionId) {
      throw new Error("Missing session ID");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent", "line_items"],
    });

    console.log("Session status:", session.payment_status);

    // Verify payment was successful
    if (session.payment_status !== "paid") {
      throw new Error("Payment not completed");
    }

    const certificationId = session.metadata?.certification_id;
    if (!certificationId) {
      throw new Error("No certification ID in session metadata");
    }

    // Get current certification
    const { data: certification, error: certError } = await supabase
      .from("certifications")
      .select("*")
      .eq("id", certificationId)
      .single();

    if (certError || !certification) {
      console.error("Certification not found:", certError);
      throw new Error("Certification not found");
    }

    // Prevent duplicate processing
    if (certification.status === "paid") {
      console.log("Certification already marked as paid");
      return new Response(
        JSON.stringify({
          success: true,
          certification: {
            id: certification.id,
            document_id: certification.document_id,
            document_type: certification.document_type,
            total_files: certification.total_files,
            certified_at: certification.certified_at,
            expires_at: certification.expires_at,
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Calculate expiration based on document type
    const expirationDays: Record<string, number> = {
      single: 7,
      report: 14,
      bundle: 30,
    };
    const days = expirationDays[certification.document_type] || 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    const certifiedAt = new Date().toISOString();

    // Update certification with payment details
    const { error: updateError } = await supabase
      .from("certifications")
      .update({
        status: "paid",
        certified_at: certifiedAt,
        expires_at: expiresAt.toISOString(),
        payment_intent_id: session.payment_intent?.toString() || null,
        payment_amount: session.amount_total,
        payment_currency: session.currency?.toUpperCase() || "GBP",
      })
      .eq("id", certificationId);

    if (updateError) {
      console.error("Failed to update certification:", updateError);
      throw new Error("Failed to update certification status");
    }

    // Log successful payment
    await supabase.from("audit_logs").insert({
      certification_id: certificationId,
      action: "payment_verified",
      details: {
        session_id: sessionId,
        payment_intent: session.payment_intent,
        amount: session.amount_total,
        currency: session.currency,
      },
    });

    console.log("Payment verified and certification updated:", certificationId);

    return new Response(
      JSON.stringify({
        success: true,
        certification: {
          id: certification.id,
          document_id: certification.document_id,
          document_type: certification.document_type,
          total_files: certification.total_files,
          certified_at: certifiedAt,
          expires_at: expiresAt.toISOString(),
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Verify payment error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
