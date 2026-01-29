import nodemailer from 'nodemailer'
import { generateHtmlBodyHandler } from './htmlBodyGenerator'
import { ServerError } from '../../errors/ServerError'
import { MAILIDENTIFIER } from './mailIdentifer.enum'
import { env } from '../../env'

type EmailOptions = {
  mailIdentifier: MAILIDENTIFIER
  reciverEmail: string
  inviterName?: string
  inviteToken?: string
  resetToken?: string
  newUserName?: string
}

export async function sendEmail(options: EmailOptions) {
  const {
    mailIdentifier,
    reciverEmail,
    inviterName,
    inviteToken,
    resetToken,
    newUserName,
  } = options

  const subjectMap: Record<MAILIDENTIFIER, string> = {
    [MAILIDENTIFIER.INVITEMAIL]: 'Invitation to register',
    [MAILIDENTIFIER.RESETPASSMAIL]: 'Reset password',
    [MAILIDENTIFIER.WELCOMEMAIL]: 'Welcome to Modulux',
    [MAILIDENTIFIER.UPDATEMAIL]: 'Update notification',
  }
  const subject = subjectMap[mailIdentifier] || 'Notification from Modulux'

  const htmlBody = generateHtmlBodyHandler({
    mailIdentifier,
    inviterName,
    inviteToken,
    resetToken,
    newUserName,
  })
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: env.BREVO_API_USER,
        pass: env.BREVO_API_PASS,
      },
    })

    const sendResult = await transporter.sendMail({
      from: '"Modulux" <noreply@modulux.io>',
      to: reciverEmail,
      subject: subject,
      html: htmlBody!,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    throw new ServerError(
      `Cant create Email for: ${reciverEmail}. Error: ${message}`,
    )
  }
}
