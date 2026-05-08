import React, { useState, useEffect, useRef } from 'react';
import {
    FaBell,
    FaCheckCircle,
    FaCompass,
    FaGlobe,
    FaIdCard,
    FaRobot,
    FaRocket,
    FaShieldAlt,
    FaStar,
    FaUserFriends,
    FaUserPlus
} from 'react-icons/fa';
import styles from './OnboardingStepper.module.css';
import ProgressBar from './ProgressBar';
import StepWelcome from './StepWelcome';
import StepAgeVerification from './StepAgeVerification';
import StepInterests from './StepInterests';
import StepLanguageAccessibility from './StepLanguageAccessibility';
import StepFollowUsers from './StepFollowUsers';
import StepFocuslyAI from './StepFocuslyAI';
import StepTrustShield from './StepTrustShield';
import StepNotifications from './StepNotifications';
import useOnboardingPersistent from '../../hooks/useOnboardingPersistent';
import Toast from '../shared/Toast';

const STEP_DETAILS = [
    {
        step: 1,
        shortLabel: 'Identity',
        title: 'Create your real introduction',
        description: 'Shape your handle, visible name, and first impression for the Focus community.',
        icon: <FaStar />,
        color: '#a78bfa',
        emotionalCopy: 'This is who you are in Focus'
    },
    {
        step: 2,
        shortLabel: 'Age & Safety',
        title: 'Set your protection layer',
        description: 'We use this to activate the right safety defaults and content sensitivity.',
        icon: <FaIdCard />,
        color: '#60a5fa',
        emotionalCopy: 'We protect you first'
    },
    {
        step: 3,
        shortLabel: 'Interests',
        title: 'Tell us what lights you up',
        description: 'Choose passions that guide healthier recommendations and discovery.',
        icon: <FaCompass />,
        color: '#f59e0b',
        emotionalCopy: 'Your feed starts here'
    },
    {
        step: 4,
        shortLabel: 'Preferences',
        title: 'Focus adapts to you',
        description: 'Set language, accessibility, and display preferences for your experience.',
        icon: <FaGlobe />,
        color: '#10b981',
        emotionalCopy: 'Make it truly yours'
    },
    {
        step: 5,
        shortLabel: 'Community',
        title: 'Find your people',
        description: 'Discover creators, friends, and communities worth following from day one.',
        icon: <FaUserPlus />,
        color: '#ec4899',
        emotionalCopy: 'Connection starts now'
    },
    {
        step: 6,
        shortLabel: 'Focusly AI',
        title: 'Meet your AI companion',
        description: 'Customize how Focusly assists, suggests, and looks out for you.',
        icon: <FaRobot />,
        color: '#8b5cf6',
        emotionalCopy: 'Your intelligent sidekick'
    },
    {
        step: 7,
        shortLabel: 'Trust Shield',
        title: 'Prove you are real',
        description: 'Complete identity verification to unlock Focus with stronger trust signals.',
        icon: <FaShieldAlt />,
        color: '#14b8a6',
        emotionalCopy: 'Real people, real trust'
    },
    {
        step: 8,
        shortLabel: 'Launch',
        title: 'Your universe is ready',
        description: 'Review your setup and step into a calmer, more authentic social experience.',
        icon: <FaRocket />,
        color: '#f43f5e',
        emotionalCopy: 'Welcome home'
    }
];

const getTrustStatusLabel = (status) => {
    switch (status) {
        case 'VERIFIED':
        case 'VERIFIED_MINOR':
            return 'Verified';
        case 'PENDING_REVIEW':
            return 'Reviewing';
        case 'FAILED':
            return 'Retry needed';
        default:
            return 'Pending';
    }
};

const EMOTIONAL_MOTIVATIONS = [
    '',
    'You\'re building something real.',
    'Safety first — always.',
    'Your passions power your feed.',
    'Personalized just for you.',
    'Together is better.',
    'AI that cares about you.',
    'Trust is everything.',
    'Almost there — your universe awaits!'
];

const OnboardingStepper = () => {
    const {
        currentStep,
        totalSteps,
        formData,
        updateFormData,
        nextStep,
        prevStep,
        resetStep,
        isSubmitting,
        error,
        clearError,
        isRestored
    } = useOnboardingPersistent();

    const [transitionDirection, setTransitionDirection] = useState('forward');
    const [isTransitioning, setIsTransitioning] = useState(false);
    const prevStepRef = useRef(currentStep);
    const stepContentRef = useRef(null);

    // Detect direction for animation
    useEffect(() => {
        if (currentStep !== prevStepRef.current) {
            const dir = currentStep > prevStepRef.current ? 'forward' : 'backward';
            setTransitionDirection(dir);
            setIsTransitioning(true);

            const timer = setTimeout(() => {
                setIsTransitioning(false);
            }, 80);

            prevStepRef.current = currentStep;
            return () => clearTimeout(timer);
        }
    }, [currentStep]);

    const currentStepDetail = STEP_DETAILS.find((item) => item.step === currentStep) || STEP_DETAILS[0];
    const progressPercentage = Math.round((currentStep / totalSteps) * 100);
    const interestsCount = formData.interests?.length || 0;
    const followedCount = formData.followedUsers?.length || 0;
    const trustStatus = getTrustStatusLabel(formData.trustShieldStatus);
    const restoredCopy = isRestored && currentStep > 1;
    const motivation = EMOTIONAL_MOTIVATIONS[currentStep] || '';

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return <StepWelcome formData={formData} updateFormData={updateFormData} onNext={nextStep} />;
            case 2:
                return <StepAgeVerification formData={formData} updateFormData={updateFormData} onNext={nextStep} onBack={prevStep} />;
            case 3:
                return <StepInterests formData={formData} updateFormData={updateFormData} onNext={nextStep} onBack={prevStep} />;
            case 4:
                return <StepLanguageAccessibility formData={formData} updateFormData={updateFormData} onNext={nextStep} onBack={prevStep} />;
            case 5:
                return <StepFollowUsers formData={formData} updateFormData={updateFormData} onNext={nextStep} onBack={prevStep} />;
            case 6:
                return <StepFocuslyAI formData={formData} updateFormData={updateFormData} onNext={nextStep} onBack={prevStep} />;
            case 7:
                return <StepTrustShield formData={formData} updateFormData={updateFormData} onNext={nextStep} onBack={prevStep} onReset={resetStep} />;
            case 8:
                return <StepNotifications formData={formData} updateFormData={updateFormData} onNext={nextStep} onBack={prevStep} isSubmitting={isSubmitting} />;
            default:
                return null;
        }
    };

    return (
        <div className={styles.wrapper}>
            {/* Cinematic background layers */}
            <div className={styles.backgroundMesh} />
            <div className={styles.backgroundGrid} />
            <div className={styles.orbA} style={{ '--orb-color': currentStepDetail.color }} />
            <div className={styles.orbB} style={{ '--orb-color': currentStepDetail.color }} />
            <div className={styles.orbC} />

            <div className={styles.layout}>
                {/* ═══ SIDE PANEL ═══ */}
                <aside className={styles.sidePanel}>
                    <div className={styles.sideBadge}>
                        <span className={styles.badgeDot} />
                        Focus Onboarding
                    </div>

                    <div className={styles.sideHero}>
                        <h1 className={styles.sideTitle}>Entering a safer, more human social universe.</h1>
                        <p className={styles.sideSubtitle}>
                            This setup personalizes your feed, activates protections, and helps Focus understand the real person behind the profile.
                        </p>
                    </div>

                    {/* Live stats */}
                    <div className={styles.statsGrid}>
                        <article className={styles.statCard}>
                            <span className={styles.statLabel}>Progress</span>
                            <strong className={styles.statValue}>{progressPercentage}%</strong>
                        </article>
                        <article className={styles.statCard}>
                            <span className={styles.statLabel}>Interests</span>
                            <strong className={styles.statValue}>{interestsCount}</strong>
                        </article>
                        <article className={styles.statCard}>
                            <span className={styles.statLabel}>Following</span>
                            <strong className={styles.statValue}>{followedCount}</strong>
                        </article>
                        <article className={styles.statCard}>
                            <span className={styles.statLabel}>Trust Shield</span>
                            <strong className={styles.statValue}>{trustStatus}</strong>
                        </article>
                    </div>

                    {/* Step rail */}
                    <div className={styles.rail}>
                        {STEP_DETAILS.map((item) => {
                            const isCurrent = item.step === currentStep;
                            const isComplete = item.step < currentStep;

                            return (
                                <div
                                    key={item.step}
                                    className={`${styles.railItem} ${isCurrent ? styles.railItemCurrent : ''} ${isComplete ? styles.railItemComplete : ''}`}
                                >
                                    <div className={styles.railMarker} style={isCurrent ? { borderColor: item.color + '55' } : {}}>
                                        {isComplete ? <FaCheckCircle /> : item.icon}
                                    </div>
                                    <div className={styles.railCopy}>
                                        <span className={styles.railStep}>Step {item.step}</span>
                                        <h2 className={styles.railTitle}>{item.shortLabel}</h2>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {restoredCopy && (
                        <div className={styles.restoreCard}>
                            <span className={styles.restorePill}>Session restored</span>
                            <p className={styles.restoreText}>
                                Your onboarding progress was recovered so you can continue where you left off.
                            </p>
                        </div>
                    )}

                    <div className={styles.sideFooter}>
                        <div className={styles.sideFooterIcon}>
                            <FaUserFriends />
                        </div>
                        <p className={styles.sideFooterText}>
                            Focus is designed to prefer authenticity, trust, and emotional wellbeing over attention traps.
                        </p>
                    </div>
                </aside>

                {/* ═══ MAIN PANEL ═══ */}
                <section className={styles.mainPanel}>
                    <div className={styles.container}>
                        <ProgressBar
                            currentStep={currentStep}
                            totalSteps={totalSteps}
                            stepLabel={currentStepDetail.shortLabel}
                            title={currentStepDetail.title}
                            description={currentStepDetail.description}
                            progressPercentage={progressPercentage}
                            emotionalCopy={currentStepDetail.emotionalCopy}
                            stepColor={currentStepDetail.color}
                        />

                        {/* Motivation bar */}
                        {motivation && (
                            <div className={styles.motivationBar} key={currentStep}>
                                <span className={styles.motivationIcon}>✦</span>
                                <span className={styles.motivationText}>{motivation}</span>
                            </div>
                        )}

                        <div className={styles.stepFrame}>
                            <div
                                ref={stepContentRef}
                                className={`${styles.stepContent} ${isTransitioning ? '' : (transitionDirection === 'forward' ? styles.slideInRight : styles.slideInLeft)}`}
                                key={currentStep}
                            >
                                {renderStep()}
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {error && <Toast message={error} type="error" onClose={clearError} duration={8000} />}
        </div>
    );
};

export default OnboardingStepper;
