import * as toxicity from '@tensorflow-models/toxicity';

// Load the model once
let model = null;
const threshold = 0.9;

export const loadToxicityModel = async () => {
    if (model) return model;
    try {
        console.log('Loading toxicity model...');
        model = await toxicity.load(threshold);
        console.log('Toxicity model loaded');
        return model;
    } catch (error) {
        console.error('Error loading toxicity model:', error);
        return null;
    }
};

export const checkToxicity = async (text) => {
    if (!text) return { toxic: false, results: [] };

    try {
        const loadedModel = await loadToxicityModel();
        if (!loadedModel) return { toxic: false, results: [], error: 'Model failed to load' };

        const predictions = await loadedModel.classify([text]);

        // predictions is an array of objects: { label: string, results: [{ match: boolean, probabilities: Float32Array }] }

        const toxicResults = predictions.filter(p => p.results[0].match === true);

        return {
            toxic: toxicResults.length > 0,
            results: toxicResults.map(r => r.label),
            allPredictions: predictions
        };
    } catch (error) {
        console.error('Error checking toxicity:', error);
        return { toxic: false, results: [], error };
    }
};
