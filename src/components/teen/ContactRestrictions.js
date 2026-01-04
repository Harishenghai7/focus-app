import React from 'react';
import { useTeenCare } from '../../context/TeenCareContext';
import Select from '../shared/Select';
import styles from './ContactRestrictions.module.css';

const ContactRestrictions = ({ settings }) => {
  const { updateSafetySettings } = useTeenCare();
  if (!settings) return null;
  return (
    <div>
      <h2 className={styles.title}>Contact Restrictions</h2>
      <div className={styles.group}>
        <Select
          label="Who can message you?"
          value={settings.who_can_message}
          options={[
            { value: 'everyone', label: 'Everyone' },
            { value: 'followers_only', label: 'Followers Only' },
            { value: 'approved_only', label: 'Approved Contacts Only' },
            { value: 'nobody', label: 'No one' }
          ]}
          onChange={v => updateSafetySettings({ who_can_message: v })}
        />
        <Select
          label="Who can comment on your posts?"
          value={settings.who_can_comment}
          options={[
            { value: 'everyone', label: 'Everyone' },
            { value: 'followers_only', label: 'Followers Only' },
            { value: 'off', label: 'Off' }
          ]}
          onChange={v => updateSafetySettings({ who_can_comment: v })}
        />
        <Select
          label="Who can mention/tag you?"
          value={settings.who_can_mention}
          options={[
            { value: 'everyone', label: 'Everyone' },
            { value: 'followers_only', label: 'Followers Only' },
            { value: 'manual_approval', label: 'Manual Approval' }
          ]}
          onChange={v => updateSafetySettings({ who_can_mention: v })}
        />
        <Select
          label="Group Chat Invitations"
          value={settings.group_chat_approval ? 'approval_required' : 'open'}
          options={[
            { value: 'approval_required', label: 'Invitation Approval Required' },
            { value: 'open', label: 'Anyone Can Add' }
          ]}
          onChange={v => updateSafetySettings({ group_chat_approval: v === 'approval_required' })}
        />
      </div>
    </div>
  );
};
export default ContactRestrictions;
