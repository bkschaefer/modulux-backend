import { logger } from './logger'
import { UserModel } from './model/user.model'
import {
  createFirstUser,
  createUser,
} from './services/user-services/user.services'
import { TUserModel, TUserResource } from './types/user.types'
import { Role } from './types/permission.types'

/**
 * Creates test users for development and testing purposes.
 */

export async function prefillDB(): Promise<{
  firstUser: TUserResource
  creatorOne: TUserResource
  creatorTwo: TUserResource
  admin: TUserResource
  userManager: TUserResource
  editor: TUserResource
  reader: TUserResource
}> {
  await UserModel.syncIndexes()

  const testUser_firstUser = await createFirstUser({
    userName: 'ModuluxAdmin',
    password: '123_abc_ABC',
    email: 'admin@modulux.local',
  })
  logger.info(
    `Prefill DB with test data, testUser - Admin: ${testUser_firstUser.userName}`,
  )

  const testUser_creatorOne = await createUser({
    userName: 'ModuluxCreatorUno',
    password: '123_abc_ABC',
    email: 'creator1@modulux.local',
    admin: true,
  })

  const testUser_creatorTwo = await createUser({
    userName: 'ModuluxCreatorDos',
    password: '123_abc_ABC',
    email: 'creator2@modulux.local',
    admin: false,
  })

  // Create admin user
  const testUser_admin = await createFirstUser({
    userName: 'ModuluxAdmin',
    password: 'password123',
    email: 'admin@test.com',
  })
  logger.info(`Created admin user: ${testUser_admin.userName}`)

  // Create user manager
  const testUser_userManager = await createUser({
    userName: 'UserManager',
    password: 'password123',
    email: 'usermanager@test.com',
    roles: [Role.USER_MANAGER],
    admin: false,
  })
  logger.info(`Created user manager: ${testUser_userManager.userName}`)

  // Create content editor
  const testUser_editor = await createUser({
    userName: 'ContentEditor',
    password: 'password123',
    email: 'editor@test.com',
    roles: [Role.CONTENT_EDITOR],
    admin: false,
  })
  logger.info(`Created content editor: ${testUser_editor.userName}`)

  // Create content reader
  const testUser_reader = await createUser({
    userName: 'ContentReader',
    password: 'password123',
    email: 'reader@test.com',
    roles: [],
    admin: false,
  })
  logger.info(`Created content reader: ${testUser_reader.userName}`)

  return {
    firstUser: testUser_firstUser,
    creatorOne: testUser_creatorOne,
    creatorTwo: testUser_creatorTwo,
    admin: testUser_admin,
    userManager: testUser_userManager,
    editor: testUser_editor,
    reader: testUser_reader,
  }
}
