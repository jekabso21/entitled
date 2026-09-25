import { CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3'
import { env } from '#config/env.ts'
import { s3 } from '#lib/s3-client.ts'

const exists = await s3
  .send(new HeadBucketCommand({ Bucket: env.S3_BUCKET }))
  .then(() => true)
  .catch(() => false)

if (!exists) await s3.send(new CreateBucketCommand({ Bucket: env.S3_BUCKET }))
console.warn(`bucket ${env.S3_BUCKET} ${exists ? 'already exists' : 'created'}`)
