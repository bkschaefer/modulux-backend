import { env } from '../../env'
import fs from 'fs'
import { MAILIDENTIFIER } from './mailIdentifer.enum'
import { logger } from '../../logger'

//wandelt SVGs zu Inline
function svgToInline(path: string) {
  const svgData = fs.readFileSync(path, 'utf8')
  return Buffer.from(svgData).toString('base64')
}

interface GenerateHtmlBodyOptions {
  mailIdentifier: MAILIDENTIFIER
  inviterName?: string
  inviteToken?: string
  resetToken?: string
  newUserName?: string
}

//Identifierhandler
export function generateHtmlBodyHandler(options: GenerateHtmlBodyOptions) {
  const { mailIdentifier, inviterName, inviteToken, resetToken, newUserName } =
    options
  let htmlBody
  htmlBody = generateEmailHead()
  try {
    switch (mailIdentifier) {
      case MAILIDENTIFIER.INVITEMAIL:
        htmlBody += generateEmailInvite(inviteToken!, inviterName!)
        break
      case MAILIDENTIFIER.RESETPASSMAIL:
        htmlBody += generateEmailPassReset(resetToken!)
        break
      case MAILIDENTIFIER.INVITEMAIL:
        htmlBody += generateEmailInvite(inviteToken!, inviterName!)
        break
      case MAILIDENTIFIER.WELCOMEMAIL:
        htmlBody += generateEmailWelcome(newUserName!)
        break
      case MAILIDENTIFIER.UPDATEMAIL:
        generateEmailNotification()
        break
      default:
        throw new Error('Unknown mail identifier.')
    }
    htmlBody += generateEmailFoot()
    return htmlBody
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    logger.error('Error generating email body:', message)
  }
}

function generateEmailPassReset(resetToken: string) {
  return `
  <body>
    <div class="container">
      <div class="logo-wrapper">
        <img src="data:image/svg+xml;base64,${svgToInline('public/images/Logo.svg')}" alt="Logo" width="42" height="64">
      </div>
      <h1>Reset Password</h1>
      <p>
        You have received a request to reset your password.
        Click the button below to proceed with resetting your password.
      </p>
      <p>If you did not request this, you can safely ignore this message.</p>
      <a href="${env.VITE_SERVER_URL}/reset-password/${resetToken}" class="button">Reset Password</a>
      <div class="footer">
        <p>&copy; 2024 Modulux</p>
      </div>
    </div>
  </body>
`
}

export function generateEmailInvite(inviteToken: string, inviterName: string) {
  return `
  <body>
    <div class="container">
       <div class="logo-wrapper">
         <img src="data:image/svg+xml;base64,${svgToInline('public/images/Logo.svg')}" alt="Logo" width="42" height="64">
        </div>
      <h1>Hallo von Modulux!</h1>
      <p>
        You have been invited by ${inviterName} to register for a project through us.
        Click the button below to start your registration.
      </p>
      <a href="${env.VITE_SERVER_URL}/create-user/${inviteToken}" class="button">Register now</a>
      <div class="footer">
        <p>&copy; 2024 Modulux</p>
      </div>
    </div>
  </body>
`
}

function generateEmailWelcome(newUserName: string) {
  return `
          <body>
            <div class="container">
              <h1>Welcome, ${newUserName}!</h1>
              <p>Your registration was successful!</p>
              <p>Enjoy and a warm welcome!</p>
              <img 
                class="bottom-right-image" 
                src="data:image/svg+xml;base64,${svgToInline('public/images/welcome_picture.svg')}" 
                alt="Logo"/>            
            </div>
          </body>
`
}

function generateEmailNotification() {
  // Placeholder for notification emails
}

function generateEmailHead() {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Modulux</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
      }
      .container {
        width: calc(100% - 40px);
        max-width: 600px;
        margin: 50px auto;
        background-color: #ffffff;
        padding: 3px 20px 20px;
        border-radius: 10px;
        border: 1px solid #e0e0e0;
        box-shadow: 0 4px 4px rgba(0, 0, 0, 0.1);
        position: relative;
      }
      .logo-wrapper {
        width: 80px;
        height: 80px;
        background-color: #ffffff;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        position: absolute;
        top: -40px;
        left: 50%;
        transform: translateX(-50%);
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
      }

      .bottom-right-image {
        position: absolute;
        bottom: 20px; /* Abstand vom unteren Rand der Container-Box */
        right: 20px; /* Abstand vom rechten Rand der Container-Box */
        width: 42px;
        height: 64px;
      }

      svg {
        width: 42px;
        height: 64px;
      }
      h1 {
        text-align: center;
        color: #333333;
        font-size: 24px;
        margin-top: 50px;
      }
      p {
        color: #666666;
        font-size: 16px;
      }
      .button {
        display: inline-block;
        padding: 15px 25px;
        font-size: 16px;
        background-color: #68a977;
        color: #ffffff !important;
        text-decoration: none;
        border-radius: 5px;
        margin-top: 20px;
      }
      .footer {
        margin-top: 30px;
        text-align: center;
        font-size: 12px;
        color: #aaaaaa;
      }

      @media (max-width: 600px) {
        h1 {
          font-size: 20px;
        }
        p {
          font-size: 14px;
        }
        .button {
          font-size: 14px;
          padding: 12px 20px;
        }
      }
    </style>
  </head>`
}
function generateEmailFoot() {
  return '</html>'
}
