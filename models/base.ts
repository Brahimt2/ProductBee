/**
 * BaseModel - Base interface for all database models
 * All models extend this interface to ensure consistent structure
 */
export interface BaseModel {
  id: string
  created_at: string
  updated_at?: string
}

