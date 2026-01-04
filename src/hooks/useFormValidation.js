import { useState, useCallback } from 'react';

const useFormValidation = (initialState, validate) => {
    const [values, setValues] = useState(initialState);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;

        setValues({
            ...values,
            [name]: val,
        });

        // Real-time validation for the changed field
        if (validate) {
            const validationErrors = validate({ ...values, [name]: val });
            setErrors(prevErrors => ({
                ...prevErrors,
                [name]: validationErrors[name]
            }));
        }
    };

    const handleBlur = () => {
        if (validate) {
            const validationErrors = validate(values);
            setErrors(validationErrors);
        }
    };

    const handleSubmit = async (onSubmit) => {
        setIsSubmitting(true);
        const validationErrors = validate ? validate(values) : {};
        setErrors(validationErrors);

        if (Object.keys(validationErrors).length === 0) {
            try {
                await onSubmit(values);
            } catch (error) {
                console.error("Form submission error", error);
            }
        }
        setIsSubmitting(false);
    };

    return {
        values,
        errors,
        isSubmitting,
        handleChange,
        handleBlur,
        handleSubmit,
        setValues,
        setErrors
    };
};

export default useFormValidation;
