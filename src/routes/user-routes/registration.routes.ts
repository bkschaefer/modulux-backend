import { Router } from 'express'
import { body, matchedData, param, validationResult } from 'express-validator'
import { catchAsync } from '../../helper/catchAsync'
import {
  verifyInvite,
  createInvite,
} from '../../services/user-services/registration.services'
import { HttpError, HttpError400 } from '../../errors/HttpError'
import { requiresAuthentication } from '../../middleware/requireAuth'
import { getUser } from '../../services/user-services/user.services'
import { hasPermission } from '../../middleware/requirePermission'

export const registrationRouter = Router()

/**
 * @swagger
 * /api/user/registration/{token}:
 *   get:
 *     tags: [Users]
 *     summary: Verify registration invite token
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Registration invite token
 *     responses:
 *       200:
 *         description: Valid invite token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InviteResponse'
 *       400:
 *         description: Invalid token format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Invite not found or invalid
 */
registrationRouter.get(
  '/registration/:token',
  param('token').isUUID(),
  catchAsync(async (req, res) => {
    const result = validationResult(req)
    if (!result.isEmpty()) {
      throw new HttpError400(result.array())
    }

    const { token } = matchedData(req)
    if (!token) {
      throw new HttpError(400, 'token is required')
    }
    const invite = await verifyInvite(token)
    if (!invite) {
      throw new HttpError(404, 'Invite not found or invalid')
    }
    return res.status(200).json(invite)
  }),
)

/**
 * @swagger
 * /api/user/registration:
 *   post:
 *     tags: [Users]
 *     summary: Create new registration invite
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateInviteRequest'
 *     responses:
 *       201:
 *         description: Invite created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InviteResponse'
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not authorized to create invites
 *       404:
 *         description: Creator not found
 */
registrationRouter.post(
  '/registration/',
  requiresAuthentication,
  hasPermission('invites'),
  body('email').isString().isEmail().withMessage('Valid email is required.'),
  body('id').isMongoId().withMessage('Valid user ID is required.'),
  catchAsync(async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw new HttpError400(errors.array())
    }
    const { email, id } = matchedData(req)

    if (id !== req.userId) {
      throw new HttpError(403, 'User ID mismatch.')
    }

    const creator = await getUser(id)
    if (!creator) {
      throw new HttpError(404, 'Creator not found')
    }
    if (!creator.admin) {
      throw new HttpError(403, 'Only admins can create invites')
    }

    const invite = await createInvite(email, creator.userName)
    return res.status(201).json(invite)
  }),
)
