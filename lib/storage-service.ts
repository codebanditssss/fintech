import { supabase } from './supabase';

export async function uploadFileToStorage(
  file: File,
  jobId: string
): Promise<string> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${jobId}/${Date.now()}-${file.name}`;
    const filePath = `uploads/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
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
  }
}

