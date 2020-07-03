const mockListObjectVersions = jest.fn()
const mockDeleteObjects = jest.fn()

jest.mock('aws-sdk/clients/s3', () => {
  return jest.fn().mockImplementation(() => {
    return {
      listObjectVersions: mockListObjectVersions,
      deleteObjects: mockDeleteObjects
    }
  })
})

const { deleteBucket } = require('./delete-bucket')

describe('delete bucket', () => {
  const mockListObjectVersionsPromise = jest.fn()
  mockListObjectVersions.mockReturnValue({
    promise: mockListObjectVersionsPromise
  })

  const mockDeleteObjectsPromise = jest.fn()
  mockDeleteObjects.mockReturnValue({
    promise: mockDeleteObjectsPromise
  })

  beforeEach(() => {
    mockListObjectVersions.mockClear()
    mockDeleteObjects.mockClear()
  })

  it('deletes all objects from the bucket w/o pagination', async () => {
    mockListObjectVersionsPromise.mockResolvedValue({
      IsTruncated: false,
      Versions: [
        { Key: '1', VersionId: 'v1', RandomKey: 'test1' },
        { Key: '2', VersionId: 'v2', RandomKey: 'test2' }
      ],
      DeleteMarkers: [{ Key: '3', VersionId: 'v3', RandomKey: 'test3' }]
    })

    await deleteBucket('testBucket')

    expect(mockListObjectVersions).toBeCalledTimes(1)
    expect(mockListObjectVersions).toBeCalledWith({ Bucket: 'testBucket' })

    expect(mockDeleteObjects).toBeCalledTimes(1)
    expect(mockDeleteObjects).toBeCalledWith({
      Bucket: 'testBucket',
      Delete: {
        Objects: [
          { Key: '1', VersionId: 'v1' },
          { Key: '2', VersionId: 'v2' },
          { Key: '3', VersionId: 'v3' }
        ]
      }
    })
  })

  it('deletes all objects from the bucket w/ pagination', async () => {
    mockListObjectVersionsPromise
      .mockResolvedValueOnce({
        IsTruncated: true,
        Versions: [
          { Key: '1', VersionId: 'v1', RandomKey: 'test1' },
          { Key: '2', VersionId: 'v2', RandomKey: 'test2' }
        ]
      })
      .mockResolvedValue({
        IsTruncated: false,
        Versions: [{ Key: '3', VersionId: 'v3', RandomKey: 'test3' }],
        DeleteMarkers: [{ Key: '4', VersionId: 'v4', RandomKey: 'test4' }]
      })

    await deleteBucket('testBucket')

    expect(mockListObjectVersions).toHaveBeenCalledTimes(2)
    expect(mockListObjectVersions).toHaveBeenNthCalledWith(1, {
      Bucket: 'testBucket'
    })
    expect(mockListObjectVersions).toHaveBeenNthCalledWith(2, {
      Bucket: 'testBucket'
    })

    expect(mockDeleteObjects).toHaveBeenCalledTimes(2)
    expect(mockDeleteObjects).toHaveBeenNthCalledWith(1, {
      Bucket: 'testBucket',
      Delete: {
        Objects: [
          { Key: '1', VersionId: 'v1' },
          { Key: '2', VersionId: 'v2' }
        ]
      }
    })
    expect(mockDeleteObjects).toHaveBeenNthCalledWith(2, {
      Bucket: 'testBucket',
      Delete: {
        Objects: [
          { Key: '3', VersionId: 'v3' },
          { Key: '4', VersionId: 'v4' }
        ]
      }
    })
  })
})
