import * as nsfwjs from 'nsfwjs';

let model = null;

export const loadNSFWModel = async () => {
    if (model) return model;
    try {
        console.log('Loading NSFW model...');
        // Load the model from a public URL or local files if available. 
        // Using default (S3 hosted) for now.
        model = await nsfwjs.load();
        console.log('NSFW model loaded');
        return model;
    } catch (error) {
        console.error('Error loading NSFW model:', error);
        return null;
    }
};

export const checkImageNSFW = async (imgElementOrTensor) => {
    try {
        const loadedModel = await loadNSFWModel();
        if (!loadedModel) return { flagged: false, predictions: [] };

        const predictions = await loadedModel.classify(imgElementOrTensor);
        // predictions is array of { className: "Porn" | "Hentai" | "Sexy" | "Neutral" | "Drawing", probability: number }

        // Define thresholds
        const thresholds = {
            Porn: 0.4,
            Hentai: 0.4,
            Sexy: 0.6, // Stricter or looser depending on policy
        };

        const flagged = predictions.some(p => {
            const threshold = thresholds[p.className];
            return threshold && p.probability > threshold;
        });

        return {
            flagged,
            predictions
        };
    } catch (error) {
        console.error('Error checking image NSFW:', error);
        return { flagged: false, predictions: [], error };
    }
};
