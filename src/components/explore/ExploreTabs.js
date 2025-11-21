import React, { useRef, useEffect } from 'react';
import './ExploreTabs.css';

const ExploreTabs = ({ categories, activeCategory, onCategoryChange }) => {
  const tabsRef = useRef(null);
  const activeTabRef = useRef(null);

  // Scroll active tab into view
  useEffect(() => {
    if (activeTabRef.current && tabsRef.current) {
      const tabsContainer = tabsRef.current;
      const activeTab = activeTabRef.current;
      
      const containerWidth = tabsContainer.offsetWidth;
      const tabLeft = activeTab.offsetLeft;
      const tabWidth = activeTab.offsetWidth;
      
      // Calculate scroll position to center the active tab
      const scrollLeft = tabLeft - (containerWidth / 2) + (tabWidth / 2);
      
      tabsContainer.scrollTo({
        left: scrollLeft,
        behavior: 'smooth'
      });
    }
  }, [activeCategory]);

  const handleKeyDown = (e, category) => {
    const currentIndex = categories.indexOf(category);
    let nextIndex = currentIndex;

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      nextIndex = currentIndex > 0 ? currentIndex - 1 : categories.length - 1;
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextIndex = currentIndex < categories.length - 1 ? currentIndex + 1 : 0;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = categories.length - 1;
    } else {
      return;
    }

    onCategoryChange(categories[nextIndex]);
  };

  return (
    <div className="explore-tabs-wrapper">
      <div 
        className="explore-tabs" 
        ref={tabsRef}
        role="tablist"
        aria-label="Explore categories"
      >
        {categories.map((category) => {
          const isActive = activeCategory === category;
          
          return (
            <button
              key={category}
              ref={isActive ? activeTabRef : null}
              className={`explore-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => onCategoryChange(category)}
              onKeyDown={(e) => handleKeyDown(e, category)}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${category.toLowerCase()}`}
              id={`tab-${category.toLowerCase()}`}
              tabIndex={isActive ? 0 : -1}
            >
              <span className="tab-label">{category}</span>
              {isActive && <span className="tab-indicator" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ExploreTabs;
