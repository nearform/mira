import S3, { ObjectIdentifierList } from 'aws-sdk/clients/s3'

const s3 = new S3()

export const deleteBucket = async (bucketName: string): Promise<void> => {
  const objects = await s3.listObjectVersions({ Bucket: bucketName }).promise()

  if (!objects.Versions?.length && !objects.DeleteMarkers?.length) {
    return
  }

  const objectsToDelete: ObjectIdentifierList = [
    ...(objects.Versions || []),
    ...(objects.DeleteMarkers || [])
  ].map((o) => ({ Key: o.Key || '', VersionId: o.VersionId }))

  await s3
    .deleteObjects({ Bucket: bucketName, Delete: { Objects: objectsToDelete } })
    .promise()

  if (objects.IsTruncated) {
    await deleteBucket(bucketName)
  }
}
