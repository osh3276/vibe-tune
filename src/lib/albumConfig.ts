// Album Cover Configuration
// You can customize these settings to match your setup

export const albumConfig = {
  // Total number of unique album covers you have
  totalAlbums: 50, // Updated to support 50 unique images
  
  // Image formats to try (in order of preference)
  supportedFormats: ['jpg', 'jpeg', 'png', 'webp'],
  
  // Base path for album covers (relative to /public/)
  basePath: '/album-covers/',
  
  // Naming pattern function
  getImageName: (albumNumber: number, format: string) => {
    return `album-${albumNumber}.${format}`;
  },
  
  // Alternative naming patterns you can use:
  
  // For zero-padded numbers: album-001.jpg, album-002.jpg, etc.
  // getImageName: (albumNumber: number, format: string) => {
  //   return `album-${albumNumber.toString().padStart(3, '0')}.${format}`;
  // },
  
  // For custom prefix: cover_1.jpg, cover_2.jpg, etc.
  // getImageName: (albumNumber: number, format: string) => {
  //   return `cover_${albumNumber}.${format}`;
  // },
  
  // For random/hash names (you'll need to provide the mapping)
  // imageMapping: {
  //   1: 'abc123.jpg',
  //   2: 'def456.jpg',
  //   // ... etc
  // },
  // getImageName: (albumNumber: number, format: string) => {
  //   return albumConfig.imageMapping[albumNumber] || `fallback-${albumNumber}.${format}`;
  // },
};
