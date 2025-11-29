import Fuse from 'fuse.js';
import { useMemo } from 'react';

/**
 * Custom hook for fuzzy search with fuse.js
 * Provides intelligent search with typo tolerance and relevance scoring
 * 
 * @param {Array} items - Array of items to search through
 * @param {string} searchQuery - Search query string
 * @param {Object} options - Fuse.js options
 * @returns {Array} Filtered and sorted results
 */
export const useFuzzySearch = (items, searchQuery, options = {}) => {
    const fuse = useMemo(() => {
        const defaultOptions = {
            keys: ['name', 'group'], // Fields to search in
            threshold: 0.4, // 0.0 = exact match, 1.0 = match anything
            distance: 100, // Max distance for fuzzy matching
            minMatchCharLength: 2, // Min chars before searching
            includeScore: true, // Include relevance score
            ignoreLocation: true, // Search anywhere in string
            ...options,
        };

        return new Fuse(items, defaultOptions);
    }, [items, options.keys]);

    return useMemo(() => {
        if (!searchQuery || searchQuery.trim().length < 2) {
            return items;
        }

        const results = fuse.search(searchQuery.trim());
        return results.map(result => result.item);
    }, [fuse, searchQuery, items]);
};
