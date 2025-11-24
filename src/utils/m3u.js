export const parseM3U = (content) => {
    const channels = [];
    const lines = content.split('\n');

    let currentChannel = {};
    let validChannels = 0;
    let skippedChannels = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Skip empty lines and comments (except #EXTINF)
        if (!line || (line.startsWith('#') && !line.startsWith('#EXTINF'))) {
            continue;
        }

        if (line.startsWith('#EXTINF')) {
            // Parse #EXTINF line with enhanced metadata extraction
            // Format: #EXTINF:-1 tvg-id="..." tvg-logo="..." tvg-country="..." group-title="...",Channel Name

            // Extract channel name (after last comma)
            const nameMatch = line.match(/,(.+)$/);
            const name = nameMatch ? nameMatch[1].trim() : 'Unknown Channel';

            // Extract tvg-id
            const idMatch = line.match(/tvg-id="([^"]*)"/);
            const tvgId = idMatch ? idMatch[1].trim() : null;

            // Extract group-title (category)
            const groupMatch = line.match(/group-title="([^"]*)"/);
            const group = groupMatch ? groupMatch[1].trim() : 'Uncategorized';

            // Extract tvg-logo
            const logoMatch = line.match(/tvg-logo="([^"]*)"/);
            const logo = logoMatch ? logoMatch[1].trim() : '';

            // Extract tvg-country
            const countryMatch = line.match(/tvg-country="([^"]*)"/);
            const country = countryMatch ? countryMatch[1].trim() : null;

            // Extract tvg-language
            const languageMatch = line.match(/tvg-language="([^"]*)"/);
            const language = languageMatch ? languageMatch[1].trim() : null;

            // Extract resolution if available (e.g., "HD", "FHD", "4K")
            const resolutionMatch = name.match(/\[(HD|FHD|4K|SD|UHD)\]/i);
            const resolution = resolutionMatch ? resolutionMatch[1].toUpperCase() : null;

            currentChannel = {
                name,
                group,
                logo,
                tvgId,
                country,
                language,
                resolution
            };

        } else if (line.startsWith('http://') || line.startsWith('https://')) {
            // This is a stream URL
            if (currentChannel.name) {
                currentChannel.url = line;

                // Validate channel has minimum required data
                if (currentChannel.url && currentChannel.name && currentChannel.name !== 'Unknown Channel') {
                    channels.push({ ...currentChannel });
                    validChannels++;
                } else {
                    skippedChannels++;
                }

                currentChannel = {}; // Reset for next channel
            }
        }
    }

    console.log(`[M3U Parser] ✅ Parsed ${validChannels} valid channels`);
    if (skippedChannels > 0) {
        console.log(`[M3U Parser] ⚠️ Skipped ${skippedChannels} invalid/incomplete entries`);
    }

    return channels;
};
