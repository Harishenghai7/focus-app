import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../shared/Input';
import Button from '../shared/Button';
import Checkbox from '../shared/Checkbox';
import Toast from '../shared/Toast';
import UsernameCheck from './UsernameCheck';
import PasswordStrength from './PasswordStrength';
import useFormValidation from '../../hooks/useFormValidation';
import usePasswordStrength from '../../hooks/usePasswordStrength';
import { validateEmail } from '../../utils/validateEmail';
import { validatePassword } from '../../utils/validatePassword';
import { signUpWithEmail, createUserProfile, createUserSettings, createUserPresence } from '../../utils/supabaseAuth';
import { calculateAge, isAgeValid, isTeen, formatDOB, validateDOB, getAgeValidationMessage } from '../../utils/ageValidation';
import styles from './SignupForm.module.css';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaCalendar } from 'react-icons/fa';

const SignupForm = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [toast, setToast] = useState(null);
    const [isUsernameValid, setIsUsernameValid] = useState(false);
    const [dob, setDob] = useState({ month: '', day: '', year: '' });
    const [dobError, setDobError] = useState(null);
    const [ageMessage, setAgeMessage] = useState(null);

    const validate = (values) => {
        const errors = {};
        if (!values.email) {
            errors.email = 'Email is required';
        } else if (!validateEmail(values.email)) {
            errors.email = 'Invalid email format';
        }

        const pwCheck = validatePassword(values.password);
        if (!pwCheck.isValid) {
            errors.password = pwCheck.errors[0];
        }

        if (values.password !== values.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        if (!values.terms) {
            errors.terms = 'You must agree to the Terms & Privacy Policy';
        }

        return errors;
    };

    const {
        values,
        errors,
        isSubmitting,
        handleChange,
        handleBlur,
        handleSubmit,
        setValues
    } = useFormValidation({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        terms: false
    }, validate);

    const { strength, score } = usePasswordStrength(values.password);

    // Handle DOB change and validate
    const handleDobChange = (field, value) => {
        const newDob = { ...dob, [field]: value };
        setDob(newDob);

        // Validate if all fields are filled
        if (newDob.month && newDob.day && newDob.year) {
            const validation = validateDOB(newDob.month, newDob.day, newDob.year);

            if (!validation.isValid) {
                setDobError(validation.error);
                setAgeMessage(null);
            } else {
                setDobError(null);

                // Calculate age and show message
                const dobString = formatDOB(newDob.month, newDob.day, newDob.year);
                const age = calculateAge(dobString);
                const message = getAgeValidationMessage(age);
                setAgeMessage(message);
            }
        } else {
            setDobError(null);
            setAgeMessage(null);
        }
    };

    const onSubmit = async (formValues) => {
        // Validate username
        if (!isUsernameValid) {
            setToast({ type: 'error', message: 'Please choose a valid username' });
            return;
        }

        // Validate DOB
        if (!dob.month || !dob.day || !dob.year) {
            setToast({ type: 'error', message: 'Please enter your date of birth' });
            return;
        }

        const dobValidation = validateDOB(dob.month, dob.day, dob.year);
        if (!dobValidation.isValid) {
            setToast({ type: 'error', message: dobValidation.error });
            return;
        }

        // Calculate age and validate
        const dobString = formatDOB(dob.month, dob.day, dob.year);
        const age = calculateAge(dobString);

        if (!isAgeValid(age, 13)) {
            setToast({ type: 'error', message: 'You must be at least 13 years old to use Focus' });
            return;
        }

        const isTeenUser = isTeen(age);

        try {
            // Sign up with Supabase Auth
            const { data, error } = await signUpWithEmail(
                formValues.email,
                formValues.password,
                formValues.username,
                dobString
            );

            if (error) {
                console.error('Signup error:', error);

                if (error.message.includes('already registered') || error.message.includes('already been registered')) {
                    setToast({ type: 'error', message: 'This email is already registered' });
                } else {
                    setToast({ type: 'error', message: error.message || 'Failed to create account. Please try again.' });
                }
                return;
            }

            // Check if user was created
            if (!data?.user) {
                setToast({ type: 'error', message: 'Failed to create account. Please try again.' });
                return;
            }

            // The database trigger should create profile, settings, and presence
            // But we'll create them manually as a fallback
            try {
                // Wait a moment for trigger to execute
                await new Promise(resolve => setTimeout(resolve, 500));

                // Try to create profile (will fail if trigger already created it)
                await createUserProfile(data.user.id, formValues.username, formValues.email, dobString, isTeenUser);
                await createUserSettings(data.user.id, isTeenUser);
                await createUserPresence(data.user.id);
            } catch (recordError) {
                // Ignore errors - trigger likely already created records

            }

            // V1.0: Skip email verification - immediately log user in and navigate to onboarding
            setToast({
                type: 'success',
                message: isTeenUser
                    ? 'Account created with Teen Care mode! Welcome to Focus 🎯'
                    : 'Account created! Welcome to Focus 🎯'
            });

            // Navigate to onboarding after a brief delay to show success message
            setTimeout(() => navigate('/onboarding'), 1500);
        } catch (err) {
            console.error('Unexpected signup error:', err);
            setToast({
                type: 'error',
                message: 'An unexpected error occurred. Please try again.'
            });
        }
    };

    // Generate month options
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Generate day options (1-31)
    const days = Array.from({ length: 31 }, (_, i) => i + 1);

    // Generate year options (current year - 120 to current year - 5)
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 116 }, (_, i) => currentYear - 5 - i);

    return (
        <form className={styles.form} onSubmit={(e) => { e.preventDefault(); handleSubmit(onSubmit); }}>
            <UsernameCheck
                value={values.username}
                onChange={handleChange}
                onValidityChange={setIsUsernameValid}
            />

            <Input
                name="email"
                type="email"
                placeholder="Email Address"
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.email}
                icon={<FaEnvelope />}
            />

            <Input
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={values.password}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.password}
                icon={<FaLock />}
                rightElement={
                    <button
                        type="button"
                        className={styles.eyeButton}
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                }
            />

            <PasswordStrength strength={strength} score={score} />

            <Input
                name="confirmPassword"
                type="password"
                placeholder="Confirm Password"
                value={values.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.confirmPassword}
                icon={<FaLock />}
            />

            {/* Date of Birth Picker */}
            <div className={styles.dobSection}>
                <label className={styles.dobLabel}>
                    <FaCalendar className={styles.dobIcon} />
                    Date of Birth
                </label>
                <div className={styles.dobPicker}>
                    <select
                        className={styles.dobSelect}
                        value={dob.month}
                        onChange={(e) => handleDobChange('month', e.target.value)}
                    >
                        <option value="">Month</option>
                        {months.map((month, index) => (
                            <option key={month} value={index + 1}>
                                {month}
                            </option>
                        ))}
                    </select>

                    <select
                        className={styles.dobSelect}
                        value={dob.day}
                        onChange={(e) => handleDobChange('day', e.target.value)}
                    >
                        <option value="">Day</option>
                        {days.map((day) => (
                            <option key={day} value={day}>
                                {day}
                            </option>
                        ))}
                    </select>

                    <select
                        className={styles.dobSelect}
                        value={dob.year}
                        onChange={(e) => handleDobChange('year', e.target.value)}
                    >
                        <option value="">Year</option>
                        {years.map((year) => (
                            <option key={year} value={year}>
                                {year}
                            </option>
                        ))}
                    </select>
                </div>

                {dobError && <span className={styles.dobError}>{dobError}</span>}
                {ageMessage && (
                    <div className={`${styles.ageMessage} ${styles[ageMessage.type]}`}>
                        {ageMessage.text}
                    </div>
                )}
            </div>

            <div className={styles.terms}>
                <Checkbox
                    name="terms"
                    label="I agree to Terms & Privacy Policy"
                    checked={values.terms}
                    onChange={handleChange}
                />
                {errors.terms && <span className={styles.errorText}>{errors.terms}</span>}
            </div>

            <Button
                type="submit"
                variant="primary"
                fullWidth
                isLoading={isSubmitting}
                disabled={!isUsernameValid}
            >
                Create Account
            </Button>

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </form>
    );
};

export default SignupForm;

