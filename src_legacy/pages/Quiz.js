import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import QuizCreator from '../components/QuizCreator';
import QuizVoter from '../components/QuizVoter';
import QuizCard from '../components/QuizCard';
import BottomNav from '../components/BottomNav';
import './Quiz.css';

/**
 * Quiz Page
 * Create and participate in interactive quizzes
 * @page
 * @route /quiz
 * @example <Quiz />
 */
const Quiz = () => {
  const [user, setUser] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreator, setShowCreator] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUser();
    fetchQuizzes();
  }, []);

  const fetchUser = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
    } catch (err) {
      console.error('Error fetching user:', err);
      setError('Failed to load user');
    }
  };

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('quizzes')
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            avatar_url,
            full_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;
      setQuizzes(data || []);
    } catch (err) {
      console.error('Error fetching quizzes:', err);
      setError('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuiz = async (quizData) => {
    if (!user) {
      setError('Please log in to create quizzes');
      return;
    }

    try {
      const { data, error: createError } = await supabase
        .from('quizzes')
        .insert([{
          user_id: user.id,
          question: quizData.question,
          options: quizData.answers,
          correct_answer: quizData.correct,
          duration: quizData.duration || 60,
          created_at: new Date().toISOString()
        }])
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            avatar_url,
            full_name
          )
        `)
        .single();

      if (createError) throw createError;

      setQuizzes(prev => [data, ...prev]);
      setShowCreator(false);
      setError(null);
    } catch (err) {
      console.error('Error creating quiz:', err);
      setError('Failed to create quiz');
    }
  };

  const handleVote = async (quizId, selectedOption) => {
    if (!user) {
      setError('Please log in to vote');
      return;
    }

    try {
      // Check if user already voted
      const { data: existingVote } = await supabase
        .from('quiz_votes')
        .select('*')
        .eq('quiz_id', quizId)
        .eq('user_id', user.id)
        .single();

      if (existingVote) {
        setError('You already voted on this quiz');
        return;
      }

      // Record vote
      const { error: voteError } = await supabase
        .from('quiz_votes')
        .insert([{
          quiz_id: quizId,
          user_id: user.id,
          selected_option: selectedOption,
          created_at: new Date().toISOString()
        }]);

      if (voteError) throw voteError;

      // Refresh quizzes to show updated results
      await fetchQuizzes();
      setError(null);
    } catch (err) {
      console.error('Error voting:', err);
      setError('Failed to submit vote');
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!user) return;

    try {
      const { error: deleteError } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      setQuizzes(prev => prev.filter(q => q.id !== quizId));
      setError(null);
    } catch (err) {
      console.error('Error deleting quiz:', err);
      setError('Failed to delete quiz');
    }
  };

  return (
    <div className="quiz-page">
      <header className="quiz-header">
        <h1>🧠 Quizzes</h1>
        <button 
          className="create-quiz-btn"
          onClick={() => setShowCreator(!showCreator)}
          aria-label={showCreator ? 'Close quiz creator' : 'Create new quiz'}
        >
          {showCreator ? '✕' : '+ Create Quiz'}
        </button>
      </header>

      {error && (
        <div className="error-banner" role="alert">
          {error}
          <button onClick={() => setError(null)} aria-label="Dismiss error">✕</button>
        </div>
      )}

      {showCreator && (
        <div className="creator-container">
          <QuizCreator onCreate={handleCreateQuiz} />
        </div>
      )}

      <main className="quiz-content">
        {loading ? (
          <div className="loading-container">
            <div className="spinner" aria-label="Loading quizzes"></div>
            <p>Loading quizzes...</p>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🧠</div>
            <h2>No Quizzes Yet</h2>
            <p>Be the first to create a quiz!</p>
            <button 
              className="primary-btn"
              onClick={() => setShowCreator(true)}
            >
              Create Quiz
            </button>
          </div>
        ) : (
          <div className="quizzes-grid">
            {quizzes.map(quiz => (
              <QuizCard
                key={quiz.id}
                quiz={quiz}
                currentUser={user}
                onVote={handleVote}
                onDelete={handleDeleteQuiz}
              />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Quiz;
