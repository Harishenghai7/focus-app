/**
 * Unit Tests for Skeleton Screen Components
 */

import { render, screen } from '@testing-library/react';
import {
  Skeleton,
  PostSkeleton,
  ProfileSkeleton,
  UserListSkeleton,
  LoadingSpinner,
  LoadingOverlay,
  GridSkeleton
} from '../SkeletonScreen';

describe('Skeleton', () => {
  it('should render with default props', () => {
    render(<Skeleton />);
    const skeleton = screen.getByRole('status');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute('aria-label', 'Loading content');
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
  });

  it('should apply custom width and height', () => {
    render(<Skeleton width="200px" height="50px" />);
    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveStyle({ width: '200px', height: '50px' });
  });

  it('should apply custom border radius', () => {
    render(<Skeleton borderRadius="10px" />);
    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveStyle({ borderRadius: '10px' });
  });

  it('should apply custom className', () => {
    render(<Skeleton className="custom-class" />);
    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveClass('skeleton');
    expect(skeleton).toHaveClass('custom-class');
  });
});

describe('PostSkeleton', () => {
  it('should render post skeleton structure', () => {
    render(<PostSkeleton />);
    const skeleton = screen.getByRole('status', { name: /loading post/i });
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass('post-skeleton');
  });

  it('should have header, image, actions, and caption sections', () => {
    const { container } = render(<PostSkeleton />);
    expect(container.querySelector('.post-skeleton-header')).toBeInTheDocument();
    expect(container.querySelector('.post-skeleton-actions')).toBeInTheDocument();
    expect(container.querySelector('.post-skeleton-caption')).toBeInTheDocument();
  });
});

describe('ProfileSkeleton', () => {
  it('should render profile skeleton structure', () => {
    const { container } = render(<ProfileSkeleton />);
    expect(container.querySelector('.profile-skeleton')).toBeInTheDocument();
    expect(container.querySelector('.profile-skeleton-header')).toBeInTheDocument();
    expect(container.querySelector('.profile-skeleton-stats')).toBeInTheDocument();
    expect(container.querySelector('.profile-skeleton-info')).toBeInTheDocument();
  });

  it('should render three stat sections', () => {
    const { container } = render(<ProfileSkeleton />);
    const stats = container.querySelectorAll('.profile-skeleton-stat');
    expect(stats).toHaveLength(3);
  });
});

describe('UserListSkeleton', () => {
  it('should render user list skeleton structure', () => {
    const { container } = render(<UserListSkeleton />);
    expect(container.querySelector('.user-list-skeleton')).toBeInTheDocument();
    expect(container.querySelector('.user-list-skeleton-text')).toBeInTheDocument();
  });
});

describe('GridSkeleton', () => {
  it('should render default number of grid items', () => {
    const { container } = render(<GridSkeleton />);
    const items = container.querySelectorAll('.skeleton');
    expect(items).toHaveLength(9);
  });

  it('should render custom number of grid items', () => {
    const { container } = render(<GridSkeleton count={12} />);
    const items = container.querySelectorAll('.skeleton');
    expect(items).toHaveLength(12);
  });
});

describe('LoadingSpinner', () => {
  it('should render with default props', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole('status', { name: /loading/i });
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('aria-busy', 'true');
  });

  it('should apply size classes', () => {
    const { rerender } = render(<LoadingSpinner size="small" />);
    let spinner = screen.getByRole('status');
    expect(spinner).toHaveStyle({ width: '20px', height: '20px' });

    rerender(<LoadingSpinner size="medium" />);
    spinner = screen.getByRole('status');
    expect(spinner).toHaveStyle({ width: '40px', height: '40px' });

    rerender(<LoadingSpinner size="large" />);
    spinner = screen.getByRole('status');
    expect(spinner).toHaveStyle({ width: '60px', height: '60px' });
  });

  it('should apply color class', () => {
    render(<LoadingSpinner color="secondary" />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('loading-spinner-secondary');
  });
});

describe('LoadingOverlay', () => {
  it('should render with default message', () => {
    render(<LoadingOverlay />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render with custom message', () => {
    render(<LoadingOverlay message="Please wait..." />);
    expect(screen.getByText('Please wait...')).toBeInTheDocument();
  });

  it('should have dialog role and be modal', () => {
    const { container } = render(<LoadingOverlay />);
    const overlay = container.querySelector('.loading-overlay');
    expect(overlay).toHaveAttribute('role', 'dialog');
    expect(overlay).toHaveAttribute('aria-modal', 'true');
  });

  it('should contain a loading spinner', () => {
    render(<LoadingOverlay />);
    const spinner = screen.getByRole('status', { name: /loading/i });
    expect(spinner).toBeInTheDocument();
  });
});
