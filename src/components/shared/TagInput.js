import React, { useState } from 'react';
import styles from './TagInput.module.css';
import { X } from 'lucide-react';

const TagInput = ({ tags, onChange, placeholder = 'Add tags...' }) => {
    const [input, setInput] = useState('');

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag();
        } else if (e.key === 'Backspace' && !input && tags.length > 0) {
            removeTag(tags.length - 1);
        }
    };

    const addTag = () => {
        const trimmed = input.trim().replace(/^#/, '');
        if (trimmed && !tags.includes(trimmed)) {
            onChange([...tags, trimmed]);
            setInput('');
        }
    };

    const removeTag = (index) => {
        onChange(tags.filter((_, i) => i !== index));
    };

    return (
        <div className={styles.container}>
            <div className={styles.tagsWrapper}>
                {tags.map((tag, index) => (
                    <span key={index} className={styles.tag}>
                        #{tag}
                        <button
                            type="button"
                            className={styles.removeButton}
                            onClick={() => removeTag(index)}
                        >
                            <X size={12} />
                        </button>
                    </span>
                ))}
                <input
                    className={styles.input}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={addTag}
                    placeholder={tags.length === 0 ? placeholder : ''}
                />
            </div>
        </div>
    );
};

export default TagInput;
