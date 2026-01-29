import { HttpError400 } from '../../errors/HttpError'
import { ServerError } from '../../errors/ServerError'
import { logger } from '../../logger'
import { Collection } from '../../model/collection.model'
import { TSchemaResource } from '../../types/collection.types'

export async function getCollectionSchema(
  collectionName: string,
): Promise<TSchemaResource> {
  const collection = await Collection.findOne({ name: collectionName }).exec()
  if (!collection) {
    throw new HttpError400({
      path: 'CollectionName',
      msg: `Collection '${collectionName}' not found.`,
    })
  }

  logger.info(
    `Schema of the collection '${collectionName}' retrieved successfully.`,
  )
  return JSON.parse(collection.schemaJSON)
}
export async function updateSchemaSettings(
  collectionName: string,
  newSettings: Record<string, any>,
) {
  const collection = await Collection.findOne({ name: collectionName }).exec()
  if (!collection) {
    throw new HttpError400({
      path: 'collectionName',
      msg: `Schema '${collectionName}' not found.`,
    })
  }
  try {
    const schema = JSON.parse(collection.schemaJSON)
    schema.settings = newSettings

    collection.schemaJSON = JSON.stringify(schema)
    await collection.save()
    logger.info(`Settings of Schema '${collectionName}' updated successfully.`)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    logger.error(
      `Failed to update settings of schema '${collectionName}': ${message}`,
    )
    throw new ServerError(
      `Failed to update settings of schema '${collectionName}': ${message}`,
    )
  }
}

export async function updateSchemaFieldSettings(
  collectionName: string,
  fieldName: string,
  newSettings: Record<string, any>,
) {
  const collection = await Collection.findOne({ name: collectionName }).exec()
  if (!collection) {
    throw new HttpError400({
      path: 'collectionName',
      msg: `Schema '${collectionName}' not found.`,
    })
  }

  const schema = JSON.parse(collection.schemaJSON)
  const fieldToUpdate = schema.fields.find(
    (field: any) => field.name === fieldName,
  )
  if (!fieldToUpdate) {
    throw new HttpError400({
      path: 'fieldName',
      msg: `Field '${fieldName}' in Schema '${collectionName}' not found.`,
    })
  }

  try {
    fieldToUpdate.settings = {
      dataTable: {
        visible:
          newSettings.dataTable.visible !== undefined
            ? newSettings.dataTable.visible
            : fieldToUpdate.settings.dataTable.visible,
        columnWidth:
          newSettings.dataTable.columnWidth !== undefined
            ? newSettings.dataTable.columnWidth
            : fieldToUpdate.settings.dataTable.columnWidth,
      },
    }

    schema.fields = schema.fields.map((field: any) =>
      field.name === fieldName ? fieldToUpdate : field,
    )
    collection.schemaJSON = JSON.stringify(schema)
    await collection.save()
    logger.info(
      `Settings of Field '${fieldName}' in collection '${collectionName}' updated successfully.`,
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    logger.error(
      `Failed to update field '${fieldName}' in collection '${collectionName}': ${message}`,
    )
    throw new ServerError(
      `Failed to update field '${fieldName}' in collection '${collectionName}': ${message}`,
    )
  }
}
