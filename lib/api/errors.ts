import { HTTP_STATUS } from '@/lib/constants'

/**
 * Custom API Error class for consistent error handling
 */
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    public code?: string
  ) {
    super(message)
    this.name = 'APIError'
    Object.setPrototypeOf(this, APIError.prototype)
  }
}

/**
 * Predefined error instances for common scenarios
 */
export const APIErrors = {
  unauthorized: () => new APIError('Unauthorized', HTTP_STATUS.UNAUTHORIZED, 'UNAUTHORIZED'),
  forbidden: (message?: string) => new APIError(
    message || 'Forbidden',
    HTTP_STATUS.FORBIDDEN,
    'FORBIDDEN'
  ),
  notFound: (resource: string = 'Resource') => new APIError(
    `${resource} not found`,
    HTTP_STATUS.NOT_FOUND,
    'NOT_FOUND'
  ),
  badRequest: (message: string) => new APIError(
    message,
    HTTP_STATUS.BAD_REQUEST,
    'BAD_REQUEST'
  ),
  internalError: (message: string = 'Internal server error') => new APIError(
    message,
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    'INTERNAL_ERROR'
  ),
}

/**
 * Error handler for API routes
 * Converts errors to JSON responses
 */
export function handleError(error: unknown): Response {
  console.error('[API Error]:', error)

  if (error instanceof APIError) {
    return Response.json(
      {
        success: false,
        error: error.message,
        code: error.code,
      },
      { status: error.statusCode }
    )
  }

  if (error instanceof Error) {
    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }

  return Response.json(
    {
      success: false,
      error: 'Unknown error occurred',
    },
    { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
  )
}

/**
 * Success response helper
 */
export function successResponse<T>(data: T, status: number = HTTP_STATUS.OK): Response {
  return Response.json(
    {
      success: true,
      data,
    },
    { status }
  )
}

