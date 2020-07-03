import S3, { ObjectIdentifierList } from 'aws-sdk/clients/s3'

const s3 = new S3()

export const deleteBucket = async (bucketName: string): Promise<void> => {
  const objects = await s3.listObjectVersions({ Bucket: bucketName }).promise()

  const objectsToDelete: ObjectIdentifierList = [
    ...(objects.Versions || []),
    ...(objects.DeleteMarkers || [])
  ].map((o) => ({ Key: o.Key || '', VersionId: o.VersionId }))

  if (objectsToDelete.length) {
    await s3
      .deleteObjects({ Bucket: bucketName, Delete: { Objects: objectsToDelete } })
      .promise()
  }

  if (objects.IsTruncated) {
    await deleteBucket(bucketName)
  }
}
