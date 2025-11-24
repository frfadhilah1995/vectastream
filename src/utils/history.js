// History Manager - LocalStorage utility
const HISTORY_KEY = 'vectastream_history';
const MAX_HISTORY = 20;

export const getHistory = () => {
    try {
        const stored = localStorage.getItem(HISTORY_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

export const addToHistory = (channel) => {
    let history = getHistory();

    // Remove existing entry if present
    history = history.filter(item => item.url !== channel.url);

    // Add to beginning
    history.unshift({
        url: channel.url,
        name: channel.name,
        group: channel.group,
        logo: channel.logo,
        playedAt: Date.now()
    });

    // Keep only last MAX_HISTORY items
    if (history.length > MAX_HISTORY) {
        history = history.slice(0, MAX_HISTORY);
    }

    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
};

export const clearHistory = () => {
    localStorage.removeItem(HISTORY_KEY);
};
