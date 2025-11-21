// Example: How to add Report functionality to existing components

// ============================================================
// EXAMPLE 1: Add Report Button to Post Component
// ============================================================

import { useNavigate } from 'react-router-dom';

function Post({ post, user }) {
  const navigate = useNavigate();

  const handleReport = () => {
    navigate('/report', {
      state: {
        reportTarget: {
          type: 'post',
          id: post.id,
          contentOwnerId: post.user_id
        }
      }
    });
  };

  return (
    <div className="post">
      {/* ...existing post content... */}
      
      {/* Add Report button in post menu/dropdown */}
      <button className="report-button" onClick={handleReport}>
        🚨 Report Post
      </button>
    </div>
  );
}


// ============================================================
// EXAMPLE 2: Add Report Button to Profile Page
// ============================================================

function Profile({ profileUser, currentUser }) {
  const navigate = useNavigate();

  const handleReportUser = () => {
    navigate('/report', {
      state: {
        reportTarget: {
          type: 'user',
          id: profileUser.id,
          contentOwnerId: profileUser.id
        }
      }
    });
  };

  return (
    <div className="profile">
      {/* ...existing profile content... */}
      
      {/* Show report button only if viewing someone else's profile */}
      {currentUser?.id !== profileUser.id && (
        <button className="report-user-button" onClick={handleReportUser}>
          Report User
        </button>
      )}
    </div>
  );
}


// ============================================================
// EXAMPLE 3: Add Report Button to Comment
// ============================================================

function Comment({ comment, user }) {
  const navigate = useNavigate();

  const handleReportComment = () => {
    navigate('/report', {
      state: {
        reportTarget: {
          type: 'comment',
          id: comment.id,
          contentOwnerId: comment.user_id
        }
      }
    });
  };

  return (
    <div className="comment">
      {/* ...existing comment content... */}
      
      <button className="report-comment-button" onClick={handleReportComment}>
        Report
      </button>
    </div>
  );
}


// ============================================================
// EXAMPLE 4: Add Report Option to Dropdown Menu
// ============================================================

function PostMenu({ post, user }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleReport = () => {
    setMenuOpen(false);
    navigate('/report', {
      state: {
        reportTarget: {
          type: 'post',
          id: post.id,
          contentOwnerId: post.user_id
        }
      }
    });
  };

  return (
    <div className="post-menu">
      <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
        ⋮
      </button>
      
      {menuOpen && (
        <div className="menu-dropdown">
          {/* ...other menu options... */}
          
          <button className="menu-item report" onClick={handleReport}>
            <span className="icon">🚨</span>
            <span className="label">Report</span>
          </button>
        </div>
      )}
    </div>
  );
}


// ============================================================
// EXAMPLE 5: Add Report Button to Message/Chat
// ============================================================

function Message({ message, user }) {
  const navigate = useNavigate();

  const handleReportMessage = () => {
    navigate('/report', {
      state: {
        reportTarget: {
          type: 'message',
          id: message.id,
          contentOwnerId: message.sender_id
        }
      }
    });
  };

  return (
    <div className="message">
      {/* ...existing message content... */}
      
      {/* Show report button on hover or in context menu */}
      <button 
        className="report-message-button" 
        onClick={handleReportMessage}
        aria-label="Report message"
      >
        Report
      </button>
    </div>
  );
}


// ============================================================
// EXAMPLE 6: Report with Query Parameters (Alternative)
// ============================================================

function ReportLink({ type, id, userId }) {
  const reportUrl = `/report?type=${type}&id=${id}&userId=${userId}`;
  
  return (
    <Link to={reportUrl} className="report-link">
      Report
    </Link>
  );
}


// ============================================================
// EXAMPLE 7: Conditional Report Button (Don't report own content)
// ============================================================

function PostActions({ post, currentUser }) {
  const navigate = useNavigate();

  const canReport = currentUser && currentUser.id !== post.user_id;

  const handleReport = () => {
    navigate('/report', {
      state: {
        reportTarget: {
          type: 'post',
          id: post.id,
          contentOwnerId: post.user_id
        }
      }
    });
  };

  return (
    <div className="post-actions">
      {/* ...other actions... */}
      
      {canReport && (
        <button className="action-report" onClick={handleReport}>
          Report
        </button>
      )}
    </div>
  );
}


// ============================================================
// EXAMPLE 8: Report Button with Icon
// ============================================================

function ReportButton({ target, user }) {
  const navigate = useNavigate();

  const handleReport = () => {
    if (!user) {
      alert('Please log in to report content');
      return;
    }

    navigate('/report', {
      state: { reportTarget: target }
    });
  };

  return (
    <button 
      className="icon-button report-button" 
      onClick={handleReport}
      aria-label={`Report ${target.type}`}
      title="Report this content"
    >
      <svg className="report-icon" viewBox="0 0 24 24">
        <path d="M12 2L1 21h22L12 2zm0 3.5L19.5 19h-15L12 5.5zM11 10v4h2v-4h-2zm0 5v2h2v-2h-2z"/>
      </svg>
    </button>
  );
}


// ============================================================
// CSS EXAMPLES FOR REPORT BUTTONS
// ============================================================

/*
// Basic Report Button
.report-button {
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  color: #657786;
  cursor: pointer;
  transition: all 0.2s ease;
}

.report-button:hover {
  background: #fff5f5;
  border-color: #e0245e;
  color: #e0245e;
}

// Icon Report Button
.icon-button.report-button {
  padding: 0.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.icon-button.report-button:hover {
  opacity: 1;
}

.report-icon {
  width: 20px;
  height: 20px;
  fill: currentColor;
}

// Menu Item Report
.menu-item.report {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  color: #e0245e;
  cursor: pointer;
}

.menu-item.report:hover {
  background: #fff5f5;
}
*/
