import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styles from './PollCreator.module.css';

/**
 * PollCreator
 * Create polls with multiple options.
 * @param {Function} onCreate - Callback with poll data
 * @example <PollCreator onCreate={handleCreatePoll} />
 */
const PollCreator = ({ onCreate }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);

  const handleOptionChange = (i, val) => {
    setOptions(opts => opts.map((o, idx) => idx === i ? val : o));
  };
  const addOption = () => setOptions(opts => [...opts, '']);
  const handleCreate = () => {
    if (question && options.filter(Boolean).length >= 2) {
      onCreate({ question, options: options.filter(Boolean) });
      setQuestion('');
      setOptions(['', '']);
    }
  };

  return (
    <div className={styles.container}>
      <input
        className={styles.input}
        type="text"
        value={question}
        onChange={e => setQuestion(e.target.value)}
        placeholder="Poll question"
        aria-label="Poll question"
      />
      {options.map((opt, i) => (
        <input
          key={i}
          className={styles.input}
          type="text"
          value={opt}
          onChange={e => handleOptionChange(i, e.target.value)}
          placeholder={`Option ${i + 1}`}
          aria-label={`Poll option ${i + 1}`}
        />
      ))}
      <button className={styles.addBtn} onClick={addOption} aria-label="Add option">Add Option</button>
      <button className={styles.createBtn} onClick={handleCreate} aria-label="Create poll">Create Poll</button>
    </div>
  );
};

PollCreator.propTypes = {
  onCreate: PropTypes.func.isRequired
};

export default React.memo(PollCreator);
