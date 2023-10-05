import { authOnCreateUser } from '@/routings/auth/index'
import { db } from '@/index'
import { User, genUserPath } from '@/models'
import {
  describe,
  beforeEach,
  test,
  jest,
  beforeAll,
  afterAll,
  expect,
} from '@jest/globals'
import {
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import functionTest from 'firebase-functions-test'
import { FeaturesList } from 'firebase-functions-test/lib/features'
import { makeUserRecord } from 'firebase-functions-test/lib/providers/auth'
import { get } from '@skeet-framework/firestore'

const PROJECT_ID = 'fakeproject'
let testEnv: RulesTestEnvironment
let testFn: FeaturesList

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({ projectId: PROJECT_ID })
  testFn = functionTest({ projectId: PROJECT_ID })
})
beforeEach(async () => {
  // Clear the database between tests
  await testEnv.clearFirestore()
})

afterAll(async () => {
  // Cleanup the test environment after all tests have been run
  await testEnv.cleanup()
})

describe('authOnCreateUser', () => {
  test('should create a user with the given parameters', async () => {
    const user = makeUserRecord({
      uid: '12345',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: 'http://example.com/photo.jpg',
    })
    // console.logをモック化して表示しない
    console.log = jest.fn();


    const wrapped = testFn.wrap(authOnCreateUser)
    await wrapped(user)

    const result = await get<User>(db, genUserPath(), '12345')

    expect(result.uid).toBe('12345')
    expect(result.email).toBe('test@example.com')
    expect(result.username).toBe('Test User')
    expect(result.iconUrl).toBe('http://example.com/photo.jpg')
  })

  test('should use gravatar if no photoURL is provided', async () => {
    const user = makeUserRecord({
      uid: '12345',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: ''
    })

    const wrapped = testFn.wrap(authOnCreateUser)
    await wrapped(user)

    const result = await get<User>(db, genUserPath(), '12345')

    expect(result.iconUrl.startsWith('https://www.gravatar.com/avatar/')).toBe(true)
  })

  test('should use email account if no displayName is provided', async () => {
    const user = makeUserRecord({
      uid: '12345',
      email: 'test@example.com',
      displayName: '',
      photoURL: 'http://example.com/photo.jpg',
    })

    const wrapped = testFn.wrap(authOnCreateUser)
    await wrapped(user)

    const result = await get<User>(db, genUserPath(), '12345')

    expect(result.username).toBe('test')
  })
})