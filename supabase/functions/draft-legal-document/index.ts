import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting for expensive AI calls
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5; // AI requests per hour
const RATE_WINDOW = 3600000; // 1 hour in ms

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

// Sanitize user input to prevent prompt injection
function sanitizeInput(value: string): string {
  return value
    .trim()
    .replace(/[\r\n]+/g, ' ')  // Remove newlines that could break prompt structure
    .replace(/[\t]+/g, ' ')     // Remove tabs
    .substring(0, 2000);        // Length limit per field
}

// Check for injection patterns
function hasInjectionPattern(value: string): boolean {
  const injectionPatterns = [
    /ignore (previous|all|above) instructions?/i,
    /system prompt/i,
    /you are now/i,
    /jailbreak/i,
    /forget (everything|all|your)/i,
    /disregard/i,
  ];
  
  for (const pattern of injectionPatterns) {
    if (pattern.test(value)) {
      return true;
    }
  }
  return false;
}

interface DraftRequest {
  documentType: string;
  details: Record<string, string>;
}

const DOCUMENT_PROMPTS: Record<string, string> = {
  "witness-statement": `You are a UK legal document specialist. Draft a formal Witness Statement following UK court requirements.
Include:
- Court header (use placeholder if not specified)
- Statement number
- Witness name, address, occupation
- Statement of truth
- Proper paragraph numbering
- UK legal formatting conventions

The statement must be suitable for use in UK civil or family court proceedings.`,

  "letter-before-action": `You are a UK legal document specialist. Draft a formal Letter Before Action (Pre-Action Protocol Letter) following UK court practice directions.
Include:
- Sender and recipient details
- Date
- Subject line with "LETTER BEFORE ACTION" header
- Clear statement of the claim
- Summary of facts
- Legal basis
- Remedy sought
- Deadline for response (typically 14-28 days)
- Warning of legal proceedings
- Proper UK legal formatting

Follow the relevant Pre-Action Protocol as applicable.`,

  "statutory-declaration": `You are a UK legal document specialist. Draft a Statutory Declaration in accordance with the Statutory Declarations Act 1835.
Include:
- Declarant's full name, address, and occupation
- Declaration heading
- Numbered paragraphs with the declaration content
- Statement: "And I make this solemn declaration conscientiously believing the same to be true and by virtue of the Statutory Declarations Act 1835"
- Space for signature and date
- Space for commissioner/solicitor attestation
- Proper UK legal formatting`,

  "affidavit": `You are a UK legal document specialist. Draft an Affidavit suitable for use in UK court proceedings.
Include:
- Court header with case details
- Deponent's name, address, and occupation
- Affidavit number (First/Second etc)
- Numbered paragraphs
- Jurat: "SWORN at [place] this [date] Before me [Commissioner name and details]"
- Proper exhibit references if needed
- UK court formatting conventions`,

  "contract": `You are a UK legal document specialist. Draft a formal Contract governed by the laws of England and Wales.
Include:
- Parties clause with full legal names and addresses
- Recitals (Background)
- Definitions and Interpretation
- Main operative clauses
- Payment terms if applicable
- Term and termination
- Liability and indemnity clauses
- Force majeure
- Dispute resolution (UK courts jurisdiction)
- Governing law clause (England and Wales)
- Execution blocks for signatures
- Proper UK commercial contract formatting`,

  "nda": `You are a UK legal document specialist. Draft a Non-Disclosure Agreement (NDA) governed by the laws of England and Wales.
Include:
- Parties with full legal details
- Definitions (Confidential Information, Disclosing Party, Receiving Party)
- Obligations of confidentiality
- Permitted disclosures
- Duration of obligations
- Return/destruction of information
- Remedies for breach
- Governing law (England and Wales)
- Jurisdiction clause
- Signature blocks
- Professional UK legal formatting`,

  "power-of-attorney": `You are a UK legal document specialist. Draft a General Power of Attorney in accordance with the Powers of Attorney Act 1971.
Include:
- Donor's full details
- Attorney's full details
- Scope of authority granted
- Commencement and duration
- Revocation provisions
- Execution requirements
- Witness attestation clause
- Note that this is NOT a Lasting Power of Attorney
- Proper UK legal formatting`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting for expensive AI calls
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    if (!checkRateLimit(ip)) {
      console.log("Rate limit exceeded for IP:", ip);
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { documentType, details }: DraftRequest = body;
    
    console.log("Drafting document type:", documentType);

    // Input validation
    if (!documentType || typeof documentType !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid document type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!details || typeof details !== "object") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid details" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const CLAUDE_API_KEY = Deno.env.get("ClaudeOpus");
    if (!CLAUDE_API_KEY) {
      throw new Error("Claude API key is not configured");
    }

    const systemPrompt = DOCUMENT_PROMPTS[documentType];
    if (!systemPrompt) {
      return new Response(
        JSON.stringify({ error: "Unknown document type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sanitize and validate all user inputs
    const sanitizedDetails: Record<string, string> = {};
    for (const [key, value] of Object.entries(details)) {
      if (typeof value !== "string") continue;
      
      // Check for injection patterns
      if (hasInjectionPattern(value)) {
        console.log("Potential prompt injection detected in field:", key);
        return new Response(
          JSON.stringify({ error: "Invalid input detected" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      sanitizedDetails[key] = sanitizeInput(value);
    }

    const userPrompt = `Please draft the document with the following details:

${Object.entries(sanitizedDetails)
  .map(([key, value]) => `${key}: ${value}`)
  .join("\n")}

Draft the complete document with all required sections. Use professional UK legal language and formatting. Output the document text only, no explanations or meta-commentary.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-opus-4-5-20251101",
        max_tokens: 8192,
        system: systemPrompt,
        messages: [
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Claude API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: "Invalid API key. Please check your Claude API key." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const documentContent = data.content?.[0]?.text;

    if (!documentContent) {
      console.error("Unexpected response structure:", JSON.stringify(data));
      throw new Error("No content generated from Claude");
    }

    console.log("Document drafted successfully with Claude Opus, length:", documentContent.length);

    return new Response(
      JSON.stringify({ 
        success: true, 
        content: documentContent,
        documentType 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error: any) {
    console.error("Error drafting document:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
