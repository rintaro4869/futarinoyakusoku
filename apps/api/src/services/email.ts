export type PasswordResetEmailConfig = {
  appUrl: string
  webUrl: string
  resendApiKey?: string
  resetEmailFrom?: string
  resetEmailReplyTo?: string
}

type PasswordResetEmailParams = {
  email: string
  code: string
  locale?: string | null
  config: PasswordResetEmailConfig
}

export class PasswordResetEmailConfigError extends Error {
  constructor(message = 'password reset email is not configured') {
    super(message)
    this.name = 'PasswordResetEmailConfigError'
  }
}

export class PasswordResetEmailSendError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'PasswordResetEmailSendError'
    this.status = status
  }
}

function isLocalUrl(url: string) {
  return (
    url.startsWith('http://localhost') ||
    url.startsWith('https://localhost') ||
    url.startsWith('http://127.0.0.1') ||
    url.startsWith('https://127.0.0.1')
  )
}

export function canBypassPasswordResetEmail(config: PasswordResetEmailConfig) {
  return isLocalUrl(config.appUrl) || isLocalUrl(config.webUrl)
}

export function isPasswordResetEmailConfigured(config: PasswordResetEmailConfig) {
  return Boolean(config.resendApiKey && config.resetEmailFrom)
}

function buildPasswordResetCopy(locale: string | null | undefined, code: string, appUrl: string) {
  if ((locale ?? '').toLowerCase().startsWith('en')) {
    return {
      subject: 'Your Pairlog password reset code',
      text: [
        'We received a request to reset your Pairlog password.',
        '',
        `Your 6-digit code is: ${code}`,
        '',
        'This code expires in 15 minutes.',
        'Open the app again and enter the code on the reset screen.',
        '',
        `Need help? ${appUrl}`,
      ].join('\n'),
      html: [
        '<div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937;">',
        '<h1 style="font-size:20px;margin:0 0 16px;">Pairlog password reset</h1>',
        '<p style="margin:0 0 16px;">We received a request to reset your password.</p>',
        `<p style="margin:0 0 8px;">Your 6-digit code is</p><p style="font-size:32px;font-weight:700;letter-spacing:6px;margin:0 0 16px;">${code}</p>`,
        '<p style="margin:0 0 16px;">This code expires in 15 minutes. Open the app again and enter the code on the reset screen.</p>',
        `<p style="margin:0;">Need help? <a href="${appUrl}">${appUrl}</a></p>`,
        '</div>',
      ].join(''),
    }
  }

  return {
    subject: 'Pairlog パスワード再設定コード',
    text: [
      'Pairlog のパスワード再設定を受け付けました。',
      '',
      `6桁コード: ${code}`,
      '',
      'このコードは15分で期限切れになります。',
      'アプリに戻って、再設定画面にコードを入力してください。',
      '',
      `お問い合わせ: ${appUrl}`,
    ].join('\n'),
    html: [
      '<div style="font-family:Arial,sans-serif;line-height:1.7;color:#1f2937;">',
      '<h1 style="font-size:20px;margin:0 0 16px;">Pairlog パスワード再設定</h1>',
      '<p style="margin:0 0 16px;">パスワード再設定のリクエストを受け付けました。</p>',
      `<p style="margin:0 0 8px;">6桁コード</p><p style="font-size:32px;font-weight:700;letter-spacing:6px;margin:0 0 16px;">${code}</p>`,
      '<p style="margin:0 0 16px;">このコードは15分で期限切れになります。アプリに戻って、再設定画面に入力してください。</p>',
      `<p style="margin:0;">お問い合わせ: <a href="${appUrl}">${appUrl}</a></p>`,
      '</div>',
    ].join(''),
  }
}

export async function sendPasswordResetEmail({
  email,
  code,
  locale,
  config,
}: PasswordResetEmailParams) {
  if (!isPasswordResetEmailConfigured(config)) {
    if (canBypassPasswordResetEmail(config)) return
    throw new PasswordResetEmailConfigError()
  }

  const copy = buildPasswordResetCopy(locale, code, config.appUrl)
  let response: Response

  try {
    response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: config.resetEmailFrom,
        to: [email],
        subject: copy.subject,
        text: copy.text,
        html: copy.html,
        ...(config.resetEmailReplyTo ? { reply_to: config.resetEmailReplyTo } : {}),
      }),
    })
  } catch (error) {
    throw new PasswordResetEmailSendError(
      error instanceof Error ? error.message : 'password reset email delivery failed'
    )
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new PasswordResetEmailSendError(
      `password reset email delivery failed: ${body || 'unknown response'}`,
      response.status
    )
  }
}
