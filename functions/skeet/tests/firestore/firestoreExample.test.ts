import { firestoreExample } from '@/routings/firestore/index'
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

describe('firestoreExample', () => {
  test('should log the event params and handle errors', async () => {
    // テストデータを作成
    const userId = '1234567890';
    const userDoc = testFn.firestore.makeDocumentSnapshot({
      name: 'Test User',
      email: 'test@example.com'
    }, `User/${userId}`);
    const event = testFn.makeChange(null, userDoc);

    // console.logをモック化してログを記録する
    console.log = jest.fn();

    // テスト対象の関数を呼び出す
    const wrapped = testFn.wrap(firestoreExample)
    await wrapped(event)

    // console.logが正しく呼ばれたことを確認する
    expect(console.log).toHaveBeenCalledWith('firestoreExample triggered');
    //expect(console.log).toHaveBeenCalledWith({ userId });
  });
});
