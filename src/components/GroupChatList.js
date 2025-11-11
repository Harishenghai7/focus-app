import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './GroupChatList.css';

export default function GroupChatList({ user }) {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    fetchGroups();
    subscribeToGroupUpdates();
  }, [user]);

  const fetchGroups = async () => {
    try {
      // Fetch groups the user is a member of
      const { data: memberData, error: memberError } = await supabase
        .from('group_members')
        .select(`
          *,
          group:group_id(
            id,
            name,
            avatar_url,
            updated_at
          )
        `)
        .eq('user_id', user.id)
        .order('group_id');

      if (memberError) throw memberError;

      // Fetch last message for each group
      const groupsWithMessages = await Promise.all(
        (memberData || []).map(async (member) => {
          const { data: lastMessage } = await supabase
            .from('group_messages')
            .select(`
              content,
              created_at,
              sender:sender_id(username)
            `)
            .eq('group_id', member.group.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...member.group,
            unread_count: member.unread_count || 0,
            is_muted: member.muted_until && new Date(member.muted_until) > new Date(),
            last_message: lastMessage?.content || 'No messages yet',
            last_message_time: lastMessage?.created_at || member.group.updated_at,
            last_sender: lastMessage?.sender?.username
          };
        })
      );

      // Sort by last message time
      groupsWithMessages.sort((a, b) => 
        new Date(b.last_message_time) - new Date(a.last_message_time)
      );

      setGroups(groupsWithMessages);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToGroupUpdates = () => {
    // Subscribe to new messages in user's groups
    const subscription = supabase
      .channel('group_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages'
        },
        () => {
          // Refresh groups when new message arrives
          fetchGroups();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'group_members',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          // Refresh when member data changes (unread count, mute status)
          fetchGroups();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="group-chat-list-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (groups.length === 0) {
    return null;
  }

  return (
    <div className="group-chat-list">
      <h3 className="group-chat-list-title">Groups</h3>
      {groups.map((group) => (
        <motion.div
          key={group.id}
          className="group-chat-item"
          onClick={() => navigate(`/group/${group.id}`)}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ x: 4 }}
        >
          <div className="group-avatar">
            <img 
              src={group.avatar_url || `https://ui-avatars.com/api/?name=${group.name}`} 
              alt={group.name} 
            />
            {group.unread_count > 0 && !group.is_muted && (
              <span className="unread-badge">{group.unread_count}</span>
            )}
            {group.is_muted && (
              <span className="muted-badge">🔕</span>
            )}
          </div>
          
          <div className="group-info">
            <div className="group-header">
              <h4>{group.name}</h4>
              <span className="group-time">{formatTime(group.last_message_time)}</span>
            </div>
            <p className={`last-message ${group.unread_count > 0 && !group.is_muted ? 'unread' : ''}`}>
              {group.last_sender && `${group.last_sender}: `}
              {group.last_message}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
