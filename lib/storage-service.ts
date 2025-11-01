import { supabase } from './supabase';

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFileToStorage(
  file: File,
  jobId: string
): Promise<string> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${jobId}/${Date.now()}-${file.name}`;
    const filePath = `uploads/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      // Don't fail the whole process if storage fails
      return `/local/${file.name}`;
    }

    // Get public URL
    const { data } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading to storage:', error);
    // Return fallback path
    return `/local/${file.name}`;
  }
}

/**
 * Create storage bucket if it doesn't exist
 */
export async function ensureStorageBucket() {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    
    const documentsBucket = buckets?.find(b => b.name === 'documents');
    
    if (!documentsBucket) {
      await supabase.storage.createBucket('documents', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['application/pdf'],
      });
      console.log('Created documents storage bucket');
    }
  } catch (error) {
    console.error('Error ensuring storage bucket:', error);
    // Non-critical, continue without storage
  }
}

