const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const claudeApiKey = Deno.env.get("Claude");
    if (!claudeApiKey) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { caseType, description, evidence, opposingArguments } = await req.json();

    if (!caseType || typeof caseType !== "string" || caseType.length > 200) {
      return new Response(
        JSON.stringify({ error: "Invalid case type" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!description || typeof description !== "string" || description.length > 5000) {
      return new Response(
        JSON.stringify({ error: "Invalid description" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const prompt = `You are an expert UK legal analyst. Analyse the following case and provide a structured assessment.

Case Type: ${caseType}
Case Description: ${description}
${evidence ? `Evidence Available: ${evidence}` : ''}
${opposingArguments ? `Known Opposing Arguments: ${opposingArguments}` : ''}

Provide your response as a JSON object with exactly these fields:
- "probability": a number 0-100 representing the estimated probability of success
- "assessment": a 2-3 paragraph overall assessment of the case
- "strengths": an array of 3-5 key strengths of the case
- "weaknesses": an array of 2-4 potential weaknesses or risks
- "recommendations": an array of 3-5 actionable recommendations

Respond ONLY with the JSON object, no other text.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": claudeApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Claude API error:", errorText);
      return new Response(
        JSON.stringify({ error: "AI analysis failed. Please try again." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || "";

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(
        JSON.stringify({ error: "Failed to parse analysis" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const analysis = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(analysis), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Analysis error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
