/**
 * A simple dictionary mapping common budget category names to native Emojis.
 */

const EMOJI_MAP: Record<string, string[]> = {
    // Housing / Utilities
    '🏠': ['mortgage', 'rent', 'housing', 'home'],
    '⚡': ['electric', 'electricity', 'power', 'utilit'],
    '💧': ['water', 'sewer', 'trash'],
    '🔥': ['gas', 'heating'],
    '🌐': ['internet', 'wifi', 'cable', 'tv'],
    '📱': ['phone', 'cell', 'mobile'],

    // Food / Dining
    '🛒': ['grocer', 'supermarket', 'food'],
    '🍔': ['dining', 'restaurant', 'fast food', 'takeout', 'eating out'],
    '☕': ['coffee', 'cafe', 'starbucks', 'dutch'],
    '🥂': ['date', 'drinks', 'bar', 'alcohol'],

    // Transportation
    '🚘': ['car', 'auto', 'vehicle'],
    '⛽': ['gas', 'fuel', 'petrol'],
    '🛠️': ['maintenance', 'repair', 'oil change'],
    '🚌': ['transit', 'bus', 'train', 'subway', 'uber', 'lyft', 'taxi'],
    '🅿️': ['parking', 'tolls'],

    // Personal / Lifestyle
    '👕': ['clothing', 'clothes', 'apparel', 'shoes'],
    '💇‍♀️': ['hair', 'salon', 'barber', 'beauty', 'spa', 'nails'],
    '🏋️‍♂️': ['gym', 'fitness', 'workout', 'sports'],
    '💊': ['health', 'medical', 'doctor', 'dentist', 'pharmacy', 'rx'],
    '🐾': ['pet', 'dog', 'cat', 'vet'],

    // Entertainment / Media
    '🎬': ['movie', 'theater', 'cinema', 'entertainment'],
    '🎵': ['music', 'spotify', 'apple tv', 'netflix', 'hulu', 'subscription'],
    '🎮': ['game', 'gaming', 'xbox', 'playstation', 'nintendo'],
    '📚': ['book', 'education', 'school', 'tuition'],

    // Financial
    '🏦': ['bank', 'fee', 'interest'],
    '💳': ['credit', 'debt', 'loan'],
    '💸': ['transfer', 'payment'],
    '📈': ['investment', 'save', 'saving', 'ira', '401k', 'roth'],
    '☂️': ['insurance', 'life', 'auto insurance', 'home insurance'],
    '💰': ['cash', 'atm', 'misc', 'miscellaneous', 'other'],

    // Kids / Family
    '👶': ['baby', 'diaper', 'daycare'],
    '🧸': ['toy', 'kid'],
    '🎁': ['gift', 'present', 'birthday', 'holiday', 'christmas'],

    // Travel
    '✈️': ['travel', 'flight', 'hotel', 'vacation', 'trip'],
};

/**
 * Parses a category name and returns the best matching emoji.
 * Falls back to 💰 if no match is found.
 */
export function getEmojiForCategory(categoryName: string): string {
    if (!categoryName) return '💰';

    const cleanName = categoryName.toLowerCase().trim();

    // 1. Direct/exact match scan
    for (const [emoji, keywords] of Object.entries(EMOJI_MAP)) {
        if (keywords.includes(cleanName)) {
            return emoji;
        }
    }

    // 2. Partial/substring scan
    for (const [emoji, keywords] of Object.entries(EMOJI_MAP)) {
        if (keywords.some(keyword => cleanName.includes(keyword))) {
            return emoji;
        }
    }

    // Default fallback
    return '💰';
}
