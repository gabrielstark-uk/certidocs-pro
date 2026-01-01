import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReceiptEmailRequest {
  email: string;
  documentId: string;
  documentType: "single" | "report" | "bundle";
  totalFiles: number;
  paymentAmount: number;
  certifiedAt: string;
  downloadUrl: string;
}

const formatDocumentType = (type: string): string => {
  switch (type) {
    case "single": return "Single Certified Document";
    case "report": return "Evidence Report";
    case "bundle": return "Court-Ready Bundle";
    default: return "Certified Document";
  }
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount / 100);
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      email,
      documentId,
      documentType,
      totalFiles,
      paymentAmount,
      certifiedAt,
      downloadUrl,
    }: ReceiptEmailRequest = await req.json();

    console.log("Sending receipt email to:", email);

    const emailResponse = await resend.emails.send({
      from: "CertiDocs <noreply@certidocs.com>",
      to: [email],
      subject: `Your CertiDocs Certificate is Ready - ${documentId}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Certificate is Ready</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #1e3a5f; padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">CertiDocs</h1>
              <p style="margin: 8px 0 0; color: #94a3b8; font-size: 14px;">Digital Evidence Certification</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; color: #1e3a5f; font-size: 24px; font-weight: 600;">Your Certificate is Ready</h2>
              <p style="margin: 0 0 24px; color: #64748b; font-size: 16px; line-height: 1.6;">
                Thank you for using CertiDocs. Your digital evidence has been successfully certified and is now available for download.
              </p>
              
              <!-- Order Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <h3 style="margin: 0 0 16px; color: #1e3a5f; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Certificate Details</h3>
                    
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Document ID</td>
                        <td style="padding: 8px 0; color: #1e3a5f; font-size: 14px; font-weight: 600; text-align: right; font-family: monospace;">${documentId}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Certificate Type</td>
                        <td style="padding: 8px 0; color: #1e3a5f; font-size: 14px; font-weight: 600; text-align: right;">${formatDocumentType(documentType)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Files Certified</td>
                        <td style="padding: 8px 0; color: #1e3a5f; font-size: 14px; font-weight: 600; text-align: right;">${totalFiles} file${totalFiles > 1 ? "s" : ""}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Certified At</td>
                        <td style="padding: 8px 0; color: #1e3a5f; font-size: 14px; font-weight: 600; text-align: right;">${new Date(certifiedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })} UTC</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding-top: 16px; border-top: 1px solid #e2e8f0;"></td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #1e3a5f; font-size: 16px; font-weight: 600;">Total Paid</td>
                        <td style="padding: 8px 0; color: #1e3a5f; font-size: 18px; font-weight: 700; text-align: right;">${formatCurrency(paymentAmount)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Download Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 8px 0 32px;">
                    <a href="${downloadUrl}" style="display: inline-block; background-color: #1e3a5f; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      Download Your Certificate
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 16px; color: #64748b; font-size: 14px; line-height: 1.6;">
                Your certificate will be available for download for <strong>7 days</strong>. After this period, the files will be permanently deleted from our servers.
              </p>
              
              <!-- Disclaimer -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border-radius: 8px; padding: 16px; margin-top: 24px;">
                <tr>
                  <td>
                    <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 1.5;">
                      <strong>Important:</strong> CertiDocs certifies the integrity, timestamp, and provenance of digital files only. This is not a legal notarization and does not constitute legal advice. For court submissions, consult with a qualified legal professional.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 8px; color: #64748b; font-size: 14px;">
                Questions? Contact us at support@certidocs.com
              </p>
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                © ${new Date().getFullYear()} CertiDocs. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending receipt email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

Deno.serve(handler);
