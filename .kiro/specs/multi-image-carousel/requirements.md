# Requirements Document

## Introduction

This feature enables users to create posts with multiple images and/or videos in a single post, displayed as a swipeable carousel. This is a core feature for modern social media platforms, allowing richer content sharing and better storytelling.

## Glossary

- **Carousel Post**: A post containing multiple media items (images/videos) that users can swipe through horizontally
- **Media Item**: A single image or video within a carousel
- **Post System**: The existing Focus post creation and display functionality
- **Media Array**: An ordered collection of media URLs stored for a carousel post

## Requirements

### Requirement 1

**User Story:** As a content creator, I want to upload multiple images/videos in a single post, so that I can share a complete story or album without creating multiple posts

#### Acceptance Criteria

1. WHEN THE User selects media for a new post, THE Post System SHALL allow selection of up to 10 media items
2. WHILE THE User is selecting media, THE Post System SHALL display a counter showing current selection (e.g., "3/10")
3. WHEN THE User has selected multiple media items, THE Post System SHALL display thumbnails of all selected items in order
4. THE Post System SHALL allow the User to reorder selected media items before posting
5. THE Post System SHALL allow the User to remove individual items from the selection

### Requirement 2

**User Story:** As a user viewing posts, I want to swipe through multiple images/videos in a post, so that I can see all content shared by the creator

#### Acceptance Criteria

1. WHEN A post contains multiple media items, THE Feed System SHALL display a carousel interface with swipe indicators
2. THE Feed System SHALL display the current position indicator (e.g., "1/5" or dots)
3. WHEN THE User swipes left on a carousel, THE Feed System SHALL advance to the next media item with smooth animation
4. WHEN THE User swipes right on a carousel, THE Feed System SHALL return to the previous media item
5. THE Feed System SHALL support both touch swipe and click/tap navigation on carousel arrows

### Requirement 3

**User Story:** As a user, I want carousel posts to work seamlessly across all views, so that I have a consistent experience throughout the app

#### Acceptance Criteria

1. THE Post System SHALL display carousel functionality in the home feed
2. THE Post System SHALL display carousel functionality in profile grids (showing first image with indicator)
3. THE Post System SHALL display carousel functionality in post detail view
4. THE Post System SHALL display carousel functionality in explore page
5. WHEN A carousel post appears in a grid view, THE Post System SHALL display a carousel icon indicator on the thumbnail

### Requirement 4

**User Story:** As a content creator, I want to edit carousel posts, so that I can update or fix content after posting

#### Acceptance Criteria

1. WHEN THE User edits a carousel post, THE Post System SHALL allow adding new media items up to the 10-item limit
2. THE Post System SHALL allow removing media items from existing carousel posts
3. THE Post System SHALL allow reordering media items in existing carousel posts
4. IF A carousel post is reduced to 1 media item, THEN THE Post System SHALL display it as a standard single-media post
5. THE Post System SHALL preserve the caption and other metadata when editing carousel media

### Requirement 5

**User Story:** As a developer, I want carousel data stored efficiently, so that the system performs well at scale

#### Acceptance Criteria

1. THE Database System SHALL store media URLs as an ordered array in the posts table
2. THE Database System SHALL store media types (image/video) for each item in the array
3. WHEN A post is deleted, THE Storage System SHALL delete all associated media files
4. THE API System SHALL return carousel posts with all media items in a single query
5. THE System SHALL support lazy loading of carousel media items for performance optimization
