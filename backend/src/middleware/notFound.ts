import { Request, Response, NextFunction } from 'express'
import { createError } from './errorHandler.js'

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = createError.notFound(
    `Route ${req.method} ${req.originalUrl} not found`,
    'ROUTE_NOT_FOUND'
  )
  next(error)
}