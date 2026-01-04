import { useState, useEffect } from 'react';

const usePasswordStrength = (password) => {
    const [strength, setStrength] = useState('weak');
    const [score, setScore] = useState(0);

    useEffect(() => {
        if (!password) {
            setStrength('weak');
            setScore(0);
            return;
        }

        let tempScore = 0;
        if (password.length >= 8) tempScore += 1;
        if (/[A-Z]/.test(password)) tempScore += 1;
        if (/[0-9]/.test(password)) tempScore += 1;
        if (/[^A-Za-z0-9]/.test(password)) tempScore += 1;

        setScore(tempScore);

        if (tempScore <= 1) setStrength('weak');
        else if (tempScore === 2 || tempScore === 3) setStrength('medium');
        else setStrength('strong');

    }, [password]);

    return { strength, score };
};

export default usePasswordStrength;
