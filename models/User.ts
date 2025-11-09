import mongoose, { Schema, Document } from 'mongoose'

export interface IUser extends Document {
  auth0Id: string
  name: string
  email: string
  role: 'pm' | 'engineer' | 'admin' | 'viewer'
  createdAt: Date
}

const UserSchema = new Schema<IUser>({
  auth0Id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  role: {
    type: String,
    enum: ['pm', 'engineer', 'admin', 'viewer'],
    default: 'viewer',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema)

