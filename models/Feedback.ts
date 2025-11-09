import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IFeedback extends Document {
  projectId: Types.ObjectId
  featureId: Types.ObjectId
  userId: Types.ObjectId
  type: 'comment' | 'proposal'
  content: string
  proposedRoadmap?: object
  aiAnalysis?: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: Date
}

const FeedbackSchema = new Schema<IFeedback>({
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true,
  },
  featureId: {
    type: Schema.Types.ObjectId,
    ref: 'Feature',
    required: true,
    index: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['comment', 'proposal'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  proposedRoadmap: {
    type: Schema.Types.Mixed,
  },
  aiAnalysis: {
    type: String,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

export default mongoose.models.Feedback || mongoose.model<IFeedback>('Feedback', FeedbackSchema)

