import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { env } from '#config/env.ts'
import { s3, s3Presigner } from '#lib/s3-client.ts'

const UPLOAD_URL_TTL_SECONDS = 60 * 60
const DOWNLOAD_URL_TTL_SECONDS = 15 * 60

export function artifactStorageKey(releaseId: string, artifactId: string, fileName: string) {
  return `releases/${releaseId}/${artifactId}/${fileName}`
}

export async function presignArtifactUpload(key: string, contentType: string, sizeBytes: number) {
  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
    ContentType: contentType,
    ContentLength: sizeBytes,
  })
  const url = await getSignedUrl(s3Presigner, command, {
    expiresIn: UPLOAD_URL_TTL_SECONDS,
    signableHeaders: new Set(['content-type', 'content-length']),
  })
  return { url, headers: { 'content-type': contentType } }
}

export async function presignArtifactDownload(key: string, fileName: string) {
  const command = new GetObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
    ResponseContentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
  })
  return getSignedUrl(s3Presigner, command, { expiresIn: DOWNLOAD_URL_TTL_SECONDS })
}

export async function storedObjectSize(key: string) {
  try {
    const head = await s3.send(new HeadObjectCommand({ Bucket: env.S3_BUCKET, Key: key }))
    return head.ContentLength ?? null
  } catch {
    return null
  }
}

export async function deleteStoredObject(key: string) {
  await s3.send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: key }))
}
