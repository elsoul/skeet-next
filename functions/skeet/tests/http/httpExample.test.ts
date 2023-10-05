import { httpExample } from '@/routings/http/index'
import {
  describe,
  beforeEach,
  test,
  jest,
  beforeAll,
  afterAll,
  expect,
} from '@jest/globals'

beforeAll(async () => {
})
beforeEach(async () => {
})
afterAll(async () => {
})

describe('hello', () => {
  test('should return "success"', async () => {
    const req = {} as any;
    const res = {
      json: (payload: any) => {
        expect(payload).toEqual({ status: 'success' })
      },
    } as any;
    await httpExample(req, res)
  })

  test('should handle error', async () => {
    // エラーを発生させるために関数内でthrowされる値をモックする
    jest.spyOn(global, 'Date').mockImplementationOnce(() => {
      throw new Error('test error');
    });

    // リクエストとレスポンスのオブジェクトを作成する
    const req = {} as any;
    const res = {
      status: (code: number) => ({
        json: (payload: any) => {
          expect(code).toBe(500);
        },
      }),
      json: (payload: any) => {
        // レスポンスの内容が期待通りであることを検証する
        expect(payload).toEqual({ status: "error", message: "test error" });
      },
    } as any;

    // 関数を呼び出す
    await httpExample(req, res);
  })
})