// Professional video filter presets
export const VIDEO_FILTERS = [
    {
        id: 'normal',
        name: 'Normal',
        description: 'No filter applied',
        values: {
            brightness: 100,
            contrast: 100,
            saturate: 100,
            sepia: 0,
            grayscale: 0,
            blur: 0,
            hueRotate: 0
        }
    },
    {
        id: 'cinematic',
        name: 'Cinematic',
        description: 'Desaturated shadows, warm highlights',
        values: {
            brightness: 95,
            contrast: 115,
            saturate: 85,
            sepia: 10,
            grayscale: 0,
            blur: 0,
            hueRotate: 5
        }
    },
    {
        id: 'film_noir',
        name: 'Film Noir',
        description: 'Classic black and white with high contrast',
        values: {
            brightness: 95,
            contrast: 140,
            saturate: 0,
            sepia: 0,
            grayscale: 100,
            blur: 0,
            hueRotate: 0
        }
    },
    {
        id: 'dreamy',
        name: 'Dreamy',
        description: 'Soft focus with warm ethereal glow',
        values: {
            brightness: 110,
            contrast: 90,
            saturate: 120,
            sepia: 15,
            grayscale: 0,
            blur: 0.3,
            hueRotate: 10
        }
    },
    {
        id: 'vintage_film',
        name: 'Vintage Film',
        description: 'Faded colors with film grain effect',
        values: {
            brightness: 105,
            contrast: 95,
            saturate: 70,
            sepia: 40,
            grayscale: 0,
            blur: 0,
            hueRotate: 15
        }
    },
    {
        id: 'cold_winter',
        name: 'Cold Winter',
        description: 'Cool blue tones with increased clarity',
        values: {
            brightness: 100,
            contrast: 110,
            saturate: 90,
            sepia: 0,
            grayscale: 0,
            blur: 0,
            hueRotate: 200
        }
    },
    {
        id: 'golden_hour',
        name: 'Golden Hour',
        description: 'Warm amber tones, soft shadows',
        values: {
            brightness: 108,
            contrast: 105,
            saturate: 115,
            sepia: 25,
            grayscale: 0,
            blur: 0,
            hueRotate: 20
        }
    },
    {
        id: 'dramatic',
        name: 'Dramatic',
        description: 'High contrast with deep shadows',
        values: {
            brightness: 90,
            contrast: 145,
            saturate: 110,
            sepia: 0,
            grayscale: 0,
            blur: 0,
            hueRotate: 0
        }
    },
    {
        id: 'pastel',
        name: 'Pastel',
        description: 'Soft desaturated colors',
        values: {
            brightness: 115,
            contrast: 85,
            saturate: 60,
            sepia: 0,
            grayscale: 0,
            blur: 0,
            hueRotate: 0
        }
    },
    {
        id: 'cyberpunk',
        name: 'Cyberpunk',
        description: 'Neon blues and magentas, high saturation',
        values: {
            brightness: 100,
            contrast: 125,
            saturate: 160,
            sepia: 0,
            grayscale: 0,
            blur: 0,
            hueRotate: 280
        }
    },
    {
        id: 'retro',
        name: 'Retro',
        description: 'Faded warm tones, slight blur',
        values: {
            brightness: 102,
            contrast: 90,
            saturate: 80,
            sepia: 30,
            grayscale: 0,
            blur: 0.2,
            hueRotate: 10
        }
    },
    {
        id: 'vivid',
        name: 'Vivid',
        description: 'Enhanced colors and sharpness',
        values: {
            brightness: 100,
            contrast: 115,
            saturate: 165,
            sepia: 0,
            grayscale: 0,
            blur: 0,
            hueRotate: 0
        }
    },
    {
        id: 'noir_color',
        name: 'Noir Color',
        description: 'Muted colors with strong contrast',
        values: {
            brightness: 95,
            contrast: 135,
            saturate: 50,
            sepia: 10,
            grayscale: 0,
            blur: 0,
            hueRotate: 0
        }
    },
    {
        id: 'sunset',
        name: 'Sunset',
        description: 'Deep orange and pink tones',
        values: {
            brightness: 105,
            contrast: 110,
            saturate: 125,
            sepia: 20,
            grayscale: 0,
            blur: 0,
            hueRotate: 350
        }
    },
    {
        id: 'moonlight',
        name: 'Moonlight',
        description: 'Cool blue monochromatic',
        values: {
            brightness: 90,
            contrast: 105,
            saturate: 60,
            sepia: 0,
            grayscale: 20,
            blur: 0,
            hueRotate: 210
        }
    },
    {
        id: 'tokyo_night',
        name: 'Tokyo Night',
        description: 'Neon city vibes with enhanced contrast',
        values: {
            brightness: 95,
            contrast: 130,
            saturate: 140,
            sepia: 0,
            grayscale: 0,
            blur: 0,
            hueRotate: 270
        }
    },
    {
        id: 'faded',
        name: 'Faded',
        description: 'Washed out, low contrast look',
        values: {
            brightness: 110,
            contrast: 75,
            saturate: 70,
            sepia: 0,
            grayscale: 0,
            blur: 0,
            hueRotate: 0
        }
    },
    {
        id: 'infrared',
        name: 'Infrared',
        description: 'False color infrared effect',
        values: {
            brightness: 105,
            contrast: 120,
            saturate: 100,
            sepia: 0,
            grayscale: 0,
            blur: 0,
            hueRotate: 180
        }
    },
    {
        id: 'chrome',
        name: 'Chrome',
        description: 'Metallic silver tones',
        values: {
            brightness: 100,
            contrast: 125,
            saturate: 30,
            sepia: 0,
            grayscale: 0,
            blur: 0,
            hueRotate: 0
        }
    },
    {
        id: 'desert',
        name: 'Desert',
        description: 'Warm sandy tones with high saturation',
        values: {
            brightness: 108,
            contrast: 105,
            saturate: 130,
            sepia: 35,
            grayscale: 0,
            blur: 0,
            hueRotate: 25
        }
    },
    {
        id: 'underwater',
        name: 'Underwater',
        description: 'Deep blue-green aquatic tones',
        values: {
            brightness: 95,
            contrast: 100,
            saturate: 120,
            sepia: 0,
            grayscale: 0,
            blur: 0.1,
            hueRotate: 170
        }
    },
    {
        id: 'warm',
        name: 'Warm',
        description: 'Cozy warm tones',
        values: {
            brightness: 105,
            contrast: 105,
            saturate: 110,
            sepia: 30,
            grayscale: 0,
            blur: 0,
            hueRotate: 15
        }
    },
    {
        id: 'cool',
        name: 'Cool',
        description: 'Cool refreshing tones',
        values: {
            brightness: 100,
            contrast: 110,
            saturate: 95,
            sepia: 0,
            grayscale: 0,
            blur: 0,
            hueRotate: 180
        }
    },
    {
        id: 'mono',
        name: 'Mono',
        description: 'Simple black and white',
        values: {
            brightness: 100,
            contrast: 100,
            saturate: 0,
            sepia: 0,
            grayscale: 100,
            blur: 0,
            hueRotate: 0
        }
    }
];

/**
 * Convert filter values to CSS filter string
 * @param {Object} filterValues - Filter values object
 * @returns {string} CSS filter string
 */
export const getFilterString = (filterValues) => {
    const {
        brightness = 100,
        contrast = 100,
        saturate = 100,
        sepia = 0,
        grayscale = 0,
        blur = 0,
        hueRotate = 0
    } = filterValues;

    return `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%) sepia(${sepia}%) grayscale(${grayscale}%) blur(${blur}px) hue-rotate(${hueRotate}deg)`;
};

/**
 * Blend two filter value objects based on intensity
 * @param {Object} baseFilter - Base filter (usually 'normal')
 * @param {Object} targetFilter - Target filter to blend towards
 * @param {number} intensity - Blend intensity (0-100)
 * @returns {Object} Blended filter values
 */
export const blendFilters = (baseFilter, targetFilter, intensity) => {
    const normalizedIntensity = Math.max(0, Math.min(100, intensity)) / 100;
    const blended = {};

    // Get all unique keys from both filters
    const keys = new Set([...Object.keys(baseFilter), ...Object.keys(targetFilter)]);

    keys.forEach(key => {
        const baseValue = baseFilter[key] ?? 0;
        const targetValue = targetFilter[key] ?? 0;
        blended[key] = baseValue + (targetValue - baseValue) * normalizedIntensity;
    });

    return blended;
};

/**
 * Get filter by ID
 * @param {string} filterId - Filter ID
 * @returns {Object|null} Filter object or null if not found
 */
export const getFilterById = (filterId) => {
    return VIDEO_FILTERS.find(f => f.id === filterId) || VIDEO_FILTERS[0];
};

/**
 * Apply filter intensity to filter values
 * @param {Object} filterValues - Original filter values
 * @param {number} intensity - Intensity percentage (0-100)
 * @returns {Object} Filter values with intensity applied
 */
export const applyFilterIntensity = (filterValues, intensity = 100) => {
    const normalFilter = VIDEO_FILTERS[0].values; // 'normal' filter
    return blendFilters(normalFilter, filterValues, intensity);
};
