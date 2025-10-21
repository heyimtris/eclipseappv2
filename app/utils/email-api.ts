// Using global fetch available in Node 18+

const EMAIL_API = process.env.EMAIL_API;
const EMAIL_USER = process.env.EMAIL_USER;

if (!EMAIL_USER || !EMAIL_API) {
  throw new Error("EMAIL_USER and EMAIL_API must be set in environment variables");
}

export async function send2FACode(to: string, code: string) {
  const response = await fetch('https://api.mailersend.com/v1/email', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${EMAIL_API}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: {
        email: EMAIL_USER,
        name: 'Eclipse'
      },
      to: [{ email: to }],
      subject: 'Your Eclipse 2FA Code',
      text: `Your Eclipse verification code is: ${code}`,
      html: `<p>Your Eclipse verification code is: <b>${code}</b></p>`
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`MailerSend API error: ${response.status} - ${error}`);
  }
}
