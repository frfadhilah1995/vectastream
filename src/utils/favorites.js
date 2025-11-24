// Favorites Manager - LocalStorage utility
const FAVORITES_KEY = 'vectastream_favorites';

export const getFavorites = () => {
    try {
        const stored = localStorage.getItem(FAVORITES_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

export const addFavorite = (channel) => {
    const favorites = getFavorites();
    const exists = favorites.some(fav => fav.url === channel.url);

    if (!exists) {
        const newFavorites = [...favorites, {
            url: channel.url,
            name: channel.name,
            group: channel.group,
            logo: channel.logo,
            addedAt: Date.now()
        }];
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
        return true;
    }
    return false;
};

export const removeFavorite = (channelUrl) => {
    const favorites = getFavorites();
    const filtered = favorites.filter(fav => fav.url !== channelUrl);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered));
};

export const isFavorite = (channelUrl) => {
    const favorites = getFavorites();
    return favorites.some(fav => fav.url === channelUrl);
};
