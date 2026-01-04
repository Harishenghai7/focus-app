import { useState, useCallback } from 'react';
import { getCroppedImg } from '../utils/imageUtils';

export const usePhotoEditor = (initialImage) => {
    const [image, setImage] = useState(initialImage);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    // Filters & Adjustments
    const [filter, setFilter] = useState('none');
    const [adjustments, setAdjustments] = useState({
        brightness: 100,
        contrast: 100,
        saturation: 100,
    });

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const generateResult = async () => {
        try {
            const croppedImage = await getCroppedImg(
                image,
                croppedAreaPixels,
                rotation
            );
            return croppedImage;
        } catch (e) {
            console.error('Error generating crop:', e);
            return null;
        }
    };

    return {
        image,
        setImage,
        crop,
        setCrop,
        zoom,
        setZoom,
        rotation,
        setRotation,
        filter,
        setFilter,
        adjustments,
        setAdjustments,
        onCropComplete,
        generateResult
    };
};
