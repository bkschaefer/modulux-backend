import { Router } from "express";
import { body, matchedData, param, validationResult } from "express-validator";
import { requiresAuthentication } from "../../middleware/requireAuth";
import { hasPermission } from "../../middleware/requirePermission";
import { catchAsync } from "../../helper/catchAsync";
import { HttpError400 } from "../../errors/HttpError";
import {
  getCollectionEntry,
  addEntryToCollection,
  updateCollectionEntry,
  deleteEntriesFromCollection,
} from "../../services/collection-services/collection.entry.services";
import {
  parseRequestBody,
  upload,
} from "../../middleware/dataStorage";

export const collectionEntryRouter = Router({ mergeParams: true });

/**
 * @swagger
 * /api/collection/{collectionName}/entry:
 *   post:
 *     tags: [Entries]
 *     summary: Add entry to collection
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: collectionName
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the collection to add entry to
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       201:
 *         description: Entry created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TEntryResource'
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
collectionEntryRouter.post(
  "/",
  requiresAuthentication,
  hasPermission("collections"),
  param("collectionName")
    .exists()
    .withMessage("Collection name is required")
    .isString()
    .isLength({ min: 2, max: 50 })
    .withMessage("Collection name must be a valid string"),
  upload.any(), 
  parseRequestBody,
  catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new HttpError400(errors.array());
    }

    const { collectionName } = matchedData(req, { locations: ["params"] });
    res.status(201).json(addEntryToCollection(collectionName, req.body));
  }),
);

/**
 * @swagger
 * /api/collection/{collectionName}/entry/{entryId}:
 *   get:
 *     tags: [Entries]
 *     summary: Get entry by ID
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
 *         name: entryId
 *         required: true
 *         schema:
 *           type: string
 *           format: mongoId
 *         description: ID of the entry
 *     responses:
 *       200:
 *         description: Entry details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TEntryResource'
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Entry not found
 */
collectionEntryRouter.get(
  "/:entryId",
  requiresAuthentication,
  hasPermission("collections"),
  param("collectionName")
    .exists()
    .withMessage("Collection name is required")
    .isString()
    .isLength({ min: 2, max: 50 })
    .withMessage("Collection name must be a valid string"),
  param("entryId")
    .exists()
    .isMongoId()
    .withMessage("Entry ID must be a valid MongoDB ID"),
  catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new HttpError400(errors.array());
    }
    
    const { collectionName, entryId } = matchedData(req, {
      locations: ["params"],
    });
    res.status(200).json(await getCollectionEntry(collectionName, entryId));
  }),
);

/**
 * @swagger
 * /api/collection/{collectionName}/entry/{entryId}:
 *   put:
 *     tags: [Entries]
 *     summary: Update entry
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
 *         name: entryId
 *         required: true
 *         schema:
 *           type: string
 *           format: mongoId
 *         description: ID of the entry to update
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       200:
 *         description: Entry updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TEntryResource'
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Entry not found
 */
collectionEntryRouter.put(
  "/:entryId",
  param("collectionName")
    .exists()
    .withMessage("Collection name is required")
    .isString()
    .isLength({ min: 2, max: 50 })
    .withMessage("Collection name must be a valid string"),
  param("entryId")
    .exists()
    .isMongoId()
    .withMessage("entryName must be a valid mongoId"),
  requiresAuthentication,
  hasPermission("collections"),
  upload.any(),
  parseRequestBody,
  catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new HttpError400(errors.array());
    }

    const { collectionName, entryId } = matchedData(req, {
      locations: ["params"],
    });
    res
      .status(200)
      .json(await updateCollectionEntry(collectionName, entryId, req.body));
  }),
);

/**
 * @swagger
 * /api/collection/{collectionName}/entry:
 *   delete:
 *     tags: [Entries]
 *     summary: Delete multiple entries
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
 *               - entryIds
 *             properties:
 *               entryIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: mongoId
 *                 description: Array of entry IDs to delete
 *     responses:
 *       204:
 *         description: Entries deleted successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
collectionEntryRouter.delete(
  "/",
  requiresAuthentication,
  hasPermission("collections"),
  param("collectionName")
    .exists()
    .withMessage("Collection name is required")
    .isString()
    .isLength({ min: 2, max: 50 })
    .withMessage("Collection name must be a valid string"),
  body("entryIds")
    .exists()
    .withMessage("Entry IDs are required")
    .isArray({ min: 1 })
    .withMessage("Entry IDs must be an array with at least one ID"),
  body("entryIds.*")
    .isMongoId()
    .withMessage("Each entry ID must be a valid MongoDB ID"),
  catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new HttpError400(errors.array());
    }

    const { collectionName } = matchedData(req, { locations: ["params"] });
    const { entryIds } = matchedData(req, { locations: ["body"] });

    await deleteEntriesFromCollection(collectionName, entryIds);
    res.sendStatus(204);
  }),
);
