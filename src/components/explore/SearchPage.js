import React from 'react';
import { useSearchParams } from 'react-router-dom';
import styles from './SearchPage.module.css';
import MainLayout from '../../components/layout/MainLayout';
import SearchBar from '../../components/explore/SearchBar';
import ExploreGrid, { ExploreTile } from '../../components/explore/ExploreGrid';
import { useSearch } from '../../hooks/useSearch';

const SearchPage = () => {
    const [searchParams] = useSearchParams();
    const initialQuery = searchParams.get('q') || '';

    // In a real app, we might want a dedicated useSearchResults hook that takes initialQuery
    // For now, we'll reuse useSearch but we need to initialize it with the query
    // Since useSearch manages its own state, this is a bit tricky without refactoring.
    // Let's assume for this page we just want to show results for the query param.

    return (
        <MainLayout>
            <div className={styles.container}>
                <div className={styles.header}>
                    <SearchBar placeholder="Search..." />
                </div>

                <div className={styles.content}>
                    <h2>Results for "{initialQuery}"</h2>
                    {/* 
                        Here we would render tabs for Top, Accounts, Tags, Places 
                        and the corresponding grids/lists.
                        For MVP, let's just show a placeholder grid.
                    */}
                    <div className={styles.placeholder}>
                        <p>Search results grid would appear here.</p>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default SearchPage;
