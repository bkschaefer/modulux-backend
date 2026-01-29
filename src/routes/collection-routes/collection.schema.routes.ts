import { Router } from 'express'
import { body, matchedData, param, validationResult } from 'express-validator'
import { requiresAuthentication } from '../../middleware/requireAuth'
import { hasPermission } from '../../middleware/requirePermission'
import { catchAsync } from '../../helper/catchAsync'
import { HttpError400 } from '../../errors/HttpError'
import {
  getCollectionSchema,
  updateSchemaFieldSettings,
  updateSchemaSettings,
} from '../../services/collection-services/collection.schema.services'

export const collectionSchemaRouter = Router({ mergeParams: true })

/**
 * @swagger
 * /api/collection/{collectionName}/schema:
 *   get:
 *     tags: [Schema]
 *     summary: Get collection schema
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: collectionName
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the collection
 *     responses:
 *       200:
 *         description: Schema details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TSchemaResource'
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Collection not found
 */
collectionSchemaRouter.get(
  '/',
  requiresAuthentication,
  hasPermission('schemas'),
  param('collectionName')
    .exists()
    .withMessage('collectionName is required')
    .isString()
    .isLength({ min: 2, max: 50 })
    .withMessage('collectionName must be a valid MongoID'),
  catchAsync(async (req, res) => {
    const result = validationResult(req)
    if (!result.isEmpty()) {
      throw new HttpError400(result.array())
    }

    const { collectionName } = matchedData(req, {
      locations: ['params'],
    })

    res.status(200).json(await getCollectionSchema(collectionName))
  }),
)

/**
 * @swagger
 * /api/collection/{collectionName}/schema/settings:
 *   patch:
 *     tags: [Schema]
 *     summary: Update schema settings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: collectionName
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the collection
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - settings
 *             properties:
 *               settings:
 *                 type: object
 *                 properties:
 *                   dataTable:
 *                     type: object
 *                     properties:
 *                       entriesPerPage:
 *                         type: number
 *     responses:
 *       204:
 *         description: Settings updated successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Collection not found
 */
collectionSchemaRouter.patch(
  '/:settings',
  requiresAuthentication,
  hasPermission('schemas'),
  param('collectionName')
    .exists()
    .withMessage('collectionName is required')
    .isString()
    .isLength({ min: 2, max: 50 })
    .withMessage('collectionName must be a valid string'),
  body('settings')
    .exists()
    .withMessage('settings is required')
    .isObject()
    .withMessage('settings must be a valid JS object'),
  catchAsync(async (req, res) => {
    const result = validationResult(req)
    if (!result.isEmpty()) {
      throw new HttpError400(result.array())
    }

    const { collectionName } = matchedData(req, {
      locations: ['params'],
    })
    const { settings } = matchedData(req, {
      locations: ['body'],
    })
    await updateSchemaSettings(collectionName, settings)
    res.sendStatus(204)
  }),
)

/**
 * @swagger
 * /api/collection/{collectionName}/schema/{fieldName}/settings:
 *   patch:
 *     tags: [Schema]
 *     summary: Update field settings in schema
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: collectionName
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the collection
 *       - in: path
 *         name: fieldName
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the field to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - settings
 *             properties:
 *               settings:
 *                 type: object
 *                 properties:
 *                   dataTable:
 *                     type: object
 *                     properties:
 *                       visible:
 *                         type: boolean
 *                       columnWidth:
 *                         type: number
 *     responses:
 *       204:
 *         description: Field settings updated successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Collection or field not found
 */
collectionSchemaRouter.patch(
  '/:fieldName/settings',
  requiresAuthentication,
  hasPermission('schemas'),
  param('collectionName')
    .exists()
    .withMessage('collectionName is required')
    .isString()
    .isLength({ min: 2, max: 50 })
    .withMessage('collectionName must be a valid string'),
  param('fieldName')
    .exists()
    .withMessage('fieldName is required')
    .isString()
    .isLength({ min: 2, max: 50 })
    .withMessage('fieldName must be a valid string'),
  body('settings')
    .exists()
    .withMessage('settings is required')
    .isObject()
    .withMessage('settings must be a valid JS object'),
  catchAsync(async (req, res) => {
    const result = validationResult(req)
    if (!result.isEmpty()) {
      throw new HttpError400(result.array())
    }

    const { collectionName, fieldName } = matchedData(req, {
      locations: ['params'],
    })
    const { settings } = matchedData(req, {
      locations: ['body'],
    })

    await updateSchemaFieldSettings(collectionName, fieldName, settings)
    res.sendStatus(204)
  }),
)
