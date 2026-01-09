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

    const { certificationId, documentType, email } = await req.json();

    console.log("Creating checkout session for:", { certificationId, documentType, email });

    // Validate required fields
    if (!certificationId || !documentType) {
      throw new Error("Missing required fields: certificationId and documentType");
    }

    // Validate document type
    const pricingTier = PRICING[documentType];
    if (!pricingTier) {
      throw new Error(`Invalid document type: ${documentType}`);
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
