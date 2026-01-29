import { Router } from 'express'
import { catchAsync } from '../../helper/catchAsync'
import {
  changePassForgotten,
  checkPassResetToken,
  createPassReset,
} from '../../services/user-services/passReset.services'
import { HttpError, HttpError400 } from '../../errors/HttpError'
import { body, matchedData, param, validationResult } from 'express-validator'

export const passResetRouter = Router()

/**
 * @swagger
 * /api/auth/verify-reset-token/{token}:
 *   get:
 *     tags: [Auth]
 *     summary: Verify password reset token
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Password reset token
 *     responses:
 *       200:
 *         description: Token verification result
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PasswordResetVerifyResponse'
 *       400:
 *         description: Invalid token format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Token not found or invalid
 */
passResetRouter.get(
  '/verify-reset-token/:token',
  param('token').isUUID(),
  catchAsync(async (req, res) => {
    const result = validationResult(req)
    if (!result.isEmpty()) {
      throw new HttpError400(result.array())
    }

    const { token } = matchedData(req)
    if (!token) {
      throw new HttpError(400, 'Token is required')
    }
    const isValid = await checkPassResetToken(token)
    if (!isValid) {
      throw new HttpError(404, 'Token is not valid')
    }
    res.status(200).json({ isValid })
  }),
)

/**
 * @swagger
 * /api/auth/request-password-reset:
 *   post:
 *     tags: [Auth]
 *     summary: Request password reset
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PasswordResetRequest'
 *     responses:
 *       201:
 *         description: Password reset request successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PasswordResetResponse'
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 */
passResetRouter.post(
  '/request-password-reset',
  body('userNameOrEmail').isString().isLength({ min: 3, max: 36 }),
  catchAsync(async (req, res) => {
    const result = validationResult(req)
    if (!result.isEmpty()) {
      throw new HttpError400(result.array())
    }

    const { userNameOrEmail } = matchedData(req)
    if (!userNameOrEmail) {
      throw new HttpError(400, 'Username or email is required')
    }
    const resetEntry = await createPassReset(userNameOrEmail)
    if (!resetEntry) {
      throw new HttpError(404, 'Creator not found')
    }
    res
      .status(201)
      .json({ message: 'Password reset link sent.', data: resetEntry })
  }),
)

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password using token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PasswordChangeRequest'
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid request or token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
passResetRouter.post(
  '/reset-password',
  body('token').isUUID(),
  body('newPassword').isString().isLength({ min: 5, max: 50 }),
  catchAsync(async (req, res) => {
    const result = validationResult(req)
    if (!result.isEmpty()) {
      throw new HttpError400(result.array())
    }

    const { token, newPassword } = matchedData(req)
    if (!token || !newPassword) {
      throw new HttpError(400, 'Token and new password are required')
    }
    const change = await changePassForgotten(token, newPassword)
    if (!change) {
      throw new HttpError(400, 'It was not possible to change the password.')
    }
    res.status(200).json({ message: 'Password has been reset successfully.' })
  }),
)
