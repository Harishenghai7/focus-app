import { useState, useCallback } from 'react';

export const useSections = (initialSections = []) => {
    const [expandedSections, setExpandedSections] = useState(
        initialSections.reduce((acc, section) => {
            acc[section] = true; // All sections expanded by default
            return acc;
        }, {})
    );

    const toggleSection = useCallback((sectionId) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId]
        }));
    }, []);

    const expandSection = useCallback((sectionId) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionId]: true
        }));
    }, []);

    const collapseSection = useCallback((sectionId) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionId]: false
        }));
    }, []);

    const expandAll = useCallback(() => {
        setExpandedSections(prev => {
            const newState = {};
            Object.keys(prev).forEach(key => {
                newState[key] = true;
            });
            return newState;
        });
    }, []);

    const collapseAll = useCallback(() => {
        setExpandedSections(prev => {
            const newState = {};
            Object.keys(prev).forEach(key => {
                newState[key] = false;
            });
            return newState;
        });
    }, []);

    const isSectionExpanded = useCallback((sectionId) => {
        return expandedSections[sectionId] ?? true;
    }, [expandedSections]);

    return {
        expandedSections,
        toggleSection,
        expandSection,
        collapseSection,
        expandAll,
        collapseAll,
        isSectionExpanded
    };
};
