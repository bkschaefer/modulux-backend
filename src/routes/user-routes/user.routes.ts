import { Router } from 'express'
import { body, matchedData, param, validationResult } from 'express-validator'
import { catchAsync } from '../../helper/catchAsync'
import { HttpError, HttpError400 } from '../../errors/HttpError'

import {
  changePassword,
  createUser,
  deleteUser,
  getAllUsers,
  getUser,
  queryUser,
  updateUser,
  assignRoles,
} from '../../services/user-services/user.services'
import { requiresAuthentication } from '../../middleware/requireAuth'
import { requiresInvite } from '../../middleware/requireInvite'
import { invalidateInvite } from '../../services/user-services/registration.services'
import { logger } from '../../logger'
import { verify } from 'jsonwebtoken'
import { TUserResource } from '../../types/user.types'
import { Role } from '../../types/permission.types'
import { hasPermission } from '../../middleware/requirePermission'

export const userRouter = Router()

/**
 * @swagger
 * /api/user/getAll:
 *   get:
 *     tags: [Users]
 *     summary: Get all users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserResponse'
 *       403:
 *         description: Not authorized to view users
 */
userRouter.get(
  '/getAll',
  requiresAuthentication,
  hasPermission('users'),
  catchAsync(async (req, res) => {
    return res.status(200).json(await getAllUsers())
  }),
)

userRouter.post(
  '/',
  requiresInvite,
  body('email')
    .exists()
    .withMessage('email is required')
    .isString()
    .isEmail()
    .withMessage('should be a valid email'),
  body('username')
    .exists()
    .withMessage('Username is required')
    .isString()
    .isLength({ min: 2, max: 30 })
    .withMessage('should be a valid Username'),
  body('password')
    .exists()
    .withMessage('password is required')
    .isString()
    .withMessage('password must be string')
    .isStrongPassword()
    .withMessage('should be strong password'),
  body('admin').isBoolean().optional().default(false),
  catchAsync(async (req, res) => {
    const result = validationResult(req)
    if (!result.isEmpty()) {
      throw new HttpError400(result.array())
    }

    const { email, password, username } = matchedData(req)

    try {
      const created = await createUser({
        email,
        password,
        userName: username,
        admin: false,
      })
      logger.debug('Invite token used', req.inviteToken)
      await invalidateInvite(req.inviteToken!)
      res.status(201).json(created)
    } catch (err) {
      throw err
    }
  }),
)

/**
 * @swagger
 * /api/user/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Delete user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: mongoId
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       400:
 *         description: Invalid request
 *       403:
 *         description: Not authorized or cannot delete own account
 */
userRouter.delete(
  '/:id',
  requiresAuthentication,
  param('id')
    .isMongoId()
    .withMessage('url parameter id is required and must be valid id'),
  catchAsync(async (req, res) => {
    const user = await getUser(req.userId!)
    if (!user.admin) {
      throw new HttpError(403)
    }

    const result = validationResult(req)
    if (!result.isEmpty()) {
      throw new HttpError400(result.array())
    }

    const { id } = matchedData(req)
    if (req.userId === id) {
      throw new HttpError(403, 'Cannot delete own account')
    }

    const deletedUser = await deleteUser(id)
    if (!deletedUser) {
      throw new HttpError(400, 'Something went wrong')
    }

    res.status(200).end()
  }),
)

/**
 * @swagger
 * /api/user/{id}:
 *   put:
 *     tags: [Users]
 *     summary: Update user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: mongoId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserRequest'
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Invalid request
 *       403:
 *         description: Not authorized to update this user
 */
userRouter.put(
  '/:id',
  requiresAuthentication,
  param('id').isMongoId(),
  body('userName').optional().isString().isLength({ min: 2, max: 50 }),
  body('email').optional().isEmail().isLength({ min: 2, max: 75 }),
  catchAsync(async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw new HttpError400(errors.array())
    }
    const { id } = req.params
    const validatedData = matchedData(req, { locations: ['body', 'params'] })
    if (validatedData.id !== id) {
      throw new HttpError(403, 'You do not have permission to update this user')
    }

    const updatedUser = await updateUser(
      validatedData.id,
      validatedData.userName,
      validatedData.email,
    )

    if (!updatedUser) {
      throw new HttpError(
        400,
        'Something went wrong, user could not be updated',
      )
    }

    res.sendStatus(200).end()
  }),
)

/**
 * @swagger
 * /api/user/change-password:
 *   post:
 *     tags: [Users]
 *     summary: Change user password
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Invalid current password
 */
userRouter.post(
  '/change-password',
  requiresAuthentication,
  body('currentPassword').exists(),
  body('newPassword')
    .exists()
    .isStrongPassword()
    .withMessage('Please use a strong password'),
  catchAsync(async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw new HttpError400(errors.array())
    }

    const { currentPassword, newPassword } = matchedData(req)
    await changePassword(req.userId!, newPassword, currentPassword)
    res.clearCookie('access_token')
    res.sendStatus(200).end()
  }),
)

/**
 * @swagger
 * /api/user/roles:
 *   get:
 *     tags: [Users]
 *     summary: Get available roles
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of available roles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *                 enum: ['users', 'collections', 'invites']
 */
userRouter.get(
  '/roles',
  requiresAuthentication,
  catchAsync(async (req, res) => {
    return res.status(200).json(Object.values(Role))
  }),
)

/**
 * @swagger
 * /api/user/{userId}/roles:
 *   put:
 *     tags: [Users]
 *     summary: Assign roles to user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: mongoId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssignRolesRequest'
 *     responses:
 *       200:
 *         description: Roles assigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: Invalid request
 *       403:
 *         description: Not authorized to modify roles
 *       404:
 *         description: User not found
 */
userRouter.put(
  '/:userId/roles',
  requiresAuthentication,
  hasPermission('users'),
  param('userId').isMongoId().withMessage('userId must be a valid MongoDB id'),
  body('roles')
    .exists()
    .withMessage('roles is required')
    .isArray()
    .withMessage('roles must be an array')
    .custom((roles) => {
      // Ensure every role in the array is a valid role
      const validRoles = Object.values(Role)
      return roles.every((role: Role) => validRoles.includes(role))
    })
    .withMessage('Invalid roles provided'),
  catchAsync(async (req, res) => {
    const result = validationResult(req)
    if (!result.isEmpty()) {
      throw new HttpError400(result.array())
    }

    const { userId } = matchedData(req, { locations: ['params'] })
    const { roles } = matchedData(req, { locations: ['body'] })

    const requestingUser = await getUser(req.userId!)
    const targetUser = await getUser(userId)

    if (!targetUser) {
      throw new HttpError(404, 'Target user not found')
    }

    if (userId === req.userId) {
      throw new HttpError(403, 'Cannot modify own roles')
    }

    if (!requestingUser.admin && targetUser.admin) {
      throw new HttpError(403, 'Cannot modify admin user roles')
    }

    const updatedUser = await assignRoles(userId, roles)
    res.status(200).json(updatedUser)
  }),
)
