/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Layout from './Layout.js';

// Simple test setup without complex mocking
const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Layout Component', () => {
  beforeAll(() => {
    // Mock window.innerWidth for consistent testing
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    
    // Mock window.innerHeight
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    });
  });

  it('renders children correctly', () => {
    renderWithRouter(
      <Layout>
        <div data-testid="child-content">Test Content</div>
      </Layout>
    );

    const childContent = screen.getByTestId('child-content');
    const mainElement = screen.getByRole('main');
    
    expect(childContent).toBeInTheDocument();
    expect(mainElement).toBeInTheDocument();
    expect(mainElement).toContainElement(childContent);
  });

  it('applies layout class correctly', () => {
    renderWithRouter(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );

    const layoutElement = screen.getByTestId('layout');
    expect(layoutElement).toHaveClass('layout');
  });

  it('accepts custom className prop', () => {
    renderWithRouter(
      <Layout className="custom-class">
        <div>Custom Content</div>
      </Layout>
    );

    const layoutElement = screen.getByTestId('layout');
    expect(layoutElement).toHaveClass('custom-class');
  });

  it('accepts custom data-testid prop', () => {
    renderWithRouter(
      <Layout data-testid="custom-layout">
        <div>Test Content</div>
      </Layout>
    );

    expect(screen.getByTestId('custom-layout')).toBeInTheDocument();
  });

  it('applies forced layout type when provided', () => {
    renderWithRouter(
      <Layout layoutType="wide">
        <div>Wide Content</div>
      </Layout>
    );

    const layoutElement = screen.getByTestId('layout');
    expect(layoutElement).toHaveClass('wide');
  });

  it('has proper semantic structure', () => {
    renderWithRouter(
      <Layout>
        <div>Content</div>
      </Layout>
    );

    const mainElement = screen.getByRole('main');
    expect(mainElement).toBeInTheDocument();
    expect(mainElement).toHaveTextContent('Content');
  });
});
