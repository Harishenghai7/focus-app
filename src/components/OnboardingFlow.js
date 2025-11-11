import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import AvatarUpload from './AvatarUpload';
import './OnboardingFlow.css';

export default function OnboardingFlow({ user, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    bio: '',
    avatar_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if user already has a complete profile on mount
  React.useEffect(() => {
    if (!user) return;
    
    const checkExistingProfile = async () => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profile && profile.username && profile.full_name) {
          // User already has a complete profile, skip onboarding
          onComplete(profile);
          return;
        }
        
        // Pre-fill form with existing data if available
        if (profile) {
          setFormData({
            username: profile.username || '',
            full_name: profile.full_name || '',
            bio: profile.bio || '',
            avatar_url: profile.avatar_url || ''
          });
        }
      } catch (error) {
        // Continue with onboarding if profile check fails
        console.log('Profile check failed, continuing with onboarding');
      }
    };
    
    checkExistingProfile();
  }, [user?.id, onComplete]);

  // Safety check: If no user, don't render onboarding
  if (!user) {
    console.warn('OnboardingFlow: No user provided');
    return (
      <div className="onboarding-overlay">
        <div className="onboarding-container">
          <div className="error-message">
            Authentication required. Please log in first.
          </div>
        </div>
      </div>
    );
  }

  const steps = [
    {
      title: 'Welcome to Focus!',
      subtitle: 'Let\'s set up your profile',
      component: 'welcome'
    },
    {
      title: 'Choose your username',
      subtitle: 'This is how others will find you',
      component: 'username'
    },
    {
      title: 'Add your name',
      subtitle: 'Help people recognize you',
      component: 'name'
    },
    {
      title: 'Upload a profile photo',
      subtitle: 'Show your personality',
      component: 'avatar'
    },
    {
      title: 'Tell us about yourself',
      subtitle: 'Write a short bio (optional)',
      component: 'bio'
    }
  ];

  const handleNext = async () => {
    if (currentStep === steps.length - 1) {
      await completeOnboarding();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const completeOnboarding = async () => {
    setLoading(true);
    setError('');

    try {
      // Basic validation
      if (!formData.username || formData.username.length < 3) {
        setError('Username must be at least 3 characters');
        setLoading(false);
        return;
      }

      if (!formData.full_name) {
        setError('Please enter your full name');
        setLoading(false);
        return;
      }

      // First check if profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (existingProfile) {
        // Profile exists, just update it
        const { data: updatedProfile, error: updateError } = await supabase
          .from('profiles')
          .update({
            username: formData.username.toLowerCase(),
            full_name: formData.full_name,
            bio: formData.bio || existingProfile.bio || '',
            avatar_url: formData.avatar_url || existingProfile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.full_name)}`,
            onboarding_completed: true
          })
          .eq('id', user.id)
          .select()
          .single();

        if (updateError) {
          throw new Error(`Failed to update profile: ${updateError.message}`);
        }

        onComplete(updatedProfile);
        return;
      }

      // Create new profile data
      const profileData = {
        id: user?.id || 'demo-user',
        username: formData.username.toLowerCase(),
        full_name: formData.full_name,
        bio: formData.bio || '',
        avatar_url: formData.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.full_name)}`,
        email: user?.email || 'demo@example.com',
        onboarding_completed: true
      };

      // Save new profile to database
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert([profileData])
        .select()
        .single();

      if (insertError) {
        // If it's a duplicate key error, try to fetch the existing profile
        if (insertError.code === '23505') {
          const { data: fetchedProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (fetchedProfile) {
            onComplete(fetchedProfile);
            return;
          }
        }
        throw new Error(`Failed to create profile: ${insertError.message}`);
      }

      onComplete(newProfile);
      
    } catch (error) {
      console.error('Onboarding error:', error);
      setError(`Setup failed: ${error.message || 'Please try again'}`);
    } finally {
      setLoading(false);
    }
  };

  const renderWelcome = () => (
    <div className="onboarding-content">
      <div className="welcome-animation">
        <motion.div
          className="focus-logo-large"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <img 
            src="/focus-logo.png" 
            alt="Focus Logo" 
            onError={(e) => {
              // Fallback to a gradient placeholder if image fails
              e.target.style.display = 'none';
              e.target.parentElement.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
              e.target.parentElement.style.display = 'flex';
              e.target.parentElement.style.alignItems = 'center';
              e.target.parentElement.style.justifyContent = 'center';
              e.target.parentElement.innerHTML = '<span style="font-size: 3rem; font-weight: 800; color: white;">F</span>';
            }}
          />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          Welcome to Focus
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          Connect with friends, share moments, and discover amazing content
        </motion.p>
      </div>
      
      <div className="features-preview">
        <motion.div 
          className="feature-item"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.9 }}
        >
          <span className="feature-icon">📸</span>
          <span>Share photos and videos</span>
        </motion.div>
        <motion.div 
          className="feature-item"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.1 }}
        >
          <span className="feature-icon">⚡</span>
          <span>Create Flash stories</span>
        </motion.div>
        <motion.div 
          className="feature-item"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.3 }}
        >
          <span className="feature-icon">💬</span>
          <span>Message friends</span>
        </motion.div>
      </div>
    </div>
  );

  const renderUsername = () => (
    <div className="onboarding-content">
      <div className="input-section">
        <div className="username-input-container">
          <span className="username-prefix">@</span>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => {
              const value = e.target.value.toLowerCase().replace(/[^a-zA-Z0-9_]/g, '');
              setFormData(prev => ({ ...prev, username: value }));
              setError('');
            }}
            placeholder="username"
            className="username-input"
            maxLength={30}
          />
        </div>
        <div className="input-help">
          <p>Choose a unique username (3-30 characters)</p>
          <p>Only letters, numbers, and underscores allowed</p>
        </div>
      </div>
    </div>
  );

  const renderName = () => (
    <div className="onboarding-content">
      <div className="input-section">
        <input
          type="text"
          value={formData.full_name}
          onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
          placeholder="Your full name"
          className="text-input"
          maxLength={50}
        />
        <div className="input-help">
          <p>This will be displayed on your profile</p>
        </div>
      </div>
    </div>
  );

  const renderAvatar = () => (
    <div className="onboarding-content">
      <div className="avatar-section">
        <AvatarUpload
          user={user}
          currentAvatar={formData.avatar_url}
          onUpload={(url) => setFormData(prev => ({ ...prev, avatar_url: url }))}
          size="large"
        />
        <div className="input-help">
          <p>Upload a photo or skip to use a default avatar</p>
        </div>
      </div>
    </div>
  );

  const renderBio = () => (
    <div className="onboarding-content">
      <div className="input-section">
        <textarea
          value={formData.bio}
          onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
          placeholder="Tell people a bit about yourself..."
          className="bio-input"
          maxLength={150}
          rows={4}
        />
        <div className="input-help">
          <p>{formData.bio.length}/150 characters</p>
          <p>This is optional - you can add it later</p>
        </div>
      </div>
    </div>
  );

  const renderStepContent = () => {
    const step = steps[currentStep];
    switch (step.component) {
      case 'welcome': return renderWelcome();
      case 'username': return renderUsername();
      case 'name': return renderName();
      case 'avatar': return renderAvatar();
      case 'bio': return renderBio();
      default: return null;
    }
  };

  const canProceed = () => {
    switch (steps[currentStep].component) {
      case 'welcome': return true;
      case 'username': return formData.username.length >= 3;
      case 'name': return formData.full_name.length >= 1;
      case 'avatar': return true; // Optional
      case 'bio': return true; // Optional
      default: return false;
    }
  };

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-container">
        {/* Progress Bar */}
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Step Counter */}
        <div className="step-counter">
          {currentStep + 1} of {steps.length}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            className="step-container"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="step-header">
              <h2>{steps[currentStep].title}</h2>
              <p>{steps[currentStep].subtitle}</p>
            </div>

            {renderStepContent()}

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="onboarding-navigation">
          {currentStep > 0 && (
            <button 
              className="btn-secondary"
              onClick={handleBack}
              disabled={loading}
            >
              Back
            </button>
          )}
          
          <button 
            className="btn-primary"
            onClick={handleNext}
            disabled={!canProceed() || loading}
          >
            {loading ? (
              <div className="loading-spinner small" />
            ) : currentStep === steps.length - 1 ? (
              'Complete Setup'
            ) : (
              'Next'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}