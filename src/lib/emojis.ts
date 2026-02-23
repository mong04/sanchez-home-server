export const CATEGORIES = [
    {
        id: 'finance', title: 'Finance', icon: '💰',
        emojis: ['💰', '💵', '💳', '🏦', '💸', '📈', '💹', '💎', '👛', '🏧', '⚖️', '🧾']
    },
    {
        id: 'home', title: 'Home', icon: '🏠',
        emojis: ['🏠', '🏡', '🏢', '💡', '🔌', '🚰', '🗑️', '🧹', '🧼', '🧻', '🪑', '🛌', '🚿', '🛁', '🚪', '🛎️', '🔧', '🧰', '🧺']
    },
    {
        id: 'food', title: 'Food', icon: '🛒',
        emojis: ['🛒', '🍎', '🍔', '🍕', '🌮', '🥩', '☕️', '🍺', '🍷', '🍽️', '🥡', '🍳', '🥦', '🌽', '🍦']
    },
    {
        id: 'transport', title: 'Transport', icon: '🚗',
        emojis: ['🚗', '🚘', '🚕', '🚌', '🚂', '✈️', '🚀', '⛽️', '🔧', '🚲', '🛴', '🚛', '🚢', '🗺️', '🚦']
    },
    {
        id: 'shopping', title: 'Shopping', icon: '🛍️',
        emojis: ['🛍️', '👕', '👖', '👟', '⌚️', '📱', '💻', '🎮', '📸', '🎧', '🎁', '🎈', '💍', '💄', '🕶️']
    },
    {
        id: 'health', title: 'Health', icon: '🏥',
        emojis: ['🏥', '💊', '🧬', '⚕️', '🍼', '👶', '🧸', '🐶', '🐱', '🐾', '🦷', '👓', '🌡️', '🩹']
    },
    {
        id: 'sports', title: 'Sports', icon: '⚽️',
        emojis: ['⚽️', '🎾', '🎯', '🏃‍♂️', '💪', '🏋️‍♂️', '🏕️', '🎟️', '🎬', '📚', '🎨', '🧩', '🧵', '🎙️']
    },
    {
        id: 'travel', title: 'Travel', icon: '🏖️',
        emojis: ['🏖️', '🌴', '🎉', '🎊', '🎁', '💍', '🏔️', '🌋', '⛺️', '🚢', '🛶', '🎒', '📸']
    },
];

export const EMOJI_INFO: Record<string, { name: string, keywords: string[] }> = {
    // Finance
    '💰': { name: 'Money Bag', keywords: ['money', 'cash', 'income', 'budget'] },
    '💵': { name: 'Dollar Bill', keywords: ['money', 'cash', 'payment', 'bill'] },
    '💳': { name: 'Credit Card', keywords: ['card', 'payment', 'debt', 'bank'] },
    '🏦': { name: 'Bank', keywords: ['finance', 'institution', 'savings'] },
    '💸': { name: 'Flying Money', keywords: ['spending', 'loss', 'cash'] },
    '📈': { name: 'Chart Up', keywords: ['growth', 'investing', 'market'] },
    '💹': { name: 'Chart Increase', keywords: ['finance', 'stats'] },
    '💎': { name: 'Gem', keywords: ['luxury', 'value', 'savings'] },
    '👛': { name: 'Purse', keywords: ['wallet', 'spending'] },
    '🏧': { name: 'ATM', keywords: ['cash', 'withdraw'] },
    '⚖️': { name: 'Balance', keywords: ['legal', 'finance', 'split'] },
    '🧾': { name: 'Receipt', keywords: ['bill', 'expense', 'tax'] },
    // Home
    '🏠': { name: 'House', keywords: ['home', 'mortgage', 'rent'] },
    '🏡': { name: 'Garden Home', keywords: ['home', 'yard', 'rent'] },
    '🏢': { name: 'Office', keywords: ['work', 'rent', 'commercial'] },
    '💡': { name: 'Light', keywords: ['electric', 'utilities', 'bill'] },
    '🔌': { name: 'Plug', keywords: ['electric', 'power', 'utilities'] },
    '🚰': { name: 'Water', keywords: ['tap', 'utilities', 'bill'] },
    '🗑️': { name: 'Trash', keywords: ['utilities', 'waste', 'garbage'] },
    '🧹': { name: 'Broom', keywords: ['clean', 'cleaning', 'household'] },
    '🧼': { name: 'Soap', keywords: ['clean', 'cleaning', 'bathroom'] },
    '🧻': { name: 'Toilet Paper', keywords: ['clean', 'bathroom', 'household'] },
    '🪑': { name: 'Chair', keywords: ['furniture', 'home'] },
    '🛌': { name: 'Bed', keywords: ['home', 'furniture'] },
    '🚿': { name: 'Shower', keywords: ['bathroom', 'utilities'] },
    '🛁': { name: 'Bath', keywords: ['bathroom', 'utilities'] },
    '🚪': { name: 'Door', keywords: ['security', 'hardware'] },
    '🛎️': { name: 'Bell', keywords: ['service', 'guest'] },
    '🔧': { name: 'Wrench', keywords: ['tools', 'repair', 'maintenance'] },
    '🧰': { name: 'Toolbox', keywords: ['repair', 'maintenance', 'hardware'] },
    '🧺': { name: 'Laundry', keywords: ['cleaning', 'household'] },
    // Food
    '🛒': { name: 'Groceries', keywords: ['food', 'shopping', 'market'] },
    '🍎': { name: 'Fruit', keywords: ['food', 'healthy', 'groceries'] },
    '🍔': { name: 'Burgers', keywords: ['food', 'dining', 'junk'] },
    '🍕': { name: 'Pizza', keywords: ['food', 'dining', 'takeout'] },
    '🌮': { name: 'Tacos', keywords: ['food', 'dining', 'takeout'] },
    '🥩': { name: 'Meat', keywords: ['food', 'groceries', 'butcher'] },
    '☕️': { name: 'Coffee', keywords: ['drink', 'cafe', 'dining'] },
    '🍺': { name: 'Beer', keywords: ['drink', 'alcohol', 'bar'] },
    '🍷': { name: 'Wine', keywords: ['drink', 'alcohol', 'bar'] },
    '🍽️': { name: 'Dining', keywords: ['food', 'restaurant', 'meal'] },
    '🥡': { name: 'Takeout', keywords: ['food', 'delivery'] },
    '🥦': { name: 'Vegetables', keywords: ['food', 'healthy', 'groceries'] },
    '🌽': { name: 'Corn', keywords: ['food', 'groceries'] },
    '🍦': { name: 'Ice Cream', keywords: ['food', 'dessert'] },
    '🍳': { name: 'Cooking', keywords: ['food', 'kitchen'] },
    // Transport
    '🚗': { name: 'Car', keywords: ['transport', 'auto', 'vehicle'] },
    '🚘': { name: 'Auto', keywords: ['transport', 'car', 'vehicle'] },
    '🚕': { name: 'Taxi', keywords: ['transport', 'uber', 'lyft'] },
    '🚌': { name: 'Bus', keywords: ['transport', 'public'] },
    '🚂': { name: 'Train', keywords: ['transport', 'public', 'commute'] },
    '✈️': { name: 'Flight', keywords: ['travel', 'vacation', 'trip'] },
    '🚀': { name: 'Rocket', keywords: ['misc', 'fast', 'future'] },
    '⛽️': { name: 'Gas', keywords: ['auto', 'fuel', 'utilities'] },
    '🚲': { name: 'Bike', keywords: ['transport', 'exercise', 'outdoor'] },
    '🛴': { name: 'Scooter', keywords: ['transport', 'short-trip'] },
    '🚛': { name: 'Truck', keywords: ['transport', 'delivery'] },
    '🚢': { name: 'Ship', keywords: ['travel', 'vacation'] },
    '🗺️': { name: 'Map', keywords: ['travel', 'navigation'] },
    '🚦': { name: 'Traffic Light', keywords: ['transport', 'driving'] },
    // Shopping / Tech
    '🛍️': { name: 'Shopping', keywords: ['clothes', 'mall', 'retail'] },
    '👕': { name: 'T-Shirt', keywords: ['clothing', 'shopping'] },
    '👖': { name: 'Jeans', keywords: ['clothing', 'shopping'] },
    '👟': { name: 'Shoes', keywords: ['clothing', 'shopping', 'gym'] },
    '⌚️': { name: 'Watch', keywords: ['clothing', 'accessory'] },
    '📱': { name: 'Phone', keywords: ['tech', 'gadget', 'bill'] },
    '💻': { name: 'Laptop', keywords: ['tech', 'work', 'computer'] },
    '🎮': { name: 'Gaming', keywords: ['tech', 'fun', 'hobby'] },
    '📸': { name: 'Camera', keywords: ['tech', 'hobby', 'photo'] },
    '🎧': { name: 'Audio', keywords: ['tech', 'music', 'gaming'] },
    '🎁': { name: 'Gift', keywords: ['shopping', 'holiday', 'birthday'] },
    '🎈': { name: 'Balloon', keywords: ['party', 'celebration'] },
    '💍': { name: 'Ring', keywords: ['jewelry', 'shopping'] },
    '💄': { name: 'Lipstick', keywords: ['beauty', 'shopping'] },
    '🕶️': { name: 'Sunglasses', keywords: ['clothing', 'accessory'] },
    // Sports / Hobby
    '⚽️': { name: 'Soccer', keywords: ['sports', 'exercise', 'game'] },
    '🎾': { name: 'Tennis', keywords: ['sports', 'exercise'] },
    '🎯': { name: 'Target', keywords: ['game', 'goal'] },
    '🏃‍♂️': { name: 'Running', keywords: ['exercise', 'health'] },
    '💪': { name: 'Gym', keywords: ['exercise', 'health'] },
    '🏋️‍♂️': { name: 'Weightlifting', keywords: ['exercise', 'health'] },
    '🏕️': { name: 'Camping', keywords: ['outdoor', 'travel'] },
    '🎟️': { name: 'Tickets', keywords: ['fun', 'event'] },
    '🎬': { name: 'Movie', keywords: ['fun', 'entertainment'] },
    '📚': { name: 'Books', keywords: ['education', 'hobby'] },
    '🎨': { name: 'Art', keywords: ['hobby', 'creativity'] },
    '🧩': { name: 'Puzzle', keywords: ['hobby', 'game'] },
    '🧵': { name: 'Sewing', keywords: ['hobby', 'craft'] },
    '🎙️': { name: 'Podcast', keywords: ['tech', 'hobby'] },
    // Health / Family
    '🏥': { name: 'Health', keywords: ['medical', 'doctor', 'hospital'] },
    '💊': { name: 'Meds', keywords: ['medical', 'health', 'pharmacy'] },
    '🧬': { name: 'Science', keywords: ['medical', 'health'] },
    '⚕️': { name: 'Medical', keywords: ['health', 'doctor'] },
    '🍼': { name: 'Bottle', keywords: ['family', 'baby'] },
    '👶': { name: 'Baby', keywords: ['family', 'kids'] },
    '🧸': { name: 'Teddy', keywords: ['family', 'kids'] },
    '🐶': { name: 'Dog', keywords: ['pets', 'animals'] },
    '🐱': { name: 'Cat', keywords: ['pets', 'animals'] },
    '🐾': { name: 'Paws', keywords: ['pets', 'animals'] },
    '🦷': { name: 'Dentist', keywords: ['health', 'medical'] },
    '👓': { name: 'Glasses', keywords: ['health', 'vision'] },
    '🌡️': { name: 'Fever', keywords: ['health', 'medical'] },
    '🩹': { name: 'Bandage', keywords: ['health', 'medical'] },
    // Travel
    '🏖️': { name: 'Beach', keywords: ['travel', 'vacation', 'summer'] },
    '🌴': { name: 'Vacation', keywords: ['travel', 'tropical'] },
    '🎉': { name: 'Party', keywords: ['celebration', 'fun'] },
    '🎊': { name: 'Confetti', keywords: ['celebration', 'fun'] },
    '🏔️': { name: 'Mountains', keywords: ['travel', 'outdoor', 'hiking'] },
    '🌋': { name: 'Volcano', keywords: ['travel', 'outdoor'] },
    '⛺️': { name: 'Tent', keywords: ['travel', 'outdoor', 'camping'] },
    '🛶': { name: 'Canoe', keywords: ['travel', 'outdoor'] },
    '🎒': { name: 'Backpack', keywords: ['travel', 'school'] },
};

export function searchEmojis(term: string, limit: number = 5): string[] {
    if (!term || !term.trim()) {
        // Return some default popular emojis if no term
        return ['💰', '🛒', '🏠', '🚗', '🛍️'];
    }

    const lowerTerm = term.toLowerCase().trim();

    // Convert mapping to an array of objects to sort by relevance distance
    const exactMatches: string[] = [];
    const prefixMatches: string[] = [];
    const keywordMatches: string[] = [];

    // Pre-calculate score for fast exact hits
    Object.entries(EMOJI_INFO).forEach(([emoji, info]) => {
        if (info.name.toLowerCase() === lowerTerm) {
            exactMatches.push(emoji);
        } else if (info.name.toLowerCase().startsWith(lowerTerm)) {
            prefixMatches.push(emoji);
        } else if (info.keywords.some(k => k === lowerTerm)) {
            exactMatches.push(emoji);
        } else if (info.keywords.some(k => k.startsWith(lowerTerm))) {
            prefixMatches.push(emoji);
        } else if (info.keywords.some(k => k.includes(lowerTerm)) || info.name.toLowerCase().includes(lowerTerm)) {
            keywordMatches.push(emoji);
        }
    });

    const combined = Array.from(new Set([...exactMatches, ...prefixMatches, ...keywordMatches]));
    return combined.slice(0, limit);
}
