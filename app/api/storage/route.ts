import { NextRequest, NextResponse } from "next/server";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { requireUser } from "@/lib/apiAuth";

const s3Client = new S3Client({
  region: process.env.OCI_REGION,
  endpoint: process.env.OCI_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.OCI_ACCESS_KEY_ID!,
    secretAccessKey: process.env.OCI_SECRET_ACCESS_KEY!,
  },
});

// Public URLs are built as `${BASE}/o/${key}` in the upload route — anything
// that doesn't start with this bucket's own prefix is not ours to delete.
const publicBase = () =>
  `https://objectstorage.${process.env.OCI_REGION}.oraclecloud.com/n/${process.env.OCI_NAMESPACE}/b/${process.env.OCI_BUCKET_NAME}/o/`;

const keyFromUrl = (url: string): string | null => {
  if (typeof url !== "string" || !url.startsWith(publicBase())) return null;
  const raw = url.slice(publicBase().length).split(/[?#]/)[0];
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
};

// Removes objects from the bucket. Callers pass the stored public URLs (asset
// masters and their thumbs); anything outside this bucket is ignored rather
// than trusted. Auth is mandatory — an open version of this endpoint would let
// anyone empty the bucket.
export async function DELETE(req: NextRequest) {
  try {
    if (!(await requireUser(req)))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { urls } = await req.json();
    if (!Array.isArray(urls))
      return NextResponse.json({ error: "urls[] required" }, { status: 400 });

    const keys = [
      ...new Set(urls.map(keyFromUrl).filter((k): k is string => !!k)),
    ];
    if (keys.length === 0) return NextResponse.json({ deleted: 0 });

    // One DELETE per key rather than the batch DeleteObjects API: OCI's S3
    // layer requires a Content-MD5 / sha256 / crc32c checksum on the batch
    // call and rejects the crc32 the SDK sends by default. A plain DELETE
    // needs no checksum, and it reports per-key errors instead of all-or-
    // nothing. Concurrency-capped so a big project can't open 50 sockets.
    let deleted = 0;
    const errors: string[] = [];
    const queue = [...keys];
    const worker = async () => {
      for (let key = queue.pop(); key; key = queue.pop()) {
        try {
          await s3Client.send(
            new DeleteObjectCommand({
              Bucket: process.env.OCI_BUCKET_NAME,
              Key: key,
            }),
          );
          deleted += 1;
        } catch (e: any) {
          errors.push(`${key}: ${e.message}`);
        }
      }
    };
    await Promise.all(
      Array.from({ length: Math.min(8, keys.length) }, worker),
    );

    if (errors.length) console.error("Bucket delete errors:", errors);
    return NextResponse.json({ deleted, errors });
  } catch (error: any) {
    console.error("Bucket delete failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
