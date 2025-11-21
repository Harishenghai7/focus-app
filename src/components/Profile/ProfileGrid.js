import React from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import ProfileTile from './ProfileTile';
import EmptyState from '../EmptyState';
import LoadingFallback from '../LoadingFallback';
import './ProfileGrid.css';

/**
 * ProfileGrid - Responsive grid gallery for profile content with lazyload
 */
const ProfileGrid = ({ 
  items, 
  loading, 
  emptyMessage,
  emptyIcon,
  emptyAction,
  onItemClick,
  contentType = 'post'
}) => {
  if (loading) {
    return <LoadingFallback type="grid" count={9} />;
  }

  if (!items || items.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon || '📭'}
        message={emptyMessage || 'No content yet'}
        action={emptyAction}
      />
    );
  }

  return (
    <motion.div
      className="profile-grid"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {items.map((item, index) => (
        <ProfileTile
          key={item.id || index}
          item={item}
          index={index}
          onClick={() => onItemClick(item, index)}
          contentType={contentType}
        />
      ))}
    </motion.div>
  );
};

ProfileGrid.propTypes = {
  items: PropTypes.array,
  loading: PropTypes.bool,
  emptyMessage: PropTypes.string,
  emptyIcon: PropTypes.string,
  emptyAction: PropTypes.node,
  onItemClick: PropTypes.func.isRequired,
  contentType: PropTypes.oneOf(['post', 'boltz', 'flash', 'tagged', 'saved'])
};

export default ProfileGrid;
