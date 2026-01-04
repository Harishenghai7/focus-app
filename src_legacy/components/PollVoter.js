import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styles from './PollVoter.module.css';

/**
 * PollVoter
 * Vote on polls with real-time results.
 * @param {string} question - Poll question
 * @param {Array<{option:string, votes:number}>} options - Poll options
 * @param {Function} onVote - Callback with selected option
 * @example <PollVoter question="..." options={[{option:'A',votes:2}]} onVote={handleVote} />
 */
const PollVoter = ({ question, options, onVote }) => {
  const [selected, setSelected] = useState(null);
  const totalVotes = options.reduce((sum, o) => sum + o.votes, 0);

  return (
    <div className={styles.container}>
      <div className={styles.question}>{question}</div>
      <ul className={styles.list}>
        {options.map((o, i) => (
          <li key={i} className={styles.option}>
            <button
              className={selected === o.option ? styles.selected : styles.voteBtn}
              onClick={() => { setSelected(o.option); onVote(o.option); }}
              aria-label={`Vote for ${o.option}`}
              disabled={!!selected}
            >
              {o.option}
            </button>
            <span className={styles.votes}>{o.votes} votes</span>
            <span className={styles.percent}>{totalVotes ? Math.round((o.votes / totalVotes) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

PollVoter.propTypes = {
  question: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(PropTypes.shape({
    option: PropTypes.string.isRequired,
    votes: PropTypes.number.isRequired
  })).isRequired,
  onVote: PropTypes.func.isRequired
};

export default React.memo(PollVoter);
