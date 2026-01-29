import { Router } from 'express'
import { matchedData, param, validationResult } from 'express-validator'
import { requiresAuthentication } from '../../middleware/requireAuth'
import { hasPermission } from '../../middleware/requirePermission'
import { catchAsync } from '../../helper/catchAsync'
import { HttpError400 } from '../../errors/HttpError'
import { validateSchema } from '../../middleware/validateSchema'
import {
  createCollection,
  getCollection,
  getAllCollectionNames,
  updateCollection,
  deleteCollection,
} from '../../services/collection-services/collection.services'
import { collectionSchemaRouter } from './collection.schema.routes'
import { collectionEntryRouter } from './collection.entry.routes'
import { logger } from '../../logger'

export const collectionRouter = Router()

collectionRouter.use('/:collectionName/schema', collectionSchemaRouter)
collectionRouter.use('/:collectionName/entry', collectionEntryRouter)

/**
 * @swagger
 * /api/collection/all:
 *   get:
 *     tags: [Collections]
 *     summary: Get all collection names
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all collections
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   title:
 *                     type: string
 *       401:
 *         description: Unauthorized
 */
collectionRouter.get(
  '/all',
  requiresAuthentication,
  catchAsync(async (req, res) => {
    res.status(200).json(await getAllCollectionNames())
  }),
)

/**
 * @swagger
 * /api/collection:
 *   post:
 *     tags: [Collections]
 *     summary: Create a new collection
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TSchemaResource'
 *     responses:
 *       201:
 *         description: Collection created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TSchemaResource'
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
collectionRouter.post(
  '/',
  requiresAuthentication,
  validateSchema,
  hasPermission('schemas'),
  catchAsync(async (req, res) => {
    res.status(201).json(await createCollection(req.body))
  }),
)

/**
 * @swagger
 * /api/collection/{collectionName}:
 *   get:
 *     tags: [Collections]
 *     summary: Get collection by name
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: collectionName
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the collection to retrieve
 *     responses:
 *       200:
 *         description: Collection details with entries
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TCollectionResource'
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
collectionRouter.get(
  '/:collectionName',
  requiresAuthentication,
  hasPermission('collections'),
  param('collectionName')
    .exists()
    .withMessage('Collection name is required')
    .isString()
    .isLength({ min: 2, max: 50 })
    .withMessage('Collection name must be a valid string'),
  catchAsync(async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw new HttpError400(errors.array())
    }

    const { collectionName } = matchedData(req, { locations: ['params'] })
    logger.info(`Retrieving collection ${collectionName}`)
    res.status(200).json(await getCollection(collectionName))
  }),
)

/**
 * @swagger
 * /api/collection/{collectionName}:
 *   put:
 *     tags: [Collections]
 *     summary: Update collection
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: collectionName
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the collection to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TSchemaResource'
 *     responses:
 *       200:
 *         description: Collection updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TSchemaResource'
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
collectionRouter.put(
  '/:collectionName',
  requiresAuthentication,
  hasPermission('schemas'),
  validateSchema,
  param('collectionName')
    .exists()
    .withMessage('collectionName is required')
    .isString()
    .isLength({ min: 2, max: 50 })
    .withMessage('collectionName must be a valid string'),
  catchAsync(async (req, res) => {
    const result = validationResult(req)
    if (!result.isEmpty()) {
      throw new HttpError400(result.array())
    }
    const { collectionName } = matchedData(req, {
      locations: ['params'],
    })

    res.status(200).json(await updateCollection(collectionName, req.body))
  }),
)

/**
 * @swagger
 * /api/collection/{collectionName}:
 *   delete:
 *     tags: [Collections]
 *     summary: Delete collection
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: collectionName
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the collection to delete
 *     responses:
 *       204:
 *         description: Collection deleted successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
collectionRouter.delete(
  '/:collectionName',
  requiresAuthentication,
  hasPermission('schemas'),
  param('collectionName')
    .exists()
    .withMessage('collectionName is required')
    .isString()
    .isLength({ min: 2, max: 50 })
    .withMessage('collectionName must be a valid string'),
  catchAsync(async (req, res) => {
    const result = validationResult(req)
    if (!result.isEmpty()) {
      throw new HttpError400(result.array())
    }

    const { collectionName } = matchedData(req, {
      locations: ['params'],
    })

    await deleteCollection(collectionName)
    res.sendStatus(204)
  }),
)
