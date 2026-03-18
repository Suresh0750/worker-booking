import { createProxyMiddleware, Options } from 'http-proxy-middleware'
import { Request }                        from 'express'
import { logger }                         from '../../infrastructure/config/logger'

// Creates a proxy to a downstream service
// Strips the gateway prefix and forwards the rest of the path
export const createProxy = (target: string, pathRewrite?: Record<string, string>) => {
  const options: Options = {
    target,
    changeOrigin: true,
    pathRewrite,

    // Forward request ID to downstream service for tracing
    on: {
      proxyReq: (proxyReq, req: Request) => {
        // Add internal secret so downstream /internal routes can be called if needed
        proxyReq.setHeader('x-internal-secret', process.env.INTERNAL_SECRET ?? '')

        // Forward request ID for distributed tracing
        const requestId = req.headers['x-request-id']
        if (requestId) proxyReq.setHeader('x-request-id', requestId as string)
      },

      error: (err, _req, res: any) => {
        logger.error(`Proxy error to ${target}: ${err.message}`)
        res.status(502).json({
          success: false,
          message: 'Service temporarily unavailable. Please try again.',
        })
      },
    },
  }

  return createProxyMiddleware(options)
}
