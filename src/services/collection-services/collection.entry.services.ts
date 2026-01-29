import { HttpError400 } from '../../errors/HttpError'
import { ServerError } from '../../errors/ServerError'
import { isImageField } from '../../helper/isImageField'
import { logger } from '../../logger'
import { Collection, getEntryModel } from '../../model/collection.model'
import { TEntryResource } from '../../types/collection.types'
import {
  checkForImageUpdates,
  deleteImagesFromBucket,
  getURLs,
} from '../dataStorage.service'
import { TImageObject } from '../../types/collection.types'

export async function getCollectionEntry(
  collectionName: string,
  entryId: string,
): Promise<TEntryResource> {
  const collection = await Collection.findOne({
    name: collectionName,
  }).exec()

  if (!collection) {
    throw new HttpError400({
      path: 'collectionName',
      msg: `Collection with name '${collectionName}' doesn't exist.`,
    })
  }

  const EntryModel = getEntryModel(collectionName)
  const entry = await EntryModel.findById(entryId).exec()

  if (!entry) {
    throw new HttpError400({
      path: 'entryId',
      msg: `entry '${entryId}' with collection '${collectionName}' doesn't exist.`,
    })
  }

  let entryWithImageURLS = { ...entry.toObject() }
  for (const [key, value] of Object.entries(entry.toObject())) {
    if (isImageField(value)) {
      entryWithImageURLS[key] = await getURLs(value as TImageObject[])
    }
  }

  logger.info(`Entry from '${collectionName}' retrieved successfully.`)
  return entryWithImageURLS
}

export async function addEntryToCollection(
  collectionName: string,
  newEntry: TEntryResource,
): Promise<TEntryResource> {
  const collection = await Collection.findOne({ name: collectionName }).exec()
  if (!collection) {
    throw new HttpError400({
      path: 'collectionName',
      msg: `Collection with name '${collectionName}' doesn't exist.`,
    })
  }

  try {
    const EntryModel = getEntryModel(collectionName)
    const entry = await EntryModel.create(newEntry)

    logger.info(`Entry added to collection '${collectionName}' successfully.`)
    return entry.toObject()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    logger.error(
      `Failed to add entry to collection '${collectionName}': ${message}`,
    )
    throw new ServerError(
      `Failed to add entry to collection '${collectionName}': ${message}`,
    )
  }
}

export async function updateCollectionEntry(
  collectionName: string,
  entryId: string,
  newEntry: Record<string, any>,
): Promise<TEntryResource> {
  const collection = await Collection.findOne({
    name: collectionName,
  }).exec()

  if (!collection) {
    throw new HttpError400({
      path: 'collectionName',
      msg: `Collection with name '${collectionName}' doesn't exist.`,
    })
  }

  try {
    const EntryModel = getEntryModel(collectionName)
    const entrieExist = await EntryModel.exists({ _id: { $in: entryId } })

    if (!entrieExist) {
      throw new HttpError400({
        path: 'entryId',
        msg: `Entry with Id '${entryId}' doesn't exist.`,
      })
    }

    checkForImageUpdates(collectionName, entryId, newEntry)

    const entry = await EntryModel.findByIdAndUpdate(entryId, newEntry, {
      new: true,
    }).exec()

    logger.info(
      `Entry from Collection '${collectionName}' updated successfully.`,
    )
    return entry.toObject()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    logger.error(
      `Failed to update collection '${collectionName}' entryId '${entryId}' : ${message}`,
    )
    throw new ServerError(
      `Failed to update collection '${collectionName}' entryId '${entryId}' : ${message}`,
    )
  }
}

export async function deleteEntriesFromCollection(
  collectionName: string,
  entryIds: string[],
) {
  const collection = await Collection.findOne({
    name: collectionName,
  }).exec()

  if (!collection) {
    throw new HttpError400({
      path: 'collectionName',
      msg: `Collection with name '${collectionName}' doesn't exist.`,
    })
  }

  try {
    const EntryModel = getEntryModel(collectionName)
    const entriesExist = await EntryModel.exists({ _id: { $in: entryIds } })

    if (!entriesExist) {
      throw new HttpError400({
        path: 'entryId',
        msg: `Entries with provided IDs don't exist.`,
      })
    }

    // Fire and forget - no await needed
    deleteImagesFromBucket(collectionName, entryIds)
    await EntryModel.deleteMany({ _id: { $in: entryIds } })

    logger.info(
      `Entries from Collection '${collectionName}' deleted successfully.`,
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    logger.error(
      `Failed to delete entries from collection '${collectionName}': ${message}`,
    )
    throw new ServerError(
      `Failed to delete entries from collection '${collectionName}': ${message}`,
    )
  }
}
