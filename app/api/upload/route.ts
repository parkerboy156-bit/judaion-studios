import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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
    // We now expect JSON with the path and type, not the actual file
    const { path, contentType } = await req.json();

    if (!path || !contentType) {
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    const command = new PutObjectCommand({
      Bucket: process.env.OCI_BUCKET_NAME,
      Key: path,
      ContentType: contentType,
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