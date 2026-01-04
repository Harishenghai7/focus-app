import React from 'react';
import linkify from './linkify';
import './LinkifiedText.css';

/**
 * LinkifiedText Component
 * 
 * Renders text with clickable links for URLs, mentions, and hashtags
 * 
 * @example
 * <LinkifiedText>
 *   Check out https://example.com and @john #trending
 * </LinkifiedText>
 */
const LinkifiedText = ({ 
  children, 
  className = '',
  urls = true,
  mentions = true,
  hashtags = true,
  mentionPath = '/profile',
  hashtagPath = '/explore',
  newTab = true,
  onClick = null
}) => {
  // Handle non-string children
  if (!children || typeof children !== 'string') {
    return <span className={className}>{children}</span>;
  }

  // Linkify the text
  const linkifiedHtml = linkify(children, {
    urls,
    mentions,
    hashtags,
    mentionPath,
    hashtagPath,
    newTab
  });

  // Handle click events on links
  const handleClick = (e) => {
    if (onClick) {
      // Check if clicked element is a link
      const link = e.target.closest('a');
      if (link) {
        const href = link.getAttribute('href');
        const isExternal = href.startsWith('http');
        
        // Get link type and value
        let linkType = 'url';
        let linkValue = href;
        
        if (link.classList.contains('mention')) {
          linkType = 'mention';
          linkValue = link.getAttribute('data-username');
        } else if (link.classList.contains('hashtag')) {
          linkType = 'hashtag';
          linkValue = link.getAttribute('data-tag');
        }
        
        // Call custom onClick handler
        const shouldPreventDefault = onClick({
          type: linkType,
          value: linkValue,
          href,
          isExternal,
          event: e
        });
        
        // Prevent default if handler returns false
        if (shouldPreventDefault === false) {
          e.preventDefault();
        }
      }
    }
  };

  return (
    <span 
      className={`linkified-text ${className}`}
      dangerouslySetInnerHTML={{ __html: linkifiedHtml }}
      onClick={handleClick}
    />
  );
};

export default LinkifiedText;
