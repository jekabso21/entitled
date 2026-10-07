import { CreateBucketCommand, HeadBucketCommand, PutBucketCorsCommand } from '@aws-sdk/client-s3'
import { env } from '#config/env.ts'
import { s3 } from '#lib/s3-client.ts'

const exists = await s3
  .send(new HeadBucketCommand({ Bucket: env.S3_BUCKET }))
  .then(() => true)
  .catch(() => false)

if (!exists) await s3.send(new CreateBucketCommand({ Bucket: env.S3_BUCKET }))

// Browsers upload artifacts straight to storage with presigned PUTs from the portal origin.
await s3.send(
  new PutBucketCorsCommand({
    Bucket: env.S3_BUCKET,
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedOrigins: [new URL(env.WEB_URL).origin],
          AllowedMethods: ['PUT', 'GET'],
          AllowedHeaders: ['*'],
          ExposeHeaders: ['ETag'],
          MaxAgeSeconds: 3600,
        },
      ],
    },
  }),
)
console.warn(`bucket ${env.S3_BUCKET} ${exists ? 'already exists' : 'created'}, CORS applied`)
