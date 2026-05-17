import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { Resend } from 'resend';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { phone, email, title, content } = body;

  // Validate: at least one contact method required
  if (!phone && !email) {
    return NextResponse.json(
      { success: false, errors: ['No phone or email provided'] },
      { status: 400 }
    );
  }

  const errors: string[] = [];

  // Send SMS via Twilio
  if (phone) {
    try {
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );

      await client.messages.create({
        body: `Dairy Reminder: ${title}\n\n${content}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Twilio error:', message);
      errors.push(`SMS failed: ${message}`);
    }
  }

  // Send Email via Resend
  if (email) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from: 'Personal Dairy <onboarding@resend.dev>',
        to: email,
        subject: `Dairy Reminder: ${title}`,
        html: `
          <h2>Dairy Reminder</h2>
          <p><strong>${title}</strong></p>
          <p>${content}</p>
          <hr/>
          <p><small>This is an automated reminder from your Personal Dairy Manager.</small></p>
        `,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Resend error:', message);
      errors.push(`Email failed: ${message}`);
    }
  }

  return NextResponse.json({
    success: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  });
}
