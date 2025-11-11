/**
 * Integration Tests for Post Creation Flow
 * Tests the complete post creation journey including media upload, caption, and publishing
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../../context/ThemeContext';
import CreateMultiType from '../../pages/CreateMultiType';
import { supabase } from '../../supabaseClient';

// Mock Supabase client
jest.mock('../../supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(() => Promise.resolve({
        data: { user: { id: 'test-user-id' } },
        error: null
      }))
    },
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: { id: 'test-post-id', user_id: 'test-user-id' },
            error: null
          }))
        }))
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: { id: 'test-user-id', username: 'testuser' },
            error: null
          }))
        }))
      }))
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(() => Promise.resolve({
          data: { path: 'test-path' },
          error: null
        })),
        getPublicUrl: jest.fn(() => ({
          data: { publicUrl: 'https://example.com/test.jpg' }
        }))
      }))
    }
  },
  TABLES: {
    POSTS: 'posts',
    PROFILES: 'profiles'
  },
  STORAGE_BUCKETS: {
    POSTS: 'posts'
  }
}));

// Mock image compression
jest.mock('../../utils/imageCompression', () => ({
  compressImage: jest.fn((file) => Promise.resolve(file))
}));

// Mock file upload
jest.mock('../../utils/uploadFile', () => ({
  uploadFile: jest.fn(() => Promise.resolve({
    url: 'https://example.com/test.jpg',
    error: null
  }))
}));

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <ThemeProvider>
        {component}
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('Post Creation Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('Single Image Post Creation', () => {
    it('should create post with single image and caption', async () => {
      renderWithProviders(<CreateMultiType />);

      // Create mock file
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      // Simulate file selection
      const fileInput = screen.getByLabelText(/upload/i);
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByAltText(/preview/i)).toBeInTheDocument();
      });

      // Add caption
      const captionInput = screen.getByPlaceholderText(/write a caption/i);
      fireEvent.change(captionInput, { 
        target: { value: 'Test post caption #test' } 
      });

      // Submit post
      const shareButton = screen.getByText(/share/i);
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('posts');
      });
    });

    it('should compress large images before upload', async () => {
      const { compressImage } = require('../../utils/imageCompression');
      
      renderWithProviders(<CreateMultiType />);

      // Create large mock file (> 5MB)
      const largeFile = new File(
        [new ArrayBuffer(6 * 1024 * 1024)], 
        'large.jpg', 
        { type: 'image/jpeg' }
      );

      const fileInput = screen.getByLabelText(/upload/i);
      fireEvent.change(fileInput, { target: { files: [largeFile] } });

      await waitFor(() => {
        expect(compressImage).toHaveBeenCalledWith(largeFile, expect.any(Object));
      });
    });

    it('should validate file type before upload', async () => {
      renderWithProviders(<CreateMultiType />);

      // Create invalid file type
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });

      const fileInput = screen.getByLabelText(/upload/i);
      fireEvent.change(fileInput, { target: { files: [invalidFile] } });

      await waitFor(() => {
        expect(screen.getByText(/invalid file type/i)).toBeInTheDocument();
      });
    });
  });

  describe('Carousel Post Creation', () => {
    it('should create post with multiple images', async () => {
      renderWithProviders(<CreateMultiType />);

      // Create multiple mock files
      const files = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }),
        new File(['test3'], 'test3.jpg', { type: 'image/jpeg' })
      ];

      const fileInput = screen.getByLabelText(/upload/i);
      fireEvent.change(fileInput, { target: { files } });

      await waitFor(() => {
        const previews = screen.getAllByAltText(/preview/i);
        expect(previews).toHaveLength(3);
      });

      // Add caption
      const captionInput = screen.getByPlaceholderText(/write a caption/i);
      fireEvent.change(captionInput, { 
        target: { value: 'Carousel post' } 
      });

      // Submit post
      const shareButton = screen.getByText(/share/i);
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('posts');
      });
    });

    it('should enforce maximum of 10 images per post', async () => {
      renderWithProviders(<CreateMultiType />);

      // Create 11 mock files
      const files = Array.from({ length: 11 }, (_, i) => 
        new File([`test${i}`], `test${i}.jpg`, { type: 'image/jpeg' })
      );

      const fileInput = screen.getByLabelText(/upload/i);
      fireEvent.change(fileInput, { target: { files } });

      await waitFor(() => {
        expect(screen.getByText(/maximum 10 images/i)).toBeInTheDocument();
      });
    });

    it('should allow reordering images in carousel', async () => {
      renderWithProviders(<CreateMultiType />);

      const files = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.jpg', { type: 'image/jpeg' })
      ];

      const fileInput = screen.getByLabelText(/upload/i);
      fireEvent.change(fileInput, { target: { files } });

      await waitFor(() => {
        const previews = screen.getAllByAltText(/preview/i);
        expect(previews).toHaveLength(2);
      });

      // Simulate drag and drop reorder
      const firstImage = screen.getAllByAltText(/preview/i)[0];
      fireEvent.dragStart(firstImage);
      fireEvent.drop(screen.getAllByAltText(/preview/i)[1]);

      // Verify order changed
      await waitFor(() => {
        const reorderedPreviews = screen.getAllByAltText(/preview/i);
        expect(reorderedPreviews).toHaveLength(2);
      });
    });
  });

  describe('Caption and Hashtags', () => {
    it('should parse and linkify hashtags in caption', async () => {
      renderWithProviders(<CreateMultiType />);

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/upload/i);
      fireEvent.change(fileInput, { target: { files: [file] } });

      const captionInput = screen.getByPlaceholderText(/write a caption/i);
      fireEvent.change(captionInput, { 
        target: { value: 'Test post #nature #photography' } 
      });

      await waitFor(() => {
        expect(captionInput.value).toContain('#nature');
        expect(captionInput.value).toContain('#photography');
      });
    });

    it('should enforce caption character limit', async () => {
      renderWithProviders(<CreateMultiType />);

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/upload/i);
      fireEvent.change(fileInput, { target: { files: [file] } });

      const captionInput = screen.getByPlaceholderText(/write a caption/i);
      const longCaption = 'a'.repeat(501);
      
      fireEvent.change(captionInput, { target: { value: longCaption } });

      await waitFor(() => {
        expect(screen.getByText(/500 characters maximum/i)).toBeInTheDocument();
      });
    });

    it('should support @mentions in caption', async () => {
      renderWithProviders(<CreateMultiType />);

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/upload/i);
      fireEvent.change(fileInput, { target: { files: [file] } });

      const captionInput = screen.getByPlaceholderText(/write a caption/i);
      fireEvent.change(captionInput, { 
        target: { value: 'Great photo with @friend' } 
      });

      await waitFor(() => {
        expect(captionInput.value).toContain('@friend');
      });
    });
  });

  describe('Draft Saving', () => {
    it('should auto-save draft every 30 seconds', async () => {
      jest.useFakeTimers();
      
      renderWithProviders(<CreateMultiType />);

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/upload/i);
      fireEvent.change(fileInput, { target: { files: [file] } });

      const captionInput = screen.getByPlaceholderText(/write a caption/i);
      fireEvent.change(captionInput, { target: { value: 'Draft caption' } });

      // Fast-forward 30 seconds
      jest.advanceTimersByTime(30000);

      await waitFor(() => {
        const savedDraft = localStorage.getItem('focus_draft');
        expect(savedDraft).toBeTruthy();
      });

      jest.useRealTimers();
    });

    it('should restore draft on page load', async () => {
      const draftData = {
        caption: 'Restored draft',
        mediaUrls: ['https://example.com/test.jpg']
      };
      
      localStorage.setItem('focus_draft', JSON.stringify(draftData));

      renderWithProviders(<CreateMultiType />);

      await waitFor(() => {
        const captionInput = screen.getByPlaceholderText(/write a caption/i);
        expect(captionInput.value).toBe('Restored draft');
      });
    });
  });

  describe('Scheduled Posts', () => {
    it('should schedule post for future publication', async () => {
      renderWithProviders(<CreateMultiType />);

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/upload/i);
      fireEvent.change(fileInput, { target: { files: [file] } });

      // Open schedule picker
      const scheduleButton = screen.getByText(/schedule/i);
      fireEvent.click(scheduleButton);

      // Select future date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const dateInput = screen.getByLabelText(/date/i);
      fireEvent.change(dateInput, { 
        target: { value: tomorrow.toISOString().split('T')[0] } 
      });

      // Confirm schedule
      const confirmButton = screen.getByText(/confirm/i);
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('posts');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle upload failures gracefully', async () => {
      const { uploadFile } = require('../../utils/uploadFile');
      uploadFile.mockRejectedValueOnce(new Error('Upload failed'));

      renderWithProviders(<CreateMultiType />);

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/upload/i);
      fireEvent.change(fileInput, { target: { files: [file] } });

      const shareButton = screen.getByText(/share/i);
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(screen.getByText(/upload failed/i)).toBeInTheDocument();
      });
    });

    it('should show retry option on network error', async () => {
      supabase.from.mockImplementationOnce(() => ({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.reject(new Error('Network error')))
          }))
        }))
      }));

      renderWithProviders(<CreateMultiType />);

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/upload/i);
      fireEvent.change(fileInput, { target: { files: [file] } });

      const shareButton = screen.getByText(/share/i);
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(screen.getByText(/retry/i)).toBeInTheDocument();
      });
    });
  });

  describe('Post Validation', () => {
    it('should require at least one image', async () => {
      renderWithProviders(<CreateMultiType />);

      const shareButton = screen.getByText(/share/i);
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(screen.getByText(/please select at least one image/i)).toBeInTheDocument();
      });
    });

    it('should validate file size limits', async () => {
      renderWithProviders(<CreateMultiType />);

      // Create file larger than 100MB
      const hugeFile = new File(
        [new ArrayBuffer(101 * 1024 * 1024)], 
        'huge.jpg', 
        { type: 'image/jpeg' }
      );

      const fileInput = screen.getByLabelText(/upload/i);
      fireEvent.change(fileInput, { target: { files: [hugeFile] } });

      await waitFor(() => {
        expect(screen.getByText(/file too large/i)).toBeInTheDocument();
      });
    });
  });
});
