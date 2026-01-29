import { Router } from 'express'
import { body, matchedData, param, validationResult } from 'express-validator'
import { catchAsync } from '../helper/catchAsync'
import { HttpError, HttpError400 } from '../errors/HttpError'
import { login, renewToken } from '../services/auth.services'
import { env } from '../env'
import { getUser, queryUser } from '../services/user-services/user.services'
import { requiresAuthentication } from '../middleware/requireAuth'
import { hasPermission } from '../middleware/requirePermission'
import {
  createApplication,
  deleteApplication,
  getAllApplications,
} from '../services/application.service'
import { logger } from '../logger'

export const authRouter = Router()

/**
 * @swagger
 * /api/auth:
 *   post:
 *     tags: [Auth]
 *     summary: Login user
 *     description: Login with email/username and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthLoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
authRouter.post(
  '/',
  body('email').optional().isString().withMessage('Email must be a string'),
  body('userName')
    .optional()
    .isString()
    .withMessage('Username must be a string'),
  body('password').isString().withMessage('password is required'),
  catchAsync(async (req, res) => {
    const result = validationResult(req)
    if (!result.isEmpty()) {
      throw new HttpError400(result.array())
    }

    const { email, userName, password } = matchedData(req)
    if (!email && !userName) {
      throw new HttpError(400)
    }

    const loginResult = await login(password, email, userName)
    if (!loginResult) {
      throw new HttpError(401)
    }

    const [jwtString, exp] = loginResult

    res.cookie('access_token', jwtString, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      expires: new Date(Date.now() + env.JWT_EXP * 1000),
    })

    const identifier = email || userName
    const user = await queryUser({
      [email ? 'email' : 'userName']: identifier,
    })
    return res.status(200).json({ ...user, exp })
  }),
)

/**
 * @swagger
 * /api/auth/renew-token:
 *   post:
 *     tags: [Auth]
 *     summary: Renew authentication token
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token renewed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       401:
 *         description: Unauthorized
 */
authRouter.post(
  '/renew-token',
  requiresAuthentication,
  catchAsync(async (req, res) => {
    const jwtResult = await renewToken(req.userId!)
    if (!jwtResult) {
      return res.sendStatus(401)
    }
    const [jwt, exp] = jwtResult
    res.clearCookie('access_token')
    res.cookie('access_token', jwt, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      expires: new Date(Date.now() + env.JWT_EXP * 1000),
    })
    const user = await queryUser({ _id: req.userId! })
    res.json({ ...user, exp })
  }),
)

/**
 * @swagger
 * /api/auth:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user information
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       401:
 *         description: Unauthorized
 */
authRouter.get(
  '/',
  requiresAuthentication,
  catchAsync(async (req, res) => {
    const user = await getUser(req.userId!)
    res.status(200).send({ ...user, exp: req.exp! })
  }),
)

/**
 * @swagger
 * /api/auth:
 *   delete:
 *     tags: [Auth]
 *     summary: Logout user
 *     responses:
 *       200:
 *         description: Successfully logged out
 */
authRouter.delete('/', (req, res) => {
  res.clearCookie('access_token')
  res.status(200).end()
})

/**
 * @swagger
 * /api/auth/application:
 *   post:
 *     tags: [Auth]
 *     summary: Create a new application
 *     responses:
 *       201:
 *         description: Application created successfully
 */
authRouter.post(
  '/application',
  requiresAuthentication,
  body('url').isString(),
  catchAsync(async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw new HttpError400(errors.array())
    }

    const { url } = matchedData(req)
    const createdApp = await createApplication({ url })

    logger.info(`Application created with URL: ${url}`)

    res.status(201).json(createdApp)
  }),
)

/**
 * @swagger
 * /api/auth/allApplications:
 *  get:
 *    tags: [Auth]
 *    summary: Get all applications
 *    responses:
 *      200:
 *        description: List of all applications
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                $ref: '#/components/schemas/Application'
 */
authRouter.get(
  '/allApplications',
  requiresAuthentication,
  catchAsync(async (req, res) => {
    const applications = await getAllApplications()
    res
      .status(200)
      .json(
        applications.map((app) => ({
          url: app.url,
          id: app.id,
          secret: app.secret,
        })),
      )
  }),
)

/**
 * @swagger
 * /api/auth/application/{id}:
 *   delete:
 *     tags: [Auth]
 *     summary: Delete an application
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Application deleted successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
authRouter.delete(
  '/application/:id',
  requiresAuthentication,
  param('id').isMongoId(),
  catchAsync(async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw new HttpError400(errors.array())
    }

    const { id } = matchedData(req)
    await deleteApplication(id)
    res.sendStatus(200)
  }),
)
