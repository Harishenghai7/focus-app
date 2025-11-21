import React from 'react';
import { motion } from 'framer-motion';
import './ModerationQueue.css';

/**
 * ModerationQueue Component
 * Displays pending reports for moderation
 */
const ModerationQueue = ({ reports, onResolve, onDismiss }) => {
  if (!reports || reports.length === 0) {
    return (
      <div className="moderation-queue empty">
        <div className="empty-state">
          <span className="empty-icon">✅</span>
          <h3>No Pending Reports</h3>
          <p>All reports have been reviewed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="moderation-queue">
      <div className="queue-header">
        <h3>Content Moderation Queue</h3>
        <span className="queue-count">{reports.length} pending</span>
      </div>

      <div className="queue-list">
        {reports.map((report) => (
          <motion.div
            key={report.id}
            className="queue-item"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
          >
            <div className="queue-item-header">
              <div className="report-type-badge">
                <span className={`badge badge-${report.report_type}`}>
                  {report.report_type}
                </span>
                <span className="report-date">
                  {new Date(report.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="queue-actions">
                <button 
                  className="btn-resolve"
                  onClick={() => onResolve(report.id)}
                  title="Mark as resolved"
                >
                  ✓ Resolve
                </button>
                <button 
                  className="btn-dismiss"
                  onClick={() => onDismiss(report.id)}
                  title="Dismiss report"
                >
                  ✕ Dismiss
                </button>
              </div>
            </div>

            <div className="queue-item-content">
              <div className="report-info">
                <div className="info-row">
                  <span className="label">Reporter:</span>
                  <div className="user-info">
                    <img 
                      src={report.reporter?.avatar_url || `https://ui-avatars.com/api/?name=${report.reporter?.username}`}
                      alt={report.reporter?.username}
                      className="user-avatar-small"
                    />
                    <span className="username">@{report.reporter?.username}</span>
                  </div>
                </div>

                <div className="info-row">
                  <span className="label">Reported User:</span>
                  <div className="user-info">
                    <img 
                      src={report.reported_user?.avatar_url || `https://ui-avatars.com/api/?name=${report.reported_user?.username}`}
                      alt={report.reported_user?.username}
                      className="user-avatar-small"
                    />
                    <span className="username">@{report.reported_user?.username}</span>
                  </div>
                </div>

                <div className="info-row">
                  <span className="label">Reason:</span>
                  <span className="reason">{report.reason}</span>
                </div>

                {report.description && (
                  <div className="info-row">
                    <span className="label">Details:</span>
                    <p className="description">{report.description}</p>
                  </div>
                )}
              </div>

              {report.reported_post && (
                <div className="reported-content-preview">
                  <h4>Reported Content:</h4>
                  <div className="content-preview">
                    {report.reported_post.image_url && (
                      <img 
                        src={report.reported_post.image_url} 
                        alt="Reported content"
                        className="preview-image"
                      />
                    )}
                    {report.reported_post.caption && (
                      <p className="preview-caption">{report.reported_post.caption}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ModerationQueue;
