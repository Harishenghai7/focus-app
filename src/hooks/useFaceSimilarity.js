/**
 * useFaceSimilarity.js
 * ====================
 * Compares live face capture against ID photo using face-api.js
 * Euclidean distance between 128-d face descriptors.
 * THRESHOLD: 0.95 similarity (distance <= 0.45)
 *
 * H2 Innovative — Focus Trust Shield
 */

import { useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';

// Euclidean distance → similarity score (0 to 1)
// distance=0 → identical. distance=0.45 → ~95% similarity threshold.
const SIMILARITY_THRESHOLD = 0.45; // Lower = stricter

const distanceToSimilarity = (distance) => {
  // Maps 0-1 distance to 0-100 similarity %
  return Math.max(0, Math.round((1 - distance) * 100));
};

export const useFaceSimilarity = () => {
  const [comparing, setComparing] = useState(false);
  const [result, setResult] = useState(null);

  /**
   * Extract face descriptor from an image file (ID photo)
   * @param {File|HTMLImageElement} imageSource
   */
  const extractDescriptorFromImage = useCallback(async (imageSource) => {
    let imgElement = imageSource;

    // If it's a File, create a temporary img element
    if (imageSource instanceof File) {
      const url = URL.createObjectURL(imageSource);
      imgElement = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
      });
      URL.revokeObjectURL(url);
    }

    const detection = await faceapi
      .detectSingleFace(imgElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      throw new Error('No face detected in the ID photo. Please upload a clearer image.');
    }

    return detection.descriptor;
  }, []);

  /**
   * Compare ID face against live captures
   * @param {File} idImageFile       - Uploaded Aadhaar/Student ID image
   * @param {Float32Array[]} liveDescriptors - Array of descriptors from liveness frames
   */
  const compareFaces = useCallback(async (idImageFile, liveDescriptors) => {
    setComparing(true);
    setResult(null);

    try {
      let imageSource = idImageFile;
      if (!imageSource) {
        const tempBase64 = sessionStorage.getItem('temp_id_verify');
        if (tempBase64) {
          const res = await fetch(tempBase64);
          const blob = await res.blob();
          imageSource = new File([blob], 'temp_id.png', { type: blob.type });
        } else {
          throw new Error('No ID image provided for comparison.');
        }
      }

      if (!liveDescriptors || liveDescriptors.length === 0) {
        throw new Error('No live face captures available. Please complete the liveness check first.');
      }

      // Extract descriptor from ID photo
      const idDescriptor = await extractDescriptorFromImage(imageSource);

      // Average all live descriptors for a stable reference
      const avgLiveDescriptor = averageDescriptors(liveDescriptors);

      // Calculate Euclidean distance
      const distance = faceapi.euclideanDistance(idDescriptor, avgLiveDescriptor);
      const similarity = distanceToSimilarity(distance);
      const passed = distance <= SIMILARITY_THRESHOLD;

      const comparison = {
        passed,
        distance: parseFloat(distance.toFixed(4)),
        similarity,
        threshold: SIMILARITY_THRESHOLD,
        reason: passed
          ? 'Face match confirmed.'
          : `Face similarity too low (${similarity}%). Minimum required: ${Math.round((1 - SIMILARITY_THRESHOLD) * 100)}%. Please ensure your ID photo and face are well-lit.`,
      };

      setResult(comparison);
      return comparison;
    } catch (err) {
      const errResult = {
        passed: false,
        distance: 1,
        similarity: 0,
        reason: err.message,
      };
      setResult(errResult);
      return errResult;
    } finally {
      setComparing(false);
    }
  }, [extractDescriptorFromImage]);

  /**
   * Average multiple Float32Array descriptors into a single stable one
   */
  const averageDescriptors = (descriptors) => {
    const len = descriptors[0].length;
    const avg = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      avg[i] = descriptors.reduce((sum, d) => sum + d[i], 0) / descriptors.length;
    }
    return avg;
  };

  return {
    comparing,
    result,
    compareFaces,
    extractDescriptorFromImage,
    SIMILARITY_THRESHOLD,
  };
};

export default useFaceSimilarity;
