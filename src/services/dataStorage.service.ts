import {
  DeleteObjectCommand,
  GetObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { env } from '../env'
import { TImageObject } from '../types/collection.types'
import { getEntryModel } from '../model/collection.model'
import { HttpError400 } from '../errors/HttpError'
import { logger } from '../logger'

export interface MulterS3File extends Express.Multer.File {
  location: string
  key: string
}

const s3 = new S3Client({
  region: env.AWS_BUCKET_REGION!,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY!,
  },
})

export const getURLs = async (imageArray: TImageObject[]) => {
  return await Promise.all(
    imageArray.map(async (image: any) => ({
      ...image,
      signedUrl: await getURL(image.key),
    })),
  )
}

async function getURL(key: string) {
  try {
    const command = new GetObjectCommand({
      Bucket: env.AWS_BUCKET_NAME!,
      Key: key,
    })
    return await getSignedUrl(s3, command, { expiresIn: 3600 })
  } catch (err: unknown) {
    logger.error('Error getting image:', err)
    throw err
  }
}

export async function checkForImageUpdates(
  collectionName: string,
  entryID: string,
  newEntry: Record<string, any>,
) {
  const EntryModel = getEntryModel(collectionName)
  const oldEntry = await EntryModel.findById(entryID)

  if (JSON.stringify(oldEntry) === JSON.stringify(newEntry)) {
    return
  }
  const oldImages = findImageArrays(oldEntry)
  const newImages = findImageArrays(newEntry)

  const removedImages = getRemovedImages(oldImages, newImages)
  logger.debug('Images to delete:', { count: removedImages.length })
  await Promise.all(removedImages.map((image: any) => deleteImage(image.key)))
}

export async function deleteImagesFromBucket(
  collectionName: string,
  entryIds: string[],
) {
  const EntryModel = getEntryModel(collectionName)

  const deletionPromises = entryIds.map(async (entryID) => {
    const myEntry = await EntryModel.findById(entryID)
    if (!myEntry) {
      return
    }

    const fieldPromises = []

    //wir brauchen nur value
    for (const [field, value] of Object.entries(myEntry)) {
      if (Array.isArray(value)) {
        fieldPromises.push(deleteImagesInArray(value))
      }
    }

    await Promise.all(fieldPromises)
  })

  await Promise.all(deletionPromises)
}

const deleteImagesInArray = async (imageArray: any[]) => {
  if (imageArray?.length > 0) {
    const deletePromises = imageArray.map(async (image: any) => {
      if (image.key) {
        await deleteImage(image.key)
      }
    })

    await Promise.all(deletePromises)
  }
}

export async function deleteImage(key: string) {
  try {
    const command = new DeleteObjectCommand({
      Bucket: env.AWS_BUCKET_NAME!,
      Key: key,
    })

    await s3.send(command)
    return true
  } catch (error) {
    logger.error('Error deleting image:', { key, error })
    throw error
  }
}

function getRemovedImages(oldArrays: any[], newArrays: any[]): any[] {
  const imagesToRemoveArr: any[] = []

  oldArrays.forEach((oldArray) => {
    const newArray = newArrays.find((newItem) => newItem._id === oldArray._id)

    // Check all fields in oldArray for removed images
    Object.keys(oldArray).forEach((key) => {
      if (Array.isArray(oldArray[key])) {
        const oldImages = oldArray[key]
        const newImages = newArray ? newArray[key] || [] : []

        oldImages.forEach((oldImage) => {
          const isImageRemoved = !newImages.some(
            (newImage: any) => newImage.key === oldImage.key,
          )
          if (isImageRemoved) {
            imagesToRemoveArr.push(oldImage)
          }
        })
      }
    })
  })

  return imagesToRemoveArr
}

function findImageArrays(entry: any): any[] {
  const imageArrays: any[] = []
  for (const [field, value] of Object.entries(entry)) {
    if (Array.isArray(value)) {
      imageArrays.push(value)
    }
  }
  return imageArrays
}
