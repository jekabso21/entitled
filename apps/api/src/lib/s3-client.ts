import { S3Client } from '@aws-sdk/client-s3'
import { env } from '#config/env.ts'

function createS3Client(endpoint: string) {
  return new S3Client({
    endpoint,
    region: env.S3_REGION,
    // Self-hosted S3 servers (RustFS) only route path-style requests unless server domains are configured.
    forcePathStyle: true,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
  })
}

// Server-to-storage traffic uses the internal endpoint.
export const s3 = createS3Client(env.S3_ENDPOINT)

// Presigned URLs embed the host in their signature, so they are signed for the public endpoint.
export const s3Presigner = createS3Client(env.S3_PUBLIC_ENDPOINT ?? env.S3_ENDPOINT)
