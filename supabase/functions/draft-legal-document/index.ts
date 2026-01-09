import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    const { documentType, details }: DraftRequest = await req.json();
    
    console.log("Drafting document type:", documentType);
    console.log("Details provided:", JSON.stringify(details));

    const CLAUDE_API_KEY = Deno.env.get("ClaudeOpus");
    if (!CLAUDE_API_KEY) {
      throw new Error("Claude API key is not configured");
    }

    const systemPrompt = DOCUMENT_PROMPTS[documentType];
    if (!systemPrompt) {
      throw new Error(`Unknown document type: ${documentType}`);
    }

    const userPrompt = `Please draft the document with the following details:

${Object.entries(details)
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
