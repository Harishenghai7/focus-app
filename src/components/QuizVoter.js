import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import CountdownTimer from './CountdownTimer';
import LeaderboardTable from './LeaderboardTable';
import { supabase } from '../supabaseClient';
import styles from './QuizVoter.module.css';

/**
 * QuizVoter
 * Interactive quiz voting interface with timer and results
 * @param {Object} quiz - Quiz object with question, options, correct_answer, duration
 * @param {Object} currentUser - Current user object
 * @param {Function} onVote - Callback with (quizId, selectedOption)
 * @example <QuizVoter quiz={quizData} currentUser={user} onVote={handleVote} />
 */
const QuizVoter = ({ quiz, currentUser, onVote }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [votes, setVotes] = useState([]);
  const [timeExpired, setTimeExpired] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (quiz && currentUser) {
      checkUserVote();
      fetchVotes();
      checkTimeExpired();
    }
  }, [quiz, currentUser]);

  const checkUserVote = async () => {
    try {
      const { data } = await supabase
        .from('quiz_votes')
        .select('selected_option')
        .eq('quiz_id', quiz.id)
        .eq('user_id', currentUser.id)
        .single();

      if (data) {
        setSelectedOption(data.selected_option);
        setHasVoted(true);
        setShowResults(true);
      }
    } catch (err) {
      // No vote found - that's okay
    } finally {
      setLoading(false);
    }
  };

  const fetchVotes = async () => {
    try {
      const { data } = await supabase
        .from('quiz_votes')
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            avatar_url
          )
        `)
        .eq('quiz_id', quiz.id)
        .order('created_at', { ascending: false });

      setVotes(data || []);
    } catch (err) {
      console.error('Error fetching votes:', err);
    }
  };

  const checkTimeExpired = () => {
    const createdAt = new Date(quiz.created_at);
    const expiresAt = new Date(createdAt.getTime() + quiz.duration * 1000);
    const now = new Date();
    
    if (now >= expiresAt) {
      setTimeExpired(true);
      setShowResults(true);
    }
  };

  const handleVote = (option) => {
    if (hasVoted || timeExpired) return;
    
    setSelectedOption(option);
    setHasVoted(true);
    onVote(quiz.id, option);
    
    // Show results after short delay
    setTimeout(() => {
      setShowResults(true);
      fetchVotes();
    }, 500);
  };

  const handleTimeExpired = () => {
    setTimeExpired(true);
    setShowResults(true);
  };

  const calculateResults = () => {
    const results = quiz.options.map((option, idx) => ({
      option,
      index: idx,
      votes: votes.filter(v => v.selected_option === idx).length,
      isCorrect: idx === quiz.correct_answer
    }));

    const totalVotes = votes.length;
    return { results, totalVotes };
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  const { results, totalVotes } = calculateResults();
  const correctVotes = votes.filter(v => v.selected_option === quiz.correct_answer).length;
  const userAnsweredCorrectly = hasVoted && selectedOption === quiz.correct_answer;

  return (
    <div className={styles.container}>
      <div className={styles.question}>{quiz.question}</div>

      {!timeExpired && !hasVoted && (
        <CountdownTimer
          startTime={quiz.created_at}
          duration={quiz.duration}
          onExpire={handleTimeExpired}
        />
      )}

      {showResults && (
        <div className={styles.resultsInfo}>
          {userAnsweredCorrectly ? (
            <div className={styles.correct}>✅ Correct!</div>
          ) : hasVoted ? (
            <div className={styles.incorrect}>❌ Incorrect</div>
          ) : (
            <div className={styles.expired}>⏰ Time's Up!</div>
          )}
          <div className={styles.stats}>
            {correctVotes} of {totalVotes} got it right ({totalVotes > 0 ? Math.round((correctVotes / totalVotes) * 100) : 0}%)
          </div>
        </div>
      )}

      <div className={styles.optionsList}>
        {results.map((result) => {
          const percentage = totalVotes > 0 ? (result.votes / totalVotes) * 100 : 0;
          const isSelected = selectedOption === result.index;
          const isCorrect = result.isCorrect;

          return (
            <button
              key={result.index}
              className={`${styles.optionBtn} ${
                isSelected ? styles.selected : ''
              } ${showResults && isCorrect ? styles.correctOption : ''} ${
                showResults && isSelected && !isCorrect ? styles.incorrectOption : ''
              }`}
              onClick={() => handleVote(result.index)}
              disabled={hasVoted || timeExpired}
              aria-label={`Option: ${result.option}`}
            >
              <div className={styles.optionContent}>
                <span className={styles.optionText}>{result.option}</span>
                {showResults && (
                  <>
                    <span className={styles.optionVotes}>
                      {result.votes} vote{result.votes !== 1 ? 's' : ''}
                    </span>
                    <span className={styles.optionPercent}>
                      {Math.round(percentage)}%
                    </span>
                    {isCorrect && <span className={styles.checkmark}>✓</span>}
                  </>
                )}
              </div>
              {showResults && (
                <div 
                  className={styles.progressBar}
                  style={{ width: `${percentage}%` }}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>

      {showResults && votes.length > 0 && (
        <div className={styles.leaderboardSection}>
          <h3>Leaderboard</h3>
          <LeaderboardTable 
            votes={votes} 
            correctAnswer={quiz.correct_answer}
          />
        </div>
      )}
    </div>
  );
};

QuizVoter.propTypes = {
  quiz: PropTypes.shape({
    id: PropTypes.number.isRequired,
    question: PropTypes.string.isRequired,
    options: PropTypes.arrayOf(PropTypes.string).isRequired,
    correct_answer: PropTypes.number.isRequired,
    duration: PropTypes.number.isRequired,
    created_at: PropTypes.string.isRequired
  }).isRequired,
  currentUser: PropTypes.object,
  onVote: PropTypes.func.isRequired
};

export default React.memo(QuizVoter);
