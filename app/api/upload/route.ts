import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
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

export async function POST(req: NextRequest) {
  try {
    // Signing an upload for an arbitrary key is a write to the bucket — only
    // a signed-in admin gets one. Without this, anyone could overwrite any
    // object or fill the bucket.
    if (!(await requireUser(req)))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // We now expect JSON with the path and type, not the actual file
    const { path, contentType } = await req.json();

    if (!path || !contentType) {
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    const command = new PutObjectCommand({
      Bucket: process.env.OCI_BUCKET_NAME,
      Key: path,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000",
    });

    // Generate a URL valid for 60 seconds
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });
    
    const publicUrl = `https://objectstorage.${process.env.OCI_REGION}.oraclecloud.com/n/${process.env.OCI_NAMESPACE}/b/${process.env.OCI_BUCKET_NAME}/o/${path}`;

    return NextResponse.json({ signedUrl, publicUrl });
  } catch (error: any) {
    console.error("Presign Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}