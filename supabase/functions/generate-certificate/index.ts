import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const formatDocumentType = (type: string): string => {
  switch (type) {
    case "single": return "Single Certified Document";
    case "report": return "Evidence Report";
    case "bundle": return "Court-Ready Bundle";
    default: return "Certified Document";
  }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { certificationId } = await req.json();

    console.log("Generating certificate for:", certificationId);

    if (!certificationId) {
      throw new Error("Missing certification ID");
    }

    // Fetch certification with files
    const { data: certification, error: certError } = await supabase
      .from("certifications")
      .select("*")
      .eq("id", certificationId)
      .single();

    if (certError || !certification) {
      console.error("Certification not found:", certError);
      throw new Error("Certification not found");
    }

    // Verify payment status
    if (certification.status !== "paid") {
      throw new Error("Certificate is only available for paid certifications");
    }

    // Fetch associated files
    const { data: files, error: filesError } = await supabase
      .from("certification_files")
      .select("*")
      .eq("certification_id", certificationId)
      .order("exhibit_label", { ascending: true });

    if (filesError) {
      console.error("Error fetching files:", filesError);
    }

    // Increment download count
    await supabase
      .from("certifications")
      .update({ download_count: (certification.download_count || 0) + 1 })
      .eq("id", certificationId);

    // Log download
    await supabase.from("audit_logs").insert({
      certification_id: certificationId,
      action: "certificate_downloaded",
      details: {
        download_number: (certification.download_count || 0) + 1,
      },
    });

    // Generate HTML certificate
    const fileRows = (files || []).map((file: any) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${file.exhibit_label || "-"}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${file.file_name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-family: monospace; font-size: 10px; word-break: break-all;">${file.file_hash}</td>
      </tr>
    `).join("");

    const certificateHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Certificate of Digital Evidence - ${certification.document_id}</title>
  <style>
    @page { size: A4; margin: 20mm; }
    body { 
      font-family: 'Times New Roman', serif; 
      max-width: 800px; 
      margin: 0 auto; 
      padding: 40px;
      color: #1f2937;
      line-height: 1.6;
    }
    .header { 
      text-align: center; 
      border-bottom: 3px double #1e3a5f; 
      padding-bottom: 30px; 
      margin-bottom: 30px;
    }
    .logo { font-size: 36px; font-weight: bold; color: #1e3a5f; margin-bottom: 8px; }
    .subtitle { font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 2px; }
    .title { 
      font-size: 28px; 
      text-align: center; 
      margin: 40px 0; 
      color: #1e3a5f;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .section { margin: 30px 0; }
    .section-title { 
      font-size: 14px; 
      font-weight: bold; 
      color: #1e3a5f; 
      text-transform: uppercase; 
      letter-spacing: 1px;
      margin-bottom: 15px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 8px;
    }
    .detail-row { display: flex; margin: 10px 0; }
    .detail-label { width: 180px; font-weight: bold; color: #4b5563; }
    .detail-value { flex: 1; }
    .hash { 
      font-family: 'Courier New', monospace; 
      font-size: 11px; 
      background: #f3f4f6; 
      padding: 12px; 
      border-radius: 4px;
      word-break: break-all;
      margin-top: 8px;
    }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th { 
      background: #1e3a5f; 
      color: white; 
      padding: 12px; 
      text-align: left; 
      font-size: 12px;
      text-transform: uppercase;
    }
    .disclaimer { 
      background: #fef3c7; 
      border: 1px solid #fbbf24; 
      padding: 20px; 
      margin-top: 40px; 
      font-size: 12px;
      border-radius: 4px;
    }
    .footer { 
      text-align: center; 
      margin-top: 50px; 
      padding-top: 20px; 
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #6b7280;
    }
    .seal {
      width: 120px;
      height: 120px;
      border: 3px solid #1e3a5f;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 30px auto;
      text-align: center;
      color: #1e3a5f;
    }
    .seal-inner {
      font-size: 11px;
      font-weight: bold;
      text-transform: uppercase;
      line-height: 1.3;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">CertiDocs</div>
    <div class="subtitle">Digital Evidence Certification Service</div>
  </div>

  <h1 class="title">Certificate of Digital Evidence</h1>

  <div class="section">
    <div class="section-title">Certification Details</div>
    <div class="detail-row">
      <span class="detail-label">Document ID:</span>
      <span class="detail-value" style="font-family: monospace; font-weight: bold;">${certification.document_id}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Certificate Type:</span>
      <span class="detail-value">${formatDocumentType(certification.document_type)}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Total Files:</span>
      <span class="detail-value">${certification.total_files}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Certified At:</span>
      <span class="detail-value">${new Date(certification.certified_at).toLocaleString("en-US", { 
        dateStyle: "full", 
        timeStyle: "long",
        timeZone: "UTC"
      })} UTC</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Valid Until:</span>
      <span class="detail-value">${new Date(certification.expires_at).toLocaleString("en-US", { 
        dateStyle: "full",
        timeZone: "UTC"
      })}</span>
    </div>
    ${certification.combined_hash ? `
    <div class="detail-row">
      <span class="detail-label">Combined Hash (SHA-256):</span>
    </div>
    <div class="hash">${certification.combined_hash}</div>
    ` : ""}
  </div>

  ${(files && files.length > 0) ? `
  <div class="section">
    <div class="section-title">Certified Files</div>
    <table>
      <thead>
        <tr>
          <th style="width: 80px;">Exhibit</th>
          <th>File Name</th>
          <th style="width: 280px;">SHA-256 Hash</th>
        </tr>
      </thead>
      <tbody>
        ${fileRows}
      </tbody>
    </table>
  </div>
  ` : ""}

  <div class="seal">
    <div class="seal-inner">
      Digitally<br>Certified<br>✓
    </div>
  </div>

  <div class="section">
    <div class="section-title">Verification Statement</div>
    <p>
      This certificate confirms that the above-listed digital file(s) existed in their exact form 
      at the time of certification. The SHA-256 cryptographic hash(es) provide a unique fingerprint 
      that can be used to verify the integrity of the original file(s).
    </p>
    <p>
      Any modification to a certified file, no matter how small, will result in a completely 
      different hash value, thereby indicating tampering or alteration.
    </p>
  </div>

  <div class="disclaimer">
    <strong>Important Notice:</strong> This certificate attests to the cryptographic integrity 
    and timestamp of the certified digital files only. CertiDocs is not a legal authority and 
    this certificate does not constitute legal notarization. For use in legal proceedings, 
    please consult with a qualified legal professional regarding admissibility requirements 
    in your jurisdiction.
  </div>

  <div class="footer">
    <p>Generated by CertiDocs • ${new Date().toISOString()}</p>
    <p>Verify at: certidocs.com/verify/${certification.document_id}</p>
  </div>
</body>
</html>
    `;

    console.log("Certificate generated successfully");

    return new Response(certificateHtml, {
      status: 200,
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `attachment; filename="CertiDocs-${certification.document_id}.html"`,
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Generate certificate error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
