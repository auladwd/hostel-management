import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary server-side instance
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export interface UploadResult {
  secureUrl: string;
  publicId: string;
  format: string;
  bytes: number;
}

/**
 * Uploads a base64 or buffer image securely to Cloudinary with auto optimization
 */
export async function uploadImageServer(
  fileBase64OrUrl: string,
  folder: string = 'hostel_management',
  tags: string[] = ['hostel']
): Promise<UploadResult> {
  const result = await cloudinary.uploader.upload(fileBase64OrUrl, {
    folder: `${process.env.CLOUDINARY_FOLDER || 'hostel_management'}/${folder}`,
    resource_type: 'auto',
    tags,
    transformation: [
      { quality: 'auto:good' },
      { fetch_format: 'auto' },
    ],
  });

  return {
    secureUrl: result.secure_url,
    publicId: result.public_id,
    format: result.format,
    bytes: result.bytes,
  };
}

/**
 * Generates an optimized, resized image URL using Cloudinary transformations
 */
export function getOptimizedImageUrl(
  publicId: string,
  options?: { width?: number; height?: number; crop?: string }
): string {
  if (!publicId) return '';
  return cloudinary.url(publicId, {
    secure: true,
    width: options?.width || 600,
    height: options?.height,
    crop: options?.crop || 'fill',
    quality: 'auto',
    fetch_format: 'auto',
  });
}

/**
 * Generates signed upload parameters for secure direct client-to-Cloudinary uploads
 */
export function generateSignedUploadParams(folder: string = 'general') {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const targetFolder = `${process.env.CLOUDINARY_FOLDER || 'hostel_management'}/${folder}`;

  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder: targetFolder,
    },
    process.env.CLOUDINARY_API_SECRET || ''
  );

  return {
    timestamp,
    folder: targetFolder,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  };
}

/**
 * Deletes a file from Cloudinary by public ID
 */
export async function deleteCloudinaryAsset(publicId: string): Promise<boolean> {
  if (!publicId) return false;
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Cloudinary Deletion Error:', error);
    return false;
  }
}

export default cloudinary;
