import React from 'react';
import PropTypes from 'prop-types';
import styles from './LeaderboardTable.module.css';

/**
 * LeaderboardTable
 * Displays quiz results in a ranked table format
 * @param {Array} votes - Array of vote objects with user info and selected_option
 * @param {number} correctAnswer - Index of correct answer
 * @example <LeaderboardTable votes={votesArray} correctAnswer={2} />
 */
const LeaderboardTable = ({ votes, correctAnswer }) => {
  // Calculate rankings - correct answers first, then by submission time
  const rankedVotes = [...votes]
    .map(vote => ({
      ...vote,
      isCorrect: vote.selected_option === correctAnswer
    }))
    .sort((a, b) => {
      // Correct answers first
      if (a.isCorrect !== b.isCorrect) {
        return a.isCorrect ? -1 : 1;
      }
      // Then by time (earlier is better)
      return new Date(a.created_at) - new Date(b.created_at);
    });

  const getRankEmoji = (rank) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `${rank}.`;
    }
  };

  if (votes.length === 0) {
    return (
      <div className={styles.empty}>
        No votes yet
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.rankColumn}>Rank</th>
            <th className={styles.userColumn}>User</th>
            <th className={styles.statusColumn}>Result</th>
          </tr>
        </thead>
        <tbody>
          {rankedVotes.map((vote, index) => {
            const rank = index + 1;
            const user = vote.profiles;
            
            return (
              <tr 
                key={vote.id || index}
                className={vote.isCorrect ? styles.correctRow : styles.incorrectRow}
              >
                <td className={styles.rank}>
                  <span className={styles.rankBadge}>
                    {getRankEmoji(rank)}
                  </span>
                </td>
                <td className={styles.user}>
                  <div className={styles.userInfo}>
                    {user?.avatar_url ? (
                      <img 
                        src={user.avatar_url} 
                        alt={user.username || 'User'}
                        className={styles.avatar}
                      />
                    ) : (
                      <div className={styles.avatarPlaceholder}>
                        {(user?.username || 'U')[0].toUpperCase()}
                      </div>
                    )}
                    <span className={styles.username}>
                      {user?.username || user?.full_name || 'Anonymous'}
                    </span>
                  </div>
                </td>
                <td className={styles.status}>
                  {vote.isCorrect ? (
                    <span className={styles.correctBadge}>✓ Correct</span>
                  ) : (
                    <span className={styles.incorrectBadge}>✗ Wrong</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

LeaderboardTable.propTypes = {
  votes: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number,
    user_id: PropTypes.string.isRequired,
    selected_option: PropTypes.number.isRequired,
    created_at: PropTypes.string.isRequired,
    profiles: PropTypes.shape({
      username: PropTypes.string,
      full_name: PropTypes.string,
      avatar_url: PropTypes.string
    })
  })).isRequired,
  correctAnswer: PropTypes.number.isRequired
};

export default React.memo(LeaderboardTable);
