import React from 'react';
import { useGroupPolls } from '../../hooks/useGroupPolls';
import { useAuth } from '../../hooks/useAuth';
import styles from './PollDisplay.module.css';

const PollDisplay = ({ message }) => {
    const { user } = useAuth();
    const { votePoll, getPollResults, getUserRSVP } = useGroupPolls(message.group_id);

    const pollData = message.poll_data;
    const results = getPollResults(pollData);
    const userVote = getUserRSVP(pollData, user?.id);

    const handleVote = async (optionId) => {
        await votePoll(message.id, optionId, user?.id);
    };

    return (
        <div className={styles.poll}>
            <div className={styles.question}>{pollData.question}</div>

            <div className={styles.options}>
                {results.map(option => {
                    const isSelected = userVote !== null && option.id === userVote;

                    return (
                        <button
                            key={option.id}
                            className={`${styles.option} ${isSelected ? styles.selected : ''}`}
                            onClick={() => handleVote(option.id)}
                        >
                            <div className={styles.optionContent}>
                                <span className={styles.optionText}>{option.text}</span>
                                <span className={styles.optionVotes}>
                                    {option.voteCount} {option.voteCount === 1 ? 'vote' : 'votes'}
                                </span>
                            </div>
                            <div className={styles.progressBar}>
                                <div
                                    className={styles.progress}
                                    style={{ width: `${option.percentage}%` }}
                                />
                            </div>
                            <span className={styles.percentage}>{Math.round(option.percentage)}%</span>
                        </button>
                    );
                })}
            </div>

            <div className={styles.footer}>
                <span className={styles.totalVotes}>
                    {results.reduce((sum, opt) => sum + opt.voteCount, 0)} total votes
                </span>
            </div>
        </div>
    );
};

export default PollDisplay;
