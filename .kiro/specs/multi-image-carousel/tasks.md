# Implementation Plan - Multi-Image Carousel

- [x] 1. Database schema updates


  - Add media_urls, media_types, and is_carousel columns to posts table
  - Create migration SQL script
  - Test backward compatibility with existing posts
  - _Requirements: 5.1, 5.2, 5.3_





- [ ] 2. Create CarouselViewer component
  - [ ] 2.1 Build swipeable container with framer-motion
    - Implement touch/mouse drag detection

    - Add smooth slide animations between items
    - Handle edge cases (first/last item)
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [ ] 2.2 Add navigation controls
    - Create position indicator dots

    - Add "X/Y" counter display
    - Implement left/right arrow buttons
    - Add keyboard navigation support
    - _Requirements: 2.2, 2.5_
  
  - [x] 2.3 Implement media rendering

    - Handle image display with lazy loading
    - Handle video playback with controls
    - Add loading states for each media item
    - Implement error handling for failed loads
    - _Requirements: 2.1, 5.5_





  
  - [ ] 2.4 Add styling and responsive design
    - Create CSS for carousel container
    - Style navigation controls
    - Ensure mobile responsiveness
    - Add dark mode support

    - _Requirements: 2.1, 2.2_

- [ ] 3. Create MediaSelector component
  - [ ] 3.1 Build multi-file selection interface
    - Implement file input with multiple selection
    - Add drag-and-drop file upload

    - Validate file types (images/videos only)
    - Validate file sizes (10MB images, 100MB videos)
    - Show selection counter (X/10)



    - _Requirements: 1.1, 1.2_
  
  - [ ] 3.2 Create thumbnail preview grid
    - Display thumbnails of selected media
    - Show media type indicators (image/video icon)

    - Add remove button for each item
    - Implement drag-to-reorder functionality
    - _Requirements: 1.3, 1.4, 1.5_
  
  - [ ] 3.3 Add validation and error handling
    - Prevent selection beyond 10 items
    - Show error messages for invalid files

    - Handle duplicate file selection
    - _Requirements: 1.1_

- [ ] 4. Update Create.js for carousel posts
  - [x] 4.1 Integrate MediaSelector component



    - Replace single file input with MediaSelector
    - Update state management for media array
    - Add toggle for single vs carousel mode
    - _Requirements: 1.1, 1.2, 1.3_
  

  - [ ] 4.2 Implement multi-file upload logic
    - Create parallel upload function for multiple files
    - Generate unique filenames for each media item
    - Upload files to Supabase storage
    - Collect all URLs and types into arrays

    - Handle upload progress for multiple files
    - _Requirements: 5.1, 5.2_
  
  - [x] 4.3 Update post creation logic


    - Set is_carousel flag based on media count
    - Store media_urls and media_types arrays
    - Maintain backward compatibility for single media
    - Handle post creation errors
    - _Requirements: 1.1, 5.1, 5.2_


- [ ] 5. Update PostCard.js for carousel display
  - [ ] 5.1 Add carousel detection logic
    - Check is_carousel flag on post data
    - Conditionally render CarouselViewer or single media

    - Handle legacy posts without carousel fields
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [ ] 5.2 Add carousel indicator for grid views
    - Show carousel icon on thumbnails

    - Display media count (e.g., "1/5")

    - Ensure indicator is visible on all backgrounds
    - _Requirements: 3.5_
  
  - [ ] 5.3 Update interaction handlers
    - Prevent double-tap like on carousel swipe
    - Handle video playback in carousel

    - Ensure share/save work with carousel posts
    - _Requirements: 2.1, 2.3, 2.4_

- [ ] 6. Update PostDetail.js for carousel
  - Integrate CarouselViewer component

  - Ensure full-size media display
  - Handle comments section with carousel
  - Test all interactions (like, comment, share)
  - _Requirements: 3.3_


- [ ] 7. Update Explore.js for carousel
  - Show carousel indicator on explore grid
  - Handle carousel posts in explore feed
  - Ensure proper thumbnail display
  - _Requirements: 3.4, 3.5_



- [ ] 8. Update Profile.js for carousel
  - Show carousel indicator on profile grid
  - Handle carousel posts in profile view
  - Ensure proper thumbnail display (first image)
  - _Requirements: 3.2, 3.5_


- [ ] 9. Implement edit functionality for carousel posts
  - [ ] 9.1 Update EditPostModal component
    - Load existing media_urls and media_types
    - Allow adding new media items (up to 10 total)

    - Allow removing media items
    - Allow reordering media items
    - _Requirements: 4.1, 4.2, 4.3_
  

  - [ ] 9.2 Handle carousel-to-single conversion
    - Detect when carousel reduced to 1 item
    - Update is_carousel flag to false
    - Migrate data to single media fields
    - _Requirements: 4.4_
  

  - [x] 9.3 Preserve metadata during edits

    - Keep caption unchanged unless edited
    - Maintain likes, comments, shares
    - Update only media-related fields
    - _Requirements: 4.5_


- [ ] 10. Implement deletion logic for carousel posts
  - Update delete function to handle media arrays
  - Delete all media files from storage
  - Ensure cascade deletion works properly
  - Test with various carousel sizes

  - _Requirements: 5.3_

- [ ] 11. Add performance optimizations
  - [ ] 11.1 Implement lazy loading
    - Load only first 2 media items initially

    - Load additional items on demand
    - Preload next/previous items on navigation
    - _Requirements: 5.5_
  
  - [x] 11.2 Add image optimization

    - Compress images on upload
    - Generate thumbnail versions for grids
    - Implement progressive loading
    - _Requirements: 5.5_
  
  - [ ] 11.3 Optimize carousel rendering
    - Use virtualization for large carousels
    - Cache loaded media in memory


    - Implement viewport-based loading in feed
    - _Requirements: 5.5_

- [ ] 12. Create database migration script
  - Write SQL migration for schema changes
  - Add rollback script for safety
  - Test migration on development database
  - Document migration process
  - _Requirements: 5.1, 5.2_

- [ ] 13. Integration testing
  - [ ] 13.1 Test create flow end-to-end
    - Select multiple media items
    - Upload and create carousel post
    - Verify post appears correctly in feed
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [ ] 13.2 Test view flow end-to-end
    - View carousel in home feed
    - Navigate through all media items
    - Test on mobile and desktop
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [ ] 13.3 Test edit flow end-to-end
    - Edit existing carousel post
    - Add, remove, and reorder items
    - Verify changes persist correctly
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [ ] 13.4 Test across all views
    - Verify carousel works in feed
    - Verify carousel works in profile
    - Verify carousel works in detail view
    - Verify carousel works in explore
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 14. Error handling and edge cases
  - Test with slow network conditions
  - Test with failed uploads
  - Test with invalid file types
  - Test with oversized files
  - Test with mixed image/video carousels
  - Test deletion of carousel posts
  - _Requirements: All_

- [ ] 15. Documentation and cleanup
  - Update component documentation
  - Add code comments for complex logic
  - Create user guide for carousel feature
  - Update API documentation if needed
  - _Requirements: All_
