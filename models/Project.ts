import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IProject extends Document {
  name: string
  description: string
  createdBy: Types.ObjectId
  teamId: string
  roadmap: {
    summary: string
    riskLevel: string
  }
  createdAt: Date
}

const ProjectSchema = new Schema<IProject>({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  teamId: {
    type: String,
    required: true,
  },
  roadmap: {
    summary: {
      type: String,
      required: true,
    },
    riskLevel: {
      type: String,
      required: true,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

export default mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema)

