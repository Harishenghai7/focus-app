/**
 * Tests for compressImage and resizeImage utilities
 */
import compressImage from '../compressImage';
import resizeImage from '../resizeImage';

// Mock canvas and image APIs for Node.js testing environment
global.Image = class {
  constructor() {
    this.width = 1920;
    this.height = 1080;
    setTimeout(() => {
      if (this.onload) this.onload();
    }, 0);
  }
};

global.FileReader = class {
  readAsDataURL() {
    setTimeout(() => {
      if (this.onload) {
        this.onload({ target: { result: 'data:image/jpeg;base64,mock' } });
      }
    }, 0);
  }
};

const mockCanvas = {
  width: 0,
  height: 0,
  getContext: () => ({
    drawImage: jest.fn(),
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high'
  }),
  toBlob: (callback, mimeType, quality) => {
    const mockBlob = new Blob(['mock'], { type: mimeType });
    setTimeout(() => callback(mockBlob), 0);
  }
};

global.document = {
  createElement: (tag) => {
    if (tag === 'canvas') return mockCanvas;
    return {};
  }
};

describe('compressImage', () => {
  let mockFile;

  beforeEach(() => {
    mockFile = new File(['mock image data'], 'test.jpg', {
      type: 'image/jpeg',
      lastModified: Date.now()
    });
  });

  test('should compress image with default options', async () => {
    const result = await compressImage(mockFile);
    
    expect(result).toBeInstanceOf(File);
    expect(result.type).toBe('image/jpeg');
    expect(result.name).toBe('test.jpg');
  });

  test('should compress image with custom quality', async () => {
    const result = await compressImage(mockFile, { quality: 0.6 });
    
    expect(result).toBeInstanceOf(File);
  });

  test('should compress image with custom max size', async () => {
    const result = await compressImage(mockFile, { maxSizeMB: 0.5 });
    
    expect(result).toBeInstanceOf(File);
  });

  test('should throw error for invalid file', async () => {
    await expect(compressImage(null)).rejects.toThrow('Invalid file input');
  });

  test('should throw error for non-image file', async () => {
    const textFile = new File(['text'], 'test.txt', { type: 'text/plain' });
    
    await expect(compressImage(textFile)).rejects.toThrow('File must be an image');
  });

  test('should handle PNG images', async () => {
    const pngFile = new File(['mock'], 'test.png', { type: 'image/png' });
    const result = await compressImage(pngFile);
    
    expect(result).toBeInstanceOf(File);
  });

  test('should compress with custom mime type', async () => {
    const result = await compressImage(mockFile, { mimeType: 'image/webp' });
    
    expect(result.type).toBe('image/webp');
  });
});

describe('resizeImage', () => {
  let mockFile;

  beforeEach(() => {
    mockFile = new File(['mock image data'], 'test.jpg', {
      type: 'image/jpeg',
      lastModified: Date.now()
    });
  });

  test('should resize image with default options', async () => {
    const result = await resizeImage(mockFile, 800, 600);
    
    expect(result).toBeInstanceOf(File);
    expect(result.type).toBe('image/jpeg');
    expect(result.name).toBe('test.jpg');
  });

  test('should resize image maintaining aspect ratio', async () => {
    const result = await resizeImage(mockFile, 1920, 1080, {
      maintainAspectRatio: true
    });
    
    expect(result).toBeInstanceOf(File);
  });

  test('should resize without maintaining aspect ratio', async () => {
    const result = await resizeImage(mockFile, 800, 600, {
      maintainAspectRatio: false
    });
    
    expect(result).toBeInstanceOf(File);
  });

  test('should resize with custom quality', async () => {
    const result = await resizeImage(mockFile, 1024, 768, {
      quality: 0.8
    });
    
    expect(result).toBeInstanceOf(File);
  });

  test('should throw error for invalid file', async () => {
    await expect(resizeImage(null, 800, 600)).rejects.toThrow('Invalid file input');
  });

  test('should throw error for non-image file', async () => {
    const textFile = new File(['text'], 'test.txt', { type: 'text/plain' });
    
    await expect(resizeImage(textFile, 800, 600)).rejects.toThrow('File must be an image');
  });

  test('should throw error for invalid dimensions', async () => {
    await expect(resizeImage(mockFile, 0, 600)).rejects.toThrow('Invalid dimensions');
    await expect(resizeImage(mockFile, 800, -1)).rejects.toThrow('Invalid dimensions');
  });

  test('should handle custom mime type', async () => {
    const result = await resizeImage(mockFile, 800, 600, {
      mimeType: 'image/png'
    });
    
    expect(result.type).toBe('image/png');
  });
});

describe('Integration tests', () => {
  let mockFile;

  beforeEach(() => {
    mockFile = new File(['mock image data'], 'test.jpg', {
      type: 'image/jpeg',
      lastModified: Date.now()
    });
  });

  test('should resize then compress image', async () => {
    const resized = await resizeImage(mockFile, 1024, 768);
    const compressed = await compressImage(resized, { quality: 0.8 });
    
    expect(compressed).toBeInstanceOf(File);
  });

  test('should compress then resize image', async () => {
    const compressed = await compressImage(mockFile, { quality: 0.7 });
    const resized = await resizeImage(compressed, 800, 600);
    
    expect(resized).toBeInstanceOf(File);
  });
});
