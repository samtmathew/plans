import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
const FROM = 'Plans <noreply@resend.dev>'

export async function sendJoinRequest({
  organiserEmail,
  organiserName,
  joinerName,
  planTitle,
  planId,
}: {
  organiserEmail: string
  organiserName: string
  joinerName: string
  planTitle: string
  planId: string
}) {
  try {
    await resend.emails.send({
      from: FROM,
      to: organiserEmail,
      subject: `${joinerName} wants to join ${planTitle}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#1C1B1B;">
          <h2 style="font-size:20px;margin-bottom:8px;">New join request</h2>
          <p>Hi ${organiserName},</p>
          <p><strong>${joinerName}</strong> has requested to join <strong>${planTitle}</strong>.</p>
          <a href="${APP_URL}/plans/${planId}/manage"
            style="display:inline-block;background:#3D3D8F;color:white;padding:10px 20px;border-radius:20px;text-decoration:none;font-weight:bold;margin-top:8px;">
            Review request →
          </a>
        </div>
      `,
    })
  } catch (err) {
    console.error('[email] sendJoinRequest failed:', err)
  }
}

export async function sendApprovalNotification({
  userEmail,
  userName,
  planTitle,
  planId,
}: {
  userEmail: string
  userName: string
  planTitle: string
  planId: string
}) {
  try {
    await resend.emails.send({
      from: FROM,
      to: userEmail,
      subject: `You're approved for ${planTitle}! 🎉`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#1C1B1B;">
          <h2 style="font-size:20px;margin-bottom:8px;">You're in! 🎉</h2>
          <p>Hi ${userName},</p>
          <p>You've been approved to join <strong>${planTitle}</strong>. Go check it out.</p>
          <a href="${APP_URL}/plans/${planId}"
            style="display:inline-block;background:#3D3D8F;color:white;padding:10px 20px;border-radius:20px;text-decoration:none;font-weight:bold;margin-top:8px;">
            View plan →
          </a>
        </div>
      `,
    })
  } catch (err) {
    console.error('[email] sendApprovalNotification failed:', err)
  }
}
