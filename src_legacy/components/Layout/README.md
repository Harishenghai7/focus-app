# Layout Component

A universal layout component that wraps all pages with responsive design, dark mode support, and proper structure.

## Features

- **Responsive Design**: Adapts to different screen sizes with proper breakpoints
- **Multiple Layout Types**: 
  - Feed layout (614px max width)
  - Profile layout (935px max width) 
  - Wide layout (1200px max width)
- **Dark Mode Support**: Automatic dark mode detection and theme switching
- **Mobile/Desktop Detection**: Dynamic responsive behavior
- **Accessibility**: Focus management, high contrast, and reduced motion support
- **Safe Area Support**: Handles mobile devices with notches/safe areas

## Usage

```jsx
import Layout from '../components/Layout';

function App() {
  return (
    <Layout>
      <YourPageContent />
    </Layout>
  );
}
```

## Layout Types

The component automatically determines the layout type based on the current route:

- **Feed Layout** (`/`, `/home`, `/feed`): 614px container for optimal reading
- **Profile Layout** (`/profile/*`, `/user/*`): 935px container for profile content
- **Wide Layout** (`/messages`, `/chat`, `/explore`, `/search`): 1200px container for wide content

## Responsive Breakpoints

- **Desktop**: > 768px - Full layout with proper spacing
- **Tablet**: ≤ 768px - Adjusted spacing and full-width containers
- **Mobile**: ≤ 480px - Minimal spacing, optimized for touch

## Dark Mode

The component supports:
- Automatic system preference detection
- Manual theme switching via `data-theme="dark"` attribute
- CSS custom properties for consistent theming

## Accessibility Features

- Focus management with visible focus indicators
- High contrast mode support
- Reduced motion support for users with vestibular disorders
- Proper semantic structure
- Screen reader friendly

## CSS Custom Properties Used

The component relies on CSS custom properties from the design system:

- Color tokens: `--color-background`, `--color-text-primary`, etc.
- Spacing tokens: `--space-3`, `--space-4`, `--space-6`, `--space-8`
- Transition tokens: `--transition-all`
- Border radius: `--border-radius-md`

## Browser Support

- Modern browsers with CSS Grid and Flexbox support
- CSS custom properties support
- Safe area insets for modern mobile devices
