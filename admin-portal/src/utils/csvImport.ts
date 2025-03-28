import metadataService from '@/services/metadataService';

export async function importMetadataFromCSV(csvContent: string): Promise<{ success: boolean; message: string }> {
  try {
    await metadataService.importMetadataFromCSV(csvContent);
    return {
      success: true,
      message: 'Metadata imported successfully'
    };
  } catch (error) {
    console.error('Error importing metadata:', error);
    return {
      success: false,
      message: 'Failed to import metadata'
    };
  }
} 