export function normalizeImageUrl(imageUrl: string): string {
  if (!imageUrl) return '';

  if (imageUrl.startsWith('/assets/')) {  // If it already starts with /assets/, it's the new format
    return imageUrl;
  }
  
  if (imageUrl.startsWith('/images/products/')) {  // If it starts with /images/products/, convert to assets format
    return imageUrl.replace('/images/products/', '/assets/images/products/');
  }
  
  if (imageUrl.startsWith('images/products/')) {  // If it doesn't start with /, add the assets prefix
    return '/assets/' + imageUrl;
  }
  
  return `/assets/images/products/${imageUrl}`;  // Default case
}
