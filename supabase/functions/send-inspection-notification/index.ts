import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InspectionData {
  id: string;
  model: string;
  serial_number: string;
  horimeter: number;
  inspection_date: string;
  general_observations?: string;
  has_fault_codes: boolean;
  fault_codes_description?: string;
  process_type: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Iniciando envio de notificação de inspeção...");
    
    const inspectionData: InspectionData = await req.json();
    console.log("Dados da inspeção recebidos:", inspectionData.id);

    // Criar cliente Supabase com service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar supervisores da CBMaq
    const { data: supervisors, error: supervisorsError } = await supabase
      .from("profiles")
      .select("email, full_name")
      .like("email", "%@cbmaq.com.br")
      .not("email", "is", null);

    if (supervisorsError) {
      console.error("Erro ao buscar supervisores:", supervisorsError);
      throw supervisorsError;
    }

    if (!supervisors || supervisors.length === 0) {
      console.log("Nenhum supervisor encontrado com email @cbmaq.com.br");
      return new Response(
        JSON.stringify({ message: "Nenhum supervisor encontrado" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Encontrados ${supervisors.length} supervisores`);
    console.log("Emails dos supervisores:", supervisors.map(s => s.email).join(", "));

    // Buscar itens da inspeção
    const { data: items } = await supabase
      .from("inspection_items")
      .select("category, item_description, entry_status, problem_description")
      .eq("inspection_id", inspectionData.id);

    // Construir HTML do email
    const appUrl = "https://webhbnhgsbvlynseiloc.lovableproject.com";
    const inspectionUrl = `${appUrl}/inspecao/${inspectionData.id}`;
    console.log("URL da inspeção:", inspectionUrl);

    const itemsHtml = items && items.length > 0 ? `
      <div style="margin: 20px 0; padding: 15px; background-color: #f9fafb; border-radius: 8px;">
        <h3 style="color: #374151; margin-top: 0;">Itens Inspecionados</h3>
        ${items.slice(0, 10).map(item => `
          <div style="margin: 8px 0; padding: 8px; background-color: white; border-radius: 4px;">
            <strong>${item.item_description}</strong>: 
            <span style="color: ${item.entry_status === 'conforme' ? '#10b981' : item.entry_status === 'nao_conforme' ? '#ef4444' : '#6b7280'}">
              ${item.entry_status === 'conforme' ? '✓ Conforme' : item.entry_status === 'nao_conforme' ? '✗ Não Conforme' : '— N/A'}
            </span>
            ${item.problem_description ? `<br><span style="color: #6b7280; font-size: 14px;">Obs: ${item.problem_description}</span>` : ''}
          </div>
        `).join('')}
        ${items.length > 10 ? `<p style="color: #6b7280; font-size: 14px; margin-top: 10px;">... e mais ${items.length - 10} itens</p>` : ''}
      </div>
    ` : '';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🔔 Processo PDI Target Finalizado</h1>
          </div>
          
          <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-top: 0;">Um novo processo de inspeção PDI Target foi finalizado e aguarda sua revisão.</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #1f2937; margin-top: 0; font-size: 18px;">Informações da Máquina</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Modelo:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${inspectionData.model}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Nº de Série:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${inspectionData.serial_number}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Horímetro:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${inspectionData.horimeter}h</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Data:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${new Date(inspectionData.inspection_date).toLocaleDateString('pt-BR')}</td>
                </tr>
              </table>
            </div>

            ${itemsHtml}

            ${inspectionData.general_observations ? `
              <div style="margin: 20px 0; padding: 15px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                <h3 style="color: #92400e; margin-top: 0; font-size: 16px;">Observações Gerais</h3>
                <p style="color: #78350f; margin: 0;">${inspectionData.general_observations}</p>
              </div>
            ` : ''}

            ${inspectionData.has_fault_codes && inspectionData.fault_codes_description ? `
              <div style="margin: 20px 0; padding: 15px; background-color: #fee2e2; border-left: 4px solid #ef4444; border-radius: 4px;">
                <h3 style="color: #991b1b; margin-top: 0; font-size: 16px;">⚠️ Códigos de Falha Detectados</h3>
                <p style="color: #7f1d1d; margin: 0;">${inspectionData.fault_codes_description}</p>
              </div>
            ` : ''}

            <div style="text-align: center; margin: 30px 0;">
              <a href="${inspectionUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Visualizar Inspeção Completa
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

            <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 0;">
              CBMaq Inspeções - Sistema de Inspeção Técnica<br>
              Este é um email automático, por favor não responda.
            </p>
          </div>
        </body>
      </html>
    `;

    // Enviar emails para os supervisores
    const emailResults = await Promise.allSettled(
      supervisors.map(async (supervisor) => {
        console.log(`Enviando email para: ${supervisor.email}`);
        try {
          const result = await resend.emails.send({
            from: "CBMaq Notificações <notificacoes@cbmaq.com.br>",
            to: [supervisor.email],
            subject: `🔔 PDI Target Finalizado - ${inspectionData.model}`,
            html: emailHtml,
          });
          console.log(`✓ Email enviado com sucesso para ${supervisor.email}:`, result);
          return { success: true, email: supervisor.email, result };
        } catch (error) {
          console.error(`✗ Erro ao enviar email para ${supervisor.email}:`, error);
          return { success: false, email: supervisor.email, error };
        }
      })
    );
    
    const successful = emailResults.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = emailResults.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;

    console.log(`=== RESUMO DO ENVIO ===`);
    console.log(`✓ Emails enviados com sucesso: ${successful}`);
    console.log(`✗ Emails com falha: ${failed}`);

    if (failed > 0) {
      const errors = emailResults
        .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
        .map(r => r.reason);
      console.error("Detalhes dos erros:", errors);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successful,
        failed: failed,
        message: `Notificações enviadas para ${successful} supervisor(es)`
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Erro na função send-inspection-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
