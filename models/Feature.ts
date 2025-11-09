import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IFeature extends Document {
  projectId: Types.ObjectId
  title: string
  description: string
  status: 'backlog' | 'active' | 'blocked' | 'complete'
  priority: 'P0' | 'P1' | 'P2'
  effortEstimateWeeks: number
  dependsOn: Types.ObjectId[]
  createdAt: Date
}

const FeatureSchema = new Schema<IFeature>({
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['backlog', 'active', 'blocked', 'complete'],
    default: 'backlog',
    required: true,
  },
  priority: {
    type: String,
    enum: ['P0', 'P1', 'P2'],
    required: true,
  },
  effortEstimateWeeks: {
    type: Number,
    required: true,
  },
  dependsOn: [{
    type: Schema.Types.ObjectId,
    ref: 'Feature',
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

export default mongoose.models.Feature || mongoose.model<IFeature>('Feature', FeatureSchema)

