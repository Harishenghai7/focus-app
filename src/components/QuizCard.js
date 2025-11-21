import React from 'react';
import PropTypes from 'prop-types';
import QuizVoter from './QuizVoter';
import { formatTime } from '../utils/dateFormatter';
import styles from './QuizCard.module.css';

/**
 * QuizCard
 * Card component displaying quiz with creator info and voting interface
 * @param {Object} quiz - Quiz object with all quiz data
 * @param {Object} currentUser - Current user object
 * @param {Function} onVote - Callback with (quizId, selectedOption)
 * @param {Function} onDelete - Callback with (quizId)
 * @example <QuizCard quiz={quiz} currentUser={user} onVote={handleVote} onDelete={handleDelete} />
 */
const QuizCard = ({ quiz, currentUser, onVote, onDelete }) => {
  const isOwner = currentUser && quiz.user_id === currentUser.id;
  const creator = quiz.profiles;

  const handleDelete = () => {
    if (window.confirm('Delete this quiz?')) {
      onDelete(quiz.id);
    }
  };

  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <div className={styles.creatorInfo}>
          {creator?.avatar_url ? (
            <img 
              src={creator.avatar_url} 
              alt={creator.username || creator.full_name || 'User'}
              className={styles.avatar}
            />
          ) : (
            <div className={styles.avatarPlaceholder}>
              {(creator?.username || creator?.full_name || 'U')[0].toUpperCase()}
            </div>
          )}
          <div className={styles.creatorText}>
            <div className={styles.username}>
              {creator?.username || creator?.full_name || 'Anonymous'}
            </div>
            <div className={styles.timestamp}>
              {formatTime(quiz.created_at)}
            </div>
          </div>
        </div>
        
        {isOwner && (
          <button
            className={styles.deleteBtn}
            onClick={handleDelete}
            aria-label="Delete quiz"
            title="Delete quiz"
          >
            🗑️
          </button>
        )}
      </div>

      <div className={styles.content}>
        <QuizVoter 
          quiz={quiz}
          currentUser={currentUser}
          onVote={onVote}
        />
      </div>

      <div className={styles.footer}>
        <div className={styles.meta}>
          <span className={styles.duration}>⏱️ {quiz.duration}s</span>
          <span className={styles.type}>🧠 Quiz</span>
        </div>
      </div>
    </article>
  );
};

QuizCard.propTypes = {
  quiz: PropTypes.shape({
    id: PropTypes.number.isRequired,
    user_id: PropTypes.string.isRequired,
    question: PropTypes.string.isRequired,
    options: PropTypes.arrayOf(PropTypes.string).isRequired,
    correct_answer: PropTypes.number.isRequired,
    duration: PropTypes.number.isRequired,
    created_at: PropTypes.string.isRequired,
    profiles: PropTypes.shape({
      id: PropTypes.string,
      username: PropTypes.string,
      avatar_url: PropTypes.string,
      full_name: PropTypes.string
    })
  }).isRequired,
  currentUser: PropTypes.object,
  onVote: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
};

export default React.memo(QuizCard);
