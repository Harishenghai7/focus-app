# Input Sanitization Guide

## Overview

The `sanitizeInput` module provides comprehensive XSS (Cross-Site Scripting) protection for the Focus App. It uses DOMPurify for robust HTML sanitization with multiple sanitization levels and specialized functions for different input types.

## 🔒 Security Features

- **XSS Prevention**: Removes dangerous HTML tags and attributes
- **Script Blocking**: Strips `<script>`, `<iframe>`, `<object>`, `<embed>` tags
- **Event Handler Removal**: Removes `onclick`, `onload`, and other event handlers
- **URL Validation**: Blocks `javascript:` and `data:` protocols
- **Safe HTML Allowlisting**: Configurable allowed tags and attributes
- **Link Security**: Automatically adds `rel="noopener noreferrer"` to external links

## 📦 Installation

DOMPurify is installed as a dependency:

```bash
npm install dompurify
```

## 🎯 Sanitization Levels

### 1. Strict (No HTML)
Removes all HTML tags, keeping only text content.

```javascript
import sanitizeInput from '@/utils/data/sanitizeInput';

const input = '<p>Hello <b>World</b></p>';
const result = sanitizeInput(input, { level: 'strict' });
// Output: "Hello World"
```

### 2. Basic (Simple Formatting)
Allows basic text formatting tags: `<b>`, `<i>`, `<em>`, `<strong>`, `<u>`, `<br>`, `<p>`

```javascript
const input = '<b>Bold</b> and <i>italic</i>';
const result = sanitizeInput(input, { level: 'basic' });
// Output: "<b>Bold</b> and <i>italic</i>"
```

### 3. Standard (Default)
Allows formatting tags plus links and lists.

```javascript
const input = '<a href="https://example.com">Link</a>';
const result = sanitizeInput(input, { level: 'standard' });
// Output: '<a href="https://example.com">Link</a>'
```

### 4. Rich (Rich Text)
Allows comprehensive formatting including headings, images, and tables.

```javascript
const input = '<h1>Title</h1><img src="image.jpg" alt="Image">';
const result = sanitizeInput(input, { level: 'rich' });
// Output: '<h1>Title</h1><img src="image.jpg" alt="Image">'
```

## 🛠️ Core Functions

### sanitizeInput(input, options)
Main sanitization function with configurable options.

```javascript
import sanitizeInput from '@/utils/data/sanitizeInput';

// Default (standard level)
const cleaned = sanitizeInput('<b>Hello</b><script>alert(1)</script>');

// With options
const cleaned = sanitizeInput(input, {
  level: 'basic',        // Sanitization level
  allowLinks: false,     // Disable links
  customConfig: {...}    // Custom DOMPurify config
});
```

### sanitizePlainText(input)
Escape HTML entities for plain text that should never contain HTML.

```javascript
import { sanitizePlainText } from '@/utils/data/sanitizeInput';

const escaped = sanitizePlainText('<script>alert(1)</script>');
// Output: "&lt;script&gt;alert(1)&lt;/script&gt;"
```

### sanitizeURL(url, options)
Validate and sanitize URLs.

```javascript
import { sanitizeURL, isValidURL } from '@/utils/data/sanitizeInput';

// Validate URL
const safe = sanitizeURL('https://example.com'); // ✓ Valid
const blocked = sanitizeURL('javascript:alert(1)'); // ✗ Returns null

// Check if URL is valid
if (isValidURL(userUrl)) {
  // Safe to use
}
```

### stripHTML(input)
Remove all HTML tags from a string.

```javascript
import { stripHTML } from '@/utils/data/sanitizeInput';

const text = stripHTML('<p>Hello <b>World</b></p>');
// Output: "Hello World"
```

## 🎨 Specialized Functions

### sanitizeRichText(html)
For posts, comments, and rich text content.

```javascript
import { sanitizeRichText } from '@/utils/data/sanitizeInput';

const cleanHtml = sanitizeRichText(postContent);
```

### sanitizeBio(text)
For user bios and descriptions (allows basic formatting + links).

```javascript
import { sanitizeBio } from '@/utils/data/sanitizeInput';

const cleanBio = sanitizeBio(userBio);
```

### sanitizeUsername(name)
For usernames and display names (no HTML allowed).

```javascript
import { sanitizeUsername } from '@/utils/data/sanitizeInput';

const cleanName = sanitizeUsername('<b>John</b>'); // Output: "John"
```

### sanitizeSearchQuery(query)
For search queries.

```javascript
import { sanitizeSearchQuery } from '@/utils/data/sanitizeInput';

const cleanQuery = sanitizeSearchQuery(userQuery);
```

## 🔍 Detection Functions

### containsDangerousContent(input)
Check if input contains potentially dangerous patterns.

```javascript
import { containsDangerousContent } from '@/utils/data/sanitizeInput';

if (containsDangerousContent(userInput)) {
  console.warn('Dangerous content detected!');
}
```

## 📊 Batch Operations

### sanitizeObject(obj, fieldConfig)
Sanitize multiple fields in an object.

```javascript
import { sanitizeObject } from '@/utils/data/sanitizeInput';

const user = {
  name: '<b>John</b>',
  bio: '<script>bad</script>Developer',
  website: 'https://example.com'
};

const clean = sanitizeObject(user, {
  name: { level: 'strict' },
  bio: { level: 'basic' },
  website: { level: 'standard' }
});
```

### sanitizeArray(arr, options)
Sanitize an array of strings.

```javascript
import { sanitizeArray } from '@/utils/data/sanitizeInput';

const tags = ['<b>tag1</b>', '<script>bad</script>tag2'];
const cleanTags = sanitizeArray(tags, { level: 'strict' });
// Output: ['tag1', 'tag2']
```

### batchSanitize(inputs)
Sanitize multiple inputs with different types.

```javascript
import { batchSanitize } from '@/utils/data/sanitizeInput';

const clean = batchSanitize({
  username: { value: userInput, type: 'username' },
  bio: { value: bioInput, type: 'bio' },
  content: { value: postContent, type: 'richText' },
  website: { value: urlInput, type: 'url' },
  query: { value: searchInput, type: 'search' }
});
```

## 🎯 Use Cases

### 1. User Registration

```javascript
import { sanitizeUsername, sanitizeBio } from '@/utils/data/sanitizeInput';

const cleanData = {
  username: sanitizeUsername(formData.username),
  displayName: sanitizeUsername(formData.displayName),
  bio: sanitizeBio(formData.bio),
};
```

### 2. Post Creation

```javascript
import { sanitizeRichText } from '@/utils/data/sanitizeInput';

const createPost = async (content, title) => {
  const cleanData = {
    title: sanitizeInput(title, { level: 'basic' }),
    content: sanitizeRichText(content),
  };
  
  await supabase.from('posts').insert(cleanData);
};
```

### 3. Comment System

```javascript
import { sanitizeInput } from '@/utils/data/sanitizeInput';

const addComment = async (text) => {
  const cleanText = sanitizeInput(text, { level: 'standard' });
  await supabase.from('comments').insert({ text: cleanText });
};
```

### 4. Search Functionality

```javascript
import { sanitizeSearchQuery } from '@/utils/data/sanitizeInput';

const handleSearch = (query) => {
  const cleanQuery = sanitizeSearchQuery(query);
  performSearch(cleanQuery);
};
```

### 5. Profile Updates

```javascript
import { batchSanitize } from '@/utils/data/sanitizeInput';

const updateProfile = async (formData) => {
  const cleanData = batchSanitize({
    displayName: { value: formData.displayName, type: 'username' },
    bio: { value: formData.bio, type: 'bio' },
    website: { value: formData.website, type: 'url' },
  });
  
  await supabase.from('users').update(cleanData);
};
```

## ⚠️ Security Best Practices

### 1. Always Sanitize User Input
```javascript
// ✓ GOOD
const cleanInput = sanitizeInput(userInput);
saveToDatabase(cleanInput);

// ✗ BAD
saveToDatabase(userInput); // Never save raw user input
```

### 2. Choose Appropriate Sanitization Level
```javascript
// Username - strict (no HTML)
const username = sanitizeUsername(input);

// Bio - basic (simple formatting)
const bio = sanitizeBio(input);

// Post content - rich (full formatting)
const content = sanitizeRichText(input);
```

### 3. Validate URLs
```javascript
// ✓ GOOD
if (isValidURL(userUrl)) {
  const safeUrl = sanitizeURL(userUrl);
  // Use safeUrl
}

// ✗ BAD
window.location.href = userUrl; // Never use raw URLs
```

### 4. Sanitize on Input AND Output
```javascript
// Input sanitization (before saving)
const cleanData = sanitizeInput(userInput);
await saveToDatabase(cleanData);

// Output sanitization (before rendering)
const safeHtml = sanitizeInput(dataFromDatabase);
setInnerHTML(safeHtml);
```

### 5. Check for Dangerous Content
```javascript
if (containsDangerousContent(input)) {
  console.warn('Blocked dangerous content');
  showErrorToUser('Invalid input detected');
  return;
}
```

## 🚫 Blocked Content

The sanitizer automatically blocks:

- `<script>` tags
- `<iframe>` tags
- `<object>` and `<embed>` tags
- `javascript:` and `data:` URL protocols
- Event handlers (`onclick`, `onload`, etc.)
- Malicious attributes
- XSS attack vectors

## 🧪 Testing

Run the sanitization tests:

```bash
npm test -- sanitizeInput.test.js
```

## 📝 Type Definitions

```typescript
// Sanitization levels
type SanitizationLevel = 'strict' | 'basic' | 'standard' | 'rich';

// Sanitization options
interface SanitizeOptions {
  level?: SanitizationLevel;
  allowLinks?: boolean;
  customConfig?: DOMPurifyConfig;
}

// Batch sanitization types
type SanitizationType = 'username' | 'bio' | 'richText' | 'plainText' | 'url' | 'search' | SanitizationLevel;

interface BatchInput {
  value: string;
  type?: SanitizationType;
}
```

## 🔗 Integration Examples

### With React Components

```javascript
import { sanitizeInput } from '@/utils/data/sanitizeInput';

function Comment({ content }) {
  const safeContent = sanitizeInput(content, { level: 'standard' });
  
  return (
    <div dangerouslySetInnerHTML={{ __html: safeContent }} />
  );
}
```

### With Forms

```javascript
import { sanitizeInput } from '@/utils/data/sanitizeInput';

const handleSubmit = (e) => {
  e.preventDefault();
  
  const cleanData = {
    title: sanitizeInput(formData.title, { level: 'basic' }),
    content: sanitizeInput(formData.content, { level: 'standard' }),
  };
  
  onSubmit(cleanData);
};
```

### With API Requests

```javascript
import { sanitizeObject } from '@/utils/data/sanitizeInput';

const createUser = async (userData) => {
  const cleanData = sanitizeObject(userData, {
    username: { level: 'strict' },
    bio: { level: 'basic' },
    email: { level: 'strict' },
  });
  
  return await api.post('/users', cleanData);
};
```

## 🎓 Additional Resources

- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)
- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [Content Security Policy (CSP)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

## 📞 Support

For security concerns or questions:
- Review the test file: `src/utils/data/__tests__/sanitizeInput.test.js`
- Check blocked XSS vectors in the tests
- Report security issues immediately

---

**Remember**: Always sanitize user input. It's better to be overly cautious than to leave your application vulnerable to XSS attacks! 🔒
