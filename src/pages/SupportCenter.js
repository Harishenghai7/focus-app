// SupportCenter - Help center with FAQ
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FAQ_DATA, searchFAQs } from '../utils/supportCategories';
import styles from './SupportCenter.module.css';

const SupportCenter = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedFaq, setExpandedFaq] = useState(null);

    const searchResults = searchQuery.length >= 2 ? searchFAQs(searchQuery) : [];
    const showSearch = searchQuery.length >= 2;

    const toggleFaq = (categoryIndex, questionIndex) => {
        const id = `${categoryIndex}-${questionIndex}`;
        setExpandedFaq(expandedFaq === id ? null : id);
    };

    return (
        <div className={styles.supportPage}>
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Help & Support</h1>
                <p className={styles.pageSubtitle}>Find answers or contact our support team</p>
            </div>

            {/* Search */}
            <div className={styles.searchBox}>
                <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                    <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Search for help..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Search Results */}
            {showSearch && (
                <div className={styles.searchResults}>
                    <h3>Search Results ({searchResults.length})</h3>
                    {searchResults.length === 0 ? (
                        <p className={styles.noResults}>No results found for "{searchQuery}"</p>
                    ) : (
                        searchResults.map((faq, idx) => (
                            <div key={idx} className={styles.faqCard}>
                                <h4>{faq.q}</h4>
                                <p>{faq.a}</p>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* FAQ Categories */}
            {!showSearch && (
                <div className={styles.faqContainer}>
                    {FAQ_DATA.map((categoryData, catIdx) => (
                        <div key={catIdx} className={styles.faqCategory}>
                            <h3 className={styles.categoryTitle}>
                                {categoryData.category.toUpperCase().replace('_', ' ')}
                            </h3>
                            {categoryData.questions.map((faq, qIdx) => {
                                const faqId = `${catIdx}-${qIdx}`;
                                const isExpanded = expandedFaq === faqId;

                                return (
                                    <div key={qIdx} className={styles.faqItem}>
                                        <button
                                            className={styles.faqQuestion}
                                            onClick={() => toggleFaq(catIdx, qIdx)}
                                        >
                                            <span>{faq.q}</span>
                                            <span className={`${styles.expandIcon} ${isExpanded ? styles.expanded : ''}`}>
                                                ▼
                                            </span>
                                        </button>
                                        {isExpanded && (
                                            <div className={styles.faqAnswer}>{faq.a}</div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            )}

            {/* Contact Support Button */}
            <div className={styles.contactSection}>
                <p>Can't find what you're looking for?</p>
                <button
                    className={styles.contactButton}
                    onClick={() => navigate('/support/new')}
                >
                    Contact Support
                </button>
            </div>
        </div>
    );
};

export default SupportCenter;
