import { onRequest } from 'firebase-functions/v2/https'
import { publicHttpOption } from '@/routings/options'
import { TypedRequestBody } from '@common/types/http'
import { HttpExampleParams } from '@common/types/http/httpExampleParams'

export const httpExample = onRequest(
  publicHttpOption,
  async (req: TypedRequestBody<HttpExampleParams>, res) => {
    try {
      res.json({
        status: 'success',
      })
    } catch (error) {
      res.status(500).json({ status: 'error', message: String(error) })
    }
  },
)
