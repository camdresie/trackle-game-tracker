
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

// Initialize Resend with API key from environment variables
const resendApiKey = Deno.env.get("RESEND_API_KEY");
if (!resendApiKey) {
  console.error("RESEND_API_KEY environment variable is not set");
}

const resend = new Resend(resendApiKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SupportEmailRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Log request for debugging
    console.log("Processing support email request");
    
    const { name, email, subject, message }: SupportEmailRequest = await req.json();

    // Input validation
    if (!name || !email || !subject || !message) {
      return new Response(
        JSON.stringify({ 
          error: "Missing required fields. Please provide name, email, subject and message." 
        }),
        { 
          status: 400, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    // Log the request for debugging
    console.log(`Sending support email from ${name} (${email}): ${subject}`);
    console.log("Resend API key length:", resendApiKey ? resendApiKey.length : 0, "characters");

    // Send email to support
    const emailResponse = await resend.emails.send({
      from: "Trackle Support <support@ontrackle.com>",
      to: ["support@ontrackle.com"],
      subject: `[Support Request] ${subject}`,
      reply_to: email,
      html: `
        <h1>New Support Request</h1>
        <p><strong>From:</strong> ${name} (${email})</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <h2>Message:</h2>
        <p>${message.replace(/\n/g, '<br/>')}</p>
      `,
    });

    // Log successful email sending
    console.log("Support email sent successfully:", emailResponse);

    // Send confirmation email to user
    await resend.emails.send({
      from: "Trackle Support <support@ontrackle.com>",
      to: [email],
      subject: "We've received your message - Trackle Support",
      html: `
        <h1>Thank you for contacting us, ${name}!</h1>
        <p>We have received your message regarding: <strong>${subject}</strong></p>
        <p>Our support team will review your request and get back to you as soon as possible.</p>
        <p>For reference, here's a copy of your message:</p>
        <blockquote style="border-left: 4px solid #ccc; padding-left: 16px; margin: 16px 0;">
          ${message.replace(/\n/g, '<br/>')}
        </blockquote>
        <p>Best regards,<br>The Trackle Support Team</p>
      `,
    });

    return new Response(
      JSON.stringify({ success: true, id: emailResponse.id }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-support-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
