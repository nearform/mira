"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBucket = void 0;
const s3_1 = __importDefault(require("aws-sdk/clients/s3"));
/** @ignore - Excluded from documentation generation.  */
const s3 = new s3_1.default();
exports.deleteBucket = async (bucketName) => {
    const objects = await s3.listObjectVersions({ Bucket: bucketName }).promise();
    const objectsToDelete = [
        ...(objects.Versions || []),
        ...(objects.DeleteMarkers || [])
    ].map((o) => ({ Key: o.Key || '', VersionId: o.VersionId }));
    if (objectsToDelete.length) {
        await s3
            .deleteObjects({ Bucket: bucketName, Delete: { Objects: objectsToDelete } })
            .promise();
    }
    if (objects.IsTruncated) {
        await exports.deleteBucket(bucketName);
    }
};
//# sourceMappingURL=delete-bucket.js.map