# Linkify Utility - Complete Documentation

## Overview

The `linkify.js` utility converts plain text into HTML with clickable links for URLs, mentions, and hashtags.

## Features

✅ **URL Detection**: Converts http:// and https:// URLs to clickable links
✅ **Mention Linking**: Converts @username to profile links
✅ **Hashtag Linking**: Converts #tag to explore/search links
✅ **HTML Escaping**: Prevents XSS attacks by escaping HTML
✅ **Configurable**: Enable/disable each feature independently
✅ **Extraction Helpers**: Extract URLs, mentions, and hashtags from text
✅ **React Component**: Ready-to-use LinkifiedText component

## Installation

```javascript
import linkify, { 
  extractMentions, 
  extractHashtags, 
  extractUrls,
  stripHtml,
  hasLinkableContent
} from './utils/data/linkify';
```

## Basic Usage

### Simple Example

```javascript
const text = "Check out https://example.com and @john #trending";
const html = linkify(text);
// Output: 'Check out <a href="https://example.com" target="_blank" rel="noopener noreferrer" class="link-url">https://example.com</a> and <a href="/profile/john" class="mention" data-username="john">@john</a> <a href="/explore?tag=trending" class="hashtag" data-tag="trending">#trending</a>'
```

### With Options

```javascript
const options = {
  urls: true,           // Enable URL linking (default: true)
  mentions: true,       // Enable mention linking (default: true)
  hashtags: true,       // Enable hashtag linking (default: true)
  mentionPath: '/user', // Base path for mentions (default: '/profile')
  hashtagPath: '/tags', // Base path for hashtags (default: '/explore')
  newTab: false         // Open URLs in new tab (default: true)
};

const html = linkify(text, options);
```

## Supported Patterns

### URLs
- `http://example.com`
- `https://example.com`
- `https://example.com/path/to/page`
- `https://example.com?query=value&page=1`
- `https://example.com#section`
- `http://localhost:3000`

### Mentions
- `@username`
- `@user_name`
- `@user123`
- `@CAPS_USER`

Must be preceded by whitespace or start of string.

### Hashtags
- `#trending`
- `#social_media`
- `#covid19`
- `#UPPERCASE`

Must be preceded by whitespace or start of string.

## Helper Functions

### extractMentions(text)
Extract all mentioned usernames from text.

```javascript
const mentions = extractMentions("Hello @john and @jane");
// Returns: ["john", "jane"]
```

### extractHashtags(text)
Extract all hashtags from text.

```javascript
const hashtags = extractHashtags("Check #news and #sports");
// Returns: ["news", "sports"]
```

### extractUrls(text)
Extract all URLs from text.

```javascript
const urls = extractUrls("Visit https://example.com and http://test.com");
// Returns: ["https://example.com", "http://test.com"]
```

### stripHtml(html)
Remove all HTML tags from text.

```javascript
const clean = stripHtml('<a href="/profile/john">@john</a>');
// Returns: "@john"
```

### hasLinkableContent(text)
Check if text contains any URLs, mentions, or hashtags.

```javascript
const hasLinks = hasLinkableContent("Hello @john #trending");
// Returns: true
```

## React Component Usage

### Basic Example

```jsx
import LinkifiedText from './utils/data/LinkifiedText';

function PostContent({ text }) {
  return (
    <div>
      <LinkifiedText>{text}</LinkifiedText>
    </div>
  );
}
```

### With Custom Handlers

```jsx
import LinkifiedText from './utils/data/LinkifiedText';

function PostContent({ text }) {
  const handleLinkClick = ({ type, value, href, isExternal, event }) => {
    console.log('Link clicked:', { type, value, href });
    
    // Handle mention clicks
    if (type === 'mention') {
      // Navigate to user profile
      // Return false to prevent default navigation
      return false;
    }
    
    // Handle hashtag clicks
    if (type === 'hashtag') {
      // Navigate to hashtag page
      return false;
    }
    
    // Let URLs navigate normally
    return true;
  };

  return (
    <LinkifiedText 
      onClick={handleLinkClick}
      mentions={true}
      hashtags={true}
      urls={true}
    >
      {text}
    </LinkifiedText>
  );
}
```

### With Custom Paths

```jsx
<LinkifiedText 
  mentionPath="/users"
  hashtagPath="/tags"
  newTab={false}
>
  Check out @john and #trending at https://example.com
</LinkifiedText>
```

## Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | string | - | Text content to linkify |
| `className` | string | '' | Additional CSS classes |
| `urls` | boolean | true | Enable URL linking |
| `mentions` | boolean | true | Enable mention linking |
| `hashtags` | boolean | true | Enable hashtag linking |
| `mentionPath` | string | '/profile' | Base path for mentions |
| `hashtagPath` | string | '/explore' | Base path for hashtags |
| `newTab` | boolean | true | Open URLs in new tab |
| `onClick` | function | null | Custom click handler |

## Security

### XSS Prevention

The utility automatically escapes HTML special characters to prevent XSS attacks:

```javascript
const malicious = 'Visit https://example.com/<script>alert("xss")</script>';
const safe = linkify(malicious);
// Output: 'Visit <a href="https://example.com/&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;">...</a>'
```

### Safe URL Handling

- Automatically escapes special characters in URLs
- Adds `rel="noopener noreferrer"` for external links
- Validates URL patterns before linking

## Styling

The component includes default styles with:
- Twitter-like blue links (#1d9bf0)
- Hover effects with background highlights
- Dark mode support
- Accessibility focus indicators
- Print-friendly styles

### Custom Styling

Override default styles using CSS:

```css
.linkified-text .link-url {
  color: #0066cc;
}

.linkified-text .mention {
  color: #00aa00;
  font-weight: bold;
}

.linkified-text .hashtag {
  color: #ff6600;
}
```

## Real-World Examples

### Social Media Post

```jsx
import LinkifiedText from './utils/data/LinkifiedText';

function SocialPost({ post }) {
  return (
    <div className="post">
      <div className="post-header">
        <strong>{post.author}</strong>
      </div>
      <div className="post-content">
        <LinkifiedText>{post.content}</LinkifiedText>
      </div>
    </div>
  );
}

// Usage
<SocialPost 
  post={{
    author: "John Doe",
    content: "Just launched our new site at https://example.com! Thanks to @jane and @mike for the help. #webdev #launch"
  }}
/>
```

### Comment Section

```jsx
function Comment({ comment }) {
  const handleMentionClick = ({ value }) => {
    // Notify user when mentioned
    console.log('User mentioned:', value);
  };

  return (
    <div className="comment">
      <LinkifiedText onClick={handleMentionClick}>
        {comment.text}
      </LinkifiedText>
    </div>
  );
}
```

### Chat Message

```jsx
function ChatMessage({ message }) {
  return (
    <div className="message">
      <LinkifiedText 
        urls={true}
        mentions={true}
        hashtags={false}
        newTab={true}
      >
        {message.content}
      </LinkifiedText>
    </div>
  );
}
```

## Edge Cases Handled

✅ Empty strings
✅ Null/undefined input
✅ Non-string input
✅ Text with no linkable content
✅ Multiple URLs/mentions/hashtags
✅ URLs with trailing punctuation
✅ Mentions at start of string
✅ Hashtags at start of string
✅ Mixed content (URLs + mentions + hashtags)
✅ Special characters in URLs
✅ Email addresses (not linkified as mentions)

## Performance

- **Efficient regex patterns**: Optimized for performance
- **Single pass processing**: Processes text once per feature
- **Minimal DOM operations**: Uses innerHTML for rendering
- **No external dependencies**: Pure JavaScript implementation

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers

## Testing

Run tests:
```bash
npm test linkify.test.js
```

Test coverage:
- ✅ URL linking
- ✅ Mention linking
- ✅ Hashtag linking
- ✅ Combined content
- ✅ Edge cases
- ✅ Security (XSS prevention)
- ✅ Helper functions

## Migration from Old Version

Old version (basic):
```javascript
function linkify(text) {
  return text.replace(/(https?:\/\/\S+)/g, '<a href="$1">$1</a>');
}
```

New version (enhanced):
```javascript
import linkify from './utils/data/linkify';

// Same functionality, more features
const html = linkify(text);
```

## API Reference

### Main Function

```typescript
function linkify(
  text: string,
  options?: {
    urls?: boolean;
    mentions?: boolean;
    hashtags?: boolean;
    mentionPath?: string;
    hashtagPath?: string;
    newTab?: boolean;
  }
): string;
```

### Helper Functions

```typescript
function extractMentions(text: string): string[];
function extractHashtags(text: string): string[];
function extractUrls(text: string): string[];
function stripHtml(html: string): string;
function hasLinkableContent(text: string): boolean;
```

## Best Practices

1. **Always validate input**: The utility handles edge cases, but validate data before display
2. **Use React component**: For React apps, use `<LinkifiedText>` for better integration
3. **Handle click events**: Implement custom click handlers for better UX
4. **Sanitize user input**: Combine with input validation for security
5. **Test your implementation**: Write tests for your specific use cases

## Troubleshooting

### Links not clickable
- Ensure you're using `dangerouslySetInnerHTML` or the React component
- Check CSS styles aren't overriding link styles

### Wrong mention/hashtag paths
- Specify custom paths using `mentionPath` and `hashtagPath` options

### XSS concerns
- The utility automatically escapes HTML - no additional sanitization needed
- Always use the utility instead of direct innerHTML

## License

MIT - Use freely in your projects!
