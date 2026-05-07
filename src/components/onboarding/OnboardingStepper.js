import React from 'react';
import {
    FaBell,
    FaCheckCircle,
    FaCompass,
    FaIdCard,
    FaShieldAlt,
    FaStar,
    FaUserFriends,
    FaUserPlus
} from 'react-icons/fa';
import styles from './OnboardingStepper.module.css';
import ProgressBar from './ProgressBar';
import StepWelcome from './StepWelcome';
import StepInterests from './StepInterests';
import StepFollowUsers from './StepFollowUsers';
import StepTrustShield from './StepTrustShield';
import StepNotifications from './StepNotifications';
import StepAgeVerification from './StepAgeVerification';
import useOnboardingPersistent from '../../hooks/useOnboardingPersistent';
import Toast from '../shared/Toast';

const STEP_DETAILS = [
    {
        step: 1,
        shortLabel: 'Identity',
        title: 'Create your real introduction',
        description: 'Shape your handle, visible name, and first impression for the Focus community.',
        icon: <FaStar />
    },
    {
        step: 2,
        shortLabel: 'Age & Safety',
        title: 'Confirm your age tier',
        description: 'We use this to activate the right protection, teen care systems, and safety defaults.',
        icon: <FaIdCard />
    },
    {
        step: 3,
        shortLabel: 'Interests',
        title: 'Teach Focus what matters to you',
        description: 'Choose interests that guide healthier recommendations, communities, and discovery.',
        icon: <FaCompass />
    },
    {
        step: 4,
        shortLabel: 'Community',
        title: 'Start with people worth following',
        description: 'Find trusted voices, creators, and communities that make your feed meaningful from day one.',
        icon: <FaUserPlus />
    },
    {
        step: 5,
        shortLabel: 'Trust Shield',
        title: 'Protect your identity with verification',
        description: 'Complete Trust Shield to prove you are real and unlock Focus with stronger trust signals.',
        icon: <FaShieldAlt />
    },
    {
        step: 6,
        shortLabel: 'Signals',
        title: 'Choose how Focus keeps you updated',
        description: 'Enable only the alerts that help you stay connected, safe, and in control.',
        icon: <FaBell />
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

    const currentStepDetail = STEP_DETAILS.find((item) => item.step === currentStep) || STEP_DETAILS[0];
    const progressPercentage = Math.round((currentStep / totalSteps) * 100);
    const interestsCount = formData.interests?.length || 0;
    const followedCount = formData.followedUsers?.length || 0;
    const trustStatus = getTrustStatusLabel(formData.trustShieldStatus);
    const restoredCopy = isRestored && currentStep > 1;

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return <StepWelcome formData={formData} updateFormData={updateFormData} onNext={nextStep} />;
            case 2:
                return <StepAgeVerification formData={formData} updateFormData={updateFormData} onNext={nextStep} onBack={prevStep} />;
            case 3:
                return <StepInterests formData={formData} updateFormData={updateFormData} onNext={nextStep} onBack={prevStep} />;
            case 4:
                return <StepFollowUsers formData={formData} updateFormData={updateFormData} onNext={nextStep} onBack={prevStep} />;
            case 5:
                return <StepTrustShield formData={formData} updateFormData={updateFormData} onNext={nextStep} onBack={prevStep} onReset={resetStep} />;
            case 6:
                return <StepNotifications formData={formData} updateFormData={updateFormData} onNext={nextStep} onBack={prevStep} isSubmitting={isSubmitting} />;
            default:
                return null;
        }
    };

    return (
        <div className={styles.wrapper}>
            <div className={styles.backgroundHalo}></div>
            <div className={styles.backgroundGrid}></div>

            <div className={styles.layout}>
                <aside className={styles.sidePanel}>
                    <div className={styles.sideBadge}>Focus Onboarding</div>

                    <div className={styles.sideHero}>
                        <h1 className={styles.sideTitle}>Entering a safer, more human social universe.</h1>
                        <p className={styles.sideSubtitle}>
                            This setup personalizes your feed, activates the right protections, and helps Focus understand the real person behind the profile.
                        </p>
                    </div>

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

                    <div className={styles.rail}>
                        {STEP_DETAILS.map((item) => {
                            const isCurrent = item.step === currentStep;
                            const isComplete = item.step < currentStep;

                            return (
                                <div
                                    key={item.step}
                                    className={`${styles.railItem} ${isCurrent ? styles.railItemCurrent : ''} ${isComplete ? styles.railItemComplete : ''}`}
                                >
                                    <div className={styles.railMarker}>
                                        {isComplete ? <FaCheckCircle /> : item.icon}
                                    </div>
                                    <div className={styles.railCopy}>
                                        <span className={styles.railStep}>Step {item.step}</span>
                                        <h2 className={styles.railTitle}>{item.shortLabel}</h2>
                                        <p className={styles.railDescription}>{item.description}</p>
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

                <section className={styles.mainPanel}>
                    <div className={styles.container}>
                        <ProgressBar
                            currentStep={currentStep}
                            totalSteps={totalSteps}
                            stepLabel={currentStepDetail.shortLabel}
                            title={currentStepDetail.title}
                            description={currentStepDetail.description}
                            progressPercentage={progressPercentage}
                        />

                        <div className={styles.stepFrame}>
                            <div className={styles.stepContent}>
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
