/**
 * Aspect ratio presets for video cropping
 */
export const ASPECT_RATIOS = {
    ORIGINAL: { label: 'Original', value: null },
    SQUARE: { label: '1:1', value: 1 / 1 },
    PORTRAIT_4_5: { label: '4:5', value: 4 / 5 },
    PORTRAIT_9_16: { label: '9:16', value: 9 / 16 },
    LANDSCAPE_16_9: { label: '16:9', value: 16 / 9 },
    LANDSCAPE_4_3: { label: '4:3', value: 4 / 3 }
};

/**
 * Calculate crop dimensions based on aspect ratio
 * @param {number} videoWidth - Video width in pixels
 * @param {number} videoHeight - Video height in pixels
 * @param {number|null} aspectRatio - Target aspect ratio (width/height)
 * @returns {Object} Crop dimensions { x, y, width, height } in percentages
 */
export const calculateCropForAspectRatio = (videoWidth, videoHeight, aspectRatio) => {
    if (!aspectRatio) {
        // Original - no crop
        return { x: 0, y: 0, width: 100, height: 100 };
    }

    const videoAspectRatio = videoWidth / videoHeight;

    if (aspectRatio > videoAspectRatio) {
        // Target is wider - crop top and bottom
        const newHeight = videoWidth / aspectRatio;
        const cropY = (videoHeight - newHeight) / 2;
        return {
            x: 0,
            y: (cropY / videoHeight) * 100,
            width: 100,
            height: (newHeight / videoHeight) * 100
        };
    } else {
        // Target is taller - crop left and right
        const newWidth = videoHeight * aspectRatio;
        const cropX = (videoWidth - newWidth) / 2;
        return {
            x: (cropX / videoWidth) * 100,
            y: 0,
            width: (newWidth / videoWidth) * 100,
            height: 100
        };
    }
};

/**
 * Constrain crop region to maintain aspect ratio
 * @param {Object} crop - Current crop { x, y, width, height } in percentages
 * @param {number|null} aspectRatio - Aspect ratio to maintain
 * @param {string} handle - Which handle is being dragged
 * @returns {Object} Constrained crop dimensions
 */
export const constrainCropToAspectRatio = (crop, aspectRatio, handle = null) => {
    if (!aspectRatio) {
        return crop; // No constraint for original aspect ratio
    }

    const { x, y, width, height } = crop;
    const currentAspectRatio = width / height;

    if (Math.abs(currentAspectRatio - aspectRatio) < 0.001) {
        return crop; // Already at correct aspect ratio
    }

    // Adjust based on which dimension should be constrained
    if (handle && (handle.includes('n') || handle.includes('s'))) {
        // Height is being changed, adjust width
        const newWidth = height * aspectRatio;
        return {
            x: x + (width - newWidth) / 2,
            y,
            width: newWidth,
            height
        };
    } else {
        // Width is being changed (or center drag), adjust height
        const newHeight = width / aspectRatio;
        return {
            x,
            y: y + (height - newHeight) / 2,
            width,
            height: newHeight
        };
    }
};

/**
 * Validate and constrain crop region to video boundaries
 * @param {Object} crop - Crop region { x, y, width, height } in percentages
 * @returns {Object} Bounded crop region
 */
export const boundCropRegion = (crop) => {
    let { x, y, width, height } = crop;

    // Ensure minimum size
    const MIN_SIZE = 10; // 10% minimum
    width = Math.max(MIN_SIZE, width);
    height = Math.max(MIN_SIZE, height);

    // Constrain to boundaries
    if (x < 0) {
        width += x;
        x = 0;
    }
    if (y < 0) {
        height += y;
        y = 0;
    }
    if (x + width > 100) {
        width = 100 - x;
    }
    if (y + height > 100) {
        height = 100 - y;
    }

    // Ensure we're still within bounds after adjustments
    x = Math.max(0, Math.min(100 - width, x));
    y = Math.max(0, Math.min(100 - height, y));

    return { x, y, width, height };
};

/**
 * Convert percentage crop to pixel crop
 * @param {Object} cropPercent - Crop in percentages
 * @param {number} videoWidth - Video width in pixels
 * @param {number} videoHeight - Video height in pixels
 * @returns {Object} Crop in pixels
 */
export const percentToPixelCrop = (cropPercent, videoWidth, videoHeight) => {
    return {
        x: (cropPercent.x / 100) * videoWidth,
        y: (cropPercent.y / 100) * videoHeight,
        width: (cropPercent.width / 100) * videoWidth,
        height: (cropPercent.height / 100) * videoHeight
    };
};

/**
 * Convert pixel crop to percentage crop
 * @param {Object} cropPixel - Crop in pixels
 * @param {number} videoWidth - Video width in pixels
 * @param {number} videoHeight - Video height in pixels
 * @returns {Object} Crop in percentages
 */
export const pixelToPercentCrop = (cropPixel, videoWidth, videoHeight) => {
    return {
        x: (cropPixel.x / videoWidth) * 100,
        y: (cropPixel.y / videoHeight) * 100,
        width: (cropPixel.width / videoWidth) * 100,
        height: (cropPixel.height / videoHeight) * 100
    };
};

/**
 * Calculate handle positions for crop overlay
 * @param {Object} crop - Crop region { x, y, width, height } in percentages
 * @returns {Object} Handle positions
 */
export const getHandlePositions = (crop) => {
    const { x, y, width, height } = crop;

    return {
        nw: { x, y },
        n: { x: x + width / 2, y },
        ne: { x: x + width, y },
        e: { x: x + width, y: y + height / 2 },
        se: { x: x + width, y: y + height },
        s: { x: x + width / 2, y: y + height },
        sw: { x, y: y + height },
        w: { x, y: y + height / 2 }
    };
};

/**
 * Get crop region from handle drag
 * @param {Object} currentCrop - Current crop region
 * @param {string} handle - Handle identifier (nw, n, ne, e, se, s, sw, w)
 * @param {number} deltaX - Change in X (in percentages)
 * @param {number} deltaY - Change in Y (in percentages)
 * @param {number|null} aspectRatio - Aspect ratio constraint
 * @returns {Object} New crop region
 */
export const updateCropFromHandle = (currentCrop, handle, deltaX, deltaY, aspectRatio = null) => {
    let { x, y, width, height } = { ...currentCrop };

    switch (handle) {
        case 'nw':
            x += deltaX;
            y += deltaY;
            width -= deltaX;
            height -= deltaY;
            break;
        case 'n':
            y += deltaY;
            height -= deltaY;
            break;
        case 'ne':
            y += deltaY;
            width += deltaX;
            height -= deltaY;
            break;
        case 'e':
            width += deltaX;
            break;
        case 'se':
            width += deltaX;
            height += deltaY;
            break;
        case 's':
            height += deltaY;
            break;
        case 'sw':
            x += deltaX;
            width -= deltaX;
            height += deltaY;
            break;
        case 'w':
            x += deltaX;
            width -= deltaX;
            break;
        default:
            break;
    }

    let newCrop = { x, y, width, height };

    // Apply aspect ratio constraint if needed
    if (aspectRatio) {
        newCrop = constrainCropToAspectRatio(newCrop, aspectRatio, handle);
    }

    // Bound to video boundaries
    return boundCropRegion(newCrop);
};
