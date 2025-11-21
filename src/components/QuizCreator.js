import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styles from './QuizCreator.module.css';

/**
 * QuizCreator
 * Create quiz posts with question, multiple choice options (2-4), correct answer, and duration
 * @param {Function} onCreate - Callback with quiz data { question, answers, correct, duration }
 * @example <QuizCreator onCreate={handleCreateQuiz} />
 */
const QuizCreator = ({ onCreate }) => {
  const [question, setQuestion] = useState('');
  const [answers, setAnswers] = useState(['', '']);
  const [correct, setCorrect] = useState(0);
  const [duration, setDuration] = useState(60);

  const handleAnswerChange = (i, val) => {
    setAnswers(ans => ans.map((a, idx) => idx === i ? val : a));
  };

  const addAnswer = () => {
    if (answers.length < 4) {
      setAnswers(ans => [...ans, '']);
    }
  };

  const removeAnswer = (i) => {
    if (answers.length > 2) {
      setAnswers(ans => ans.filter((_, idx) => idx !== i));
      // Adjust correct answer if needed
      if (correct === i) {
        setCorrect(0);
      } else if (correct > i) {
        setCorrect(correct - 1);
      }
    }
  };

  const handleCreate = () => {
    const filteredAnswers = answers.filter(Boolean);
    
    if (!question.trim()) {
      alert('Please enter a question');
      return;
    }
    
    if (filteredAnswers.length < 2) {
      alert('Please provide at least 2 answers');
      return;
    }

    if (filteredAnswers.length > 4) {
      alert('Maximum 4 answers allowed');
      return;
    }

    if (correct >= filteredAnswers.length) {
      alert('Please select a valid correct answer');
      return;
    }

    onCreate({ 
      question: question.trim(), 
      answers: filteredAnswers, 
      correct,
      duration 
    });

    // Reset form
    setQuestion('');
    setAnswers(['', '']);
    setCorrect(0);
    setDuration(60);
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Create Quiz</h3>
      
      <div className={styles.field}>
        <label className={styles.label}>Question</label>
        <input
          className={styles.input}
          type="text"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder="Enter your quiz question"
          aria-label="Quiz question"
          maxLength={200}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>
          Answers (2-4 options)
          <span className={styles.hint}>Select the correct answer</span>
        </label>
        {answers.map((ans, i) => (
          <div key={i} className={styles.answerRow}>
            <input
              type="radio"
              name="correct"
              checked={correct === i}
              onChange={() => setCorrect(i)}
              aria-label={`Mark answer ${i + 1} as correct`}
              className={styles.radio}
            />
            <input
              className={styles.input}
              type="text"
              value={ans}
              onChange={e => handleAnswerChange(i, e.target.value)}
              placeholder={`Answer ${i + 1}`}
              aria-label={`Quiz answer ${i + 1}`}
              maxLength={100}
            />
            {answers.length > 2 && (
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => removeAnswer(i)}
                aria-label={`Remove answer ${i + 1}`}
              >
                ✕
              </button>
            )}
          </div>
        ))}
        {answers.length < 4 && (
          <button 
            type="button"
            className={styles.addBtn} 
            onClick={addAnswer} 
            aria-label="Add answer"
          >
            + Add Answer
          </button>
        )}
      </div>

      <div className={styles.field}>
        <label className={styles.label}>
          Duration
          <span className={styles.hint}>{duration} seconds</span>
        </label>
        <input
          type="range"
          min="15"
          max="300"
          step="15"
          value={duration}
          onChange={e => setDuration(Number(e.target.value))}
          className={styles.slider}
          aria-label="Quiz duration in seconds"
        />
        <div className={styles.durationOptions}>
          {[30, 60, 90, 120].map(d => (
            <button
              key={d}
              type="button"
              className={`${styles.durationBtn} ${duration === d ? styles.active : ''}`}
              onClick={() => setDuration(d)}
            >
              {d}s
            </button>
          ))}
        </div>
      </div>

      <button 
        type="button"
        className={styles.createBtn} 
        onClick={handleCreate} 
        aria-label="Publish quiz"
      >
        Publish Quiz
      </button>
    </div>
  );
};

QuizCreator.propTypes = {
  onCreate: PropTypes.func.isRequired
};

export default React.memo(QuizCreator);
