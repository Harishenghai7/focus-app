import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export const useProfileTabs = (isOwnProfile = false) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const tabFromUrl = searchParams.get('tab') || 'posts';

    // Validate tab - 'saved' and 'flash' only available on own profile
    const getValidTab = useCallback((tab) => {
        const validTabs = isOwnProfile
            ? ['posts', 'boltz', 'flash', 'saved', 'tagged']
            : ['posts', 'boltz', 'flash', 'tagged'];

        return validTabs.includes(tab) ? tab : 'posts';
    }, [isOwnProfile]);

    const [activeTab, setActiveTab] = useState(getValidTab(tabFromUrl));

    // Sync with URL
    useEffect(() => {
        const validTab = getValidTab(tabFromUrl);
        if (validTab !== activeTab) {
            setActiveTab(validTab);
        }
    }, [tabFromUrl, activeTab, getValidTab]);

    const changeTab = useCallback((newTab) => {
        const validTab = getValidTab(newTab);
        setActiveTab(validTab);
        setSearchParams({ tab: validTab });
    }, [getValidTab, setSearchParams]);

    return {
        activeTab,
        changeTab,
        availableTabs: isOwnProfile
            ? ['posts', 'boltz', 'flash', 'saved', 'tagged']
            : ['posts', 'boltz', 'flash', 'tagged']
    };
};
