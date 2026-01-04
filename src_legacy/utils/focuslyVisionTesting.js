/**
 * Focusly Visual Reference Testing Utility
 * Tools to test and verify that Focusly remembers and describes its appearance correctly
 */

import { askFocusly, initializeFocuslyWithReference, getFocuslyInitializationStatus } from '../services/focuslyAI';
import { loadFocuslyImageBase64, FOCUSLY_VISUAL_DESCRIPTION, getFocuslyImageCacheAge } from '../utils/focuslyImageUtils';

/**
 * Test questions to ask Focusly about its appearance
 */
export const APPEARANCE_TEST_QUESTIONS = [
  "What do you look like?",
  "Can you describe your appearance?",
  "Who are you? What's your character design?",
  "What color is your mane?",
  "Describe yourself in detail",
  "How would you describe the lion character that you are?",
  "Tell me about your physical features",
  "What's your appearance like?"
];

/**
 * Run comprehensive test of Focusly visual reference
 * @returns {Promise<Object>} Test results
 */
export const testFocuslyVisualReference = async () => {
  const results = {
    timestamp: new Date().toISOString(),
    tests: {
      imageLoading: null,
      initialization: null,
      appearanceDescription: null,
      consistency: null
    },
    details: {},
    errors: [],
    warnings: []
  };

  try {
    // Test 1: Image Loading
    console.log('🧪 Test 1: Image Loading...');
    try {
      const imageBase64 = await loadFocuslyImageBase64();
      results.tests.imageLoading = {
        status: imageBase64 ? 'PASS' : 'FAIL',
        message: imageBase64 ? 'Image loaded successfully' : 'Failed to load image',
        cacheAge: getFocuslyImageCacheAge()
      };
      results.details.imageSize = imageBase64 ? `${Math.round(imageBase64.length / 1024)}KB` : 'N/A';
      console.log('✅ Test 1 passed:', results.tests.imageLoading.message);
    } catch (error) {
      results.tests.imageLoading = {
        status: 'ERROR',
        message: error.message,
        cacheAge: getFocuslyImageCacheAge()
      };
      results.errors.push(`Image loading error: ${error.message}`);
      console.error('❌ Test 1 failed:', error);
    }

    // Test 2: Initialization
    console.log('🧪 Test 2: Focusly Initialization...');
    try {
      const status = getFocuslyInitializationStatus();
      
      if (status === 'pending') {
        console.log('⏳ Initializing Focusly...');
        const initialized = await initializeFocuslyWithReference();
        results.tests.initialization = {
          status: initialized ? 'PASS' : 'FAIL',
          message: initialized ? 'Initialization successful' : 'Initialization failed',
          initialStatus: status,
          finalStatus: getFocuslyInitializationStatus()
        };
      } else {
        results.tests.initialization = {
          status: status === 'failed' ? 'FAIL' : 'PASS',
          message: `Already initialized with status: ${status}`,
          status: status
        };
      }
      console.log('✅ Test 2 passed:', results.tests.initialization.message);
    } catch (error) {
      results.tests.initialization = {
        status: 'ERROR',
        message: error.message
      };
      results.errors.push(`Initialization error: ${error.message}`);
      console.error('❌ Test 2 failed:', error);
    }

    // Test 3: Appearance Description
    console.log('🧪 Test 3: Testing Appearance Description...');
    try {
      const testQuestion = APPEARANCE_TEST_QUESTIONS[0];
      console.log(`   Asking: "${testQuestion}"`);
      
      const response = await askFocusly(testQuestion, [], {}, true);
      
      // Check if response contains appearance-related keywords
      const appearanceKeywords = ['lion', 'mane', 'golden', 'orange', 'friendly', 'warm'];
      const hasAppearanceContent = appearanceKeywords.some(keyword => 
        response.text.toLowerCase().includes(keyword)
      );

      results.tests.appearanceDescription = {
        status: hasAppearanceContent ? 'PASS' : 'PARTIAL',
        message: hasAppearanceContent 
          ? 'Response includes appearance details'
          : 'Response may lack specific appearance details',
        question: testQuestion,
        responsePreview: response.text.substring(0, 200),
        hasAppearanceKeywords: hasAppearanceContent
      };
      console.log('✅ Test 3 result:', results.tests.appearanceDescription.status);
    } catch (error) {
      results.tests.appearanceDescription = {
        status: 'ERROR',
        message: error.message
      };
      results.errors.push(`Appearance description test error: ${error.message}`);
      console.error('❌ Test 3 failed:', error);
    }

    // Test 4: Consistency Check
    console.log('🧪 Test 4: Testing Consistency Across Questions...');
    try {
      const responses = [];
      
      // Ask multiple appearance questions
      for (let i = 0; i < Math.min(3, APPEARANCE_TEST_QUESTIONS.length); i++) {
        const question = APPEARANCE_TEST_QUESTIONS[i];
        try {
          const response = await askFocusly(question, responses, {}, true);
          responses.push({
            question,
            answer: response.text
          });
        } catch (error) {
          console.warn(`Error asking question ${i}:`, error);
        }
      }

      // Check for consistency
      const allIncludeLion = responses.every(r => r.answer.toLowerCase().includes('lion'));
      const maneCount = responses.filter(r => r.answer.toLowerCase().includes('mane')).length;
      
      results.tests.consistency = {
        status: allIncludeLion ? 'PASS' : 'WARN',
        message: allIncludeLion 
          ? 'Responses consistently mention lion character'
          : 'Some responses may lack lion references',
        questionsAsked: responses.length,
        maneReferences: maneCount,
        responses: responses.map(r => ({
          question: r.question,
          preview: r.answer.substring(0, 150)
        }))
      };
      console.log('✅ Test 4 completed:', results.tests.consistency.status);
    } catch (error) {
      results.tests.consistency = {
        status: 'ERROR',
        message: error.message
      };
      results.errors.push(`Consistency test error: ${error.message}`);
      console.error('❌ Test 4 failed:', error);
    }

  } catch (error) {
    results.errors.push(`Unexpected error in test suite: ${error.message}`);
    console.error('❌ Unexpected error:', error);
  }

  // Summary
  const passCount = Object.values(results.tests).filter(t => t?.status === 'PASS').length;
  const failCount = Object.values(results.tests).filter(t => t?.status === 'FAIL').length;
  const errorCount = Object.values(results.tests).filter(t => t?.status === 'ERROR').length;

  results.summary = {
    totalTests: Object.keys(results.tests).length,
    passed: passCount,
    failed: failCount,
    errors: errorCount,
    overallStatus: errorCount === 0 && failCount === 0 ? '✅ ALL TESTS PASSED' : '⚠️ SOME TESTS FAILED'
  };

  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log(JSON.stringify(results.summary, null, 2));
  console.log('='.repeat(60) + '\n');

  return results;
};

/**
 * Simple test to check if Focusly remembers its appearance
 * @returns {Promise<Object>} Test result
 */
export const quickAppearanceTest = async () => {
  console.log('🚀 Quick Appearance Test...\n');
  
  try {
    const response = await askFocusly(
      "What do you look like?",
      [],
      {},
      true // Force visual reference
    );

    const appearanceKeywords = ['lion', 'mane', 'golden', 'orange', 'friendly'];
    const hasDetails = appearanceKeywords.some(k => response.text.toLowerCase().includes(k));

    return {
      success: true,
      question: "What do you look like?",
      response: response.text,
      hasAppearanceDetails: hasDetails,
      status: hasDetails ? '✅ PASS - Focusly describes appearance!' : '⚠️ PARTIAL - Response may lack details'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      status: '❌ FAIL - Error occurred'
    };
  }
};

/**
 * Print visual reference description to console
 */
export const printFocuslyDescription = () => {
  console.log('\n' + '='.repeat(70));
  console.log('🦁 FOCUSLY CHARACTER DESCRIPTION');
  console.log('='.repeat(70));
  console.log(FOCUSLY_VISUAL_DESCRIPTION);
  console.log('='.repeat(70) + '\n');
};

/**
 * Export test utilities for use in components
 */
export default {
  testFocuslyVisualReference,
  quickAppearanceTest,
  printFocuslyDescription,
  APPEARANCE_TEST_QUESTIONS
};
