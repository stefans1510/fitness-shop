/**
 * Utility function to normalize product image URLs
 * Handles both old format (/images/products/) and new format (/assets/images/products/)
 */
export function normalizeImageUrl(imageUrl: string): string {
  if (!imageUrl) return '';
  
  // If it already starts with /assets/, it's the new format
  if (imageUrl.startsWith('/assets/')) {
    return imageUrl;
  }
  
  // If it starts with /images/products/, convert to assets format
  if (imageUrl.startsWith('/images/products/')) {
    return imageUrl.replace('/images/products/', '/assets/images/products/');
  }
  
  // If it doesn't start with /, add the assets prefix
  if (imageUrl.startsWith('images/products/')) {
    return '/assets/' + imageUrl;
  }
  
  // Default case - assume it's a filename and add full assets path
  return `/assets/images/products/${imageUrl}`;
}
