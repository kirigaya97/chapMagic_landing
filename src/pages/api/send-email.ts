import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import siteConfig from '../../data/site-config.json';

export const prerender = false;

const resend = new Resend(import.meta.env.RESEND_API_KEY);

const escapeHtml = (value: unknown) =>
    String(value ?? '')
        .slice(0, 5000)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

const field = (label: string, value: string) => `
                    <div style="margin-bottom: 24px;">
                        <p style="color: #D4AF37; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 4px;">${label}</p>
                        <p style="font-size: 18px; margin: 0;">${value}</p>
                    </div>`;

export const POST: APIRoute = async ({ request }) => {
    try {
        const data = await request.json();
        const { website, _timestamp } = data;
        // Event quote form (/eventos) sends the event details; home contact only name/email/message.
        const name = escapeHtml(data.name);
        const email = String(data.email ?? '').trim();
        const message = escapeHtml(data.message);
        const eventType = escapeHtml(data.eventTypeLabel || data.eventType);

        // --- Anti-spam: Honeypot check ---
        // If the hidden "website" field has any value, it's a bot
        if (website) {
            // Silently return success to not alert the bot
            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // --- Anti-spam: Timestamp check ---
        // If form was submitted in less than 2 seconds, it's likely a bot
        const submissionTime = Date.now() - Number(_timestamp);
        if (submissionTime < 2000) {
            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // --- Validation ---
        if (!name || !email || (!message && !eventType)) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Basic email format check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return new Response(JSON.stringify({ error: 'Invalid email format' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // --- Send email via Resend ---
        const destinationEmail = siteConfig.contact.formDestinationEmail;

        const details = [
            ['Tipo de evento', eventType],
            ['Teléfono', escapeHtml(data.phone)],
            ['Fecha', escapeHtml(data.eventDate)],
            ['Ciudad', escapeHtml(data.city)],
            ['Invitados', escapeHtml(data.guests)],
            ['Página', escapeHtml(data.page)],
        ]
            .filter(([, value]) => value)
            .map(([label, value]) => field(label, value))
            .join('');

        const attribution =
            data.attribution && typeof data.attribution === 'object'
                ? Object.entries(data.attribution as Record<string, unknown>)
                      .map(([key, value]) => `${escapeHtml(key)}: ${escapeHtml(value)}`)
                      .join('<br>')
                : '';

        const { error } = await resend.emails.send({
            from: 'ChapMagic Web <noreply@chapmagic.com>',
            to: [destinationEmail],
            replyTo: email,
            // Plain text, not HTML: unescaped values.
            subject: data.eventType
                ? `🎩 Presupuesto ${data.eventTypeLabel || data.eventType}: ${data.name}`
                : `💌 Nuevo contacto: ${data.name}`,
            html: `
                <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0A0A0A; color: #F5F0E8; padding: 40px; border-radius: 12px;">
                    <div style="text-align: center; margin-bottom: 32px; border-bottom: 1px solid #2A2A2A; padding-bottom: 24px;">
                        <h1 style="color: #D4AF37; font-size: 24px; margin: 0;">CHAP<span style="color: #F5F0E8;">MAGIC</span></h1>
                        <p style="color: #D9D0C0; font-size: 12px; letter-spacing: 3px; margin-top: 8px;">NUEVO MENSAJE DE CONTACTO</p>
                    </div>
                    <div style="margin-bottom: 24px;">
                        <p style="color: #D4AF37; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 4px;">Nombre</p>
                        <p style="font-size: 18px; margin: 0;">${name}</p>
                    </div>
                    <div style="margin-bottom: 24px;">
                        <p style="color: #D4AF37; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 4px;">Email</p>
                        <p style="font-size: 18px; margin: 0;"><a href="mailto:${escapeHtml(email)}" style="color: #D4AF37;">${escapeHtml(email)}</a></p>
                    </div>${details}
                    ${message ? `<div style="margin-bottom: 24px; padding: 20px; background: #1A1A1A; border-radius: 8px; border-left: 3px solid #D4AF37;">
                        <p style="color: #D4AF37; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px;">Mensaje</p>
                        <p style="font-size: 16px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${message}</p>
                    </div>` : ''}
                    ${attribution ? field('Campaña', attribution) : ''}
                    <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #2A2A2A;">
                        <p style="color: #D9D0C0; font-size: 11px;">Puedes responder directamente a este email para contactar a ${name}</p>
                    </div>
                </div>
            `,
        });

        if (error) {
            console.error('Resend error:', error);
            return new Response(JSON.stringify({ error: 'Failed to send email' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Server error:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
