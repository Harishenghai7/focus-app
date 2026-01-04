import React from 'react';
import { useTeenCare } from '../../context/TeenCareContext';
import { toast } from 'react-toastify';
import Toggle from '../shared/Toggle';
import Select from '../shared/Select';
import ContactRestrictions from './ContactRestrictions';
import AgeVerification from './AgeVerification';
import PrivacyControls from './PrivacyControls';
import { FaShieldAlt, FaLock, FaCommentSlash, FaMapMarkerAlt, FaDownload, FaFilter, FaUserSecret } from 'react-icons/fa';
import styles from './TeenSafetySettingsMain.module.css';

const TeenSafetySettingsMain = ({ settings }) => {
  const { updateSafetySettings } = useTeenCare();
  if (!settings) return <div>Loading...</div>;

  const handleUpdate = async (update) => {
    try {
      await updateSafetySettings(update);
      toast.success('Settings updated!');
    } catch (e) {
      toast.error('Failed to update settings: ' + e.message);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}><FaShieldAlt /> Teen Safety Settings</h1>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>General Safety</h2>
        <div className={styles.toggleGroup}>
          <Toggle
            label={<span><FaFilter /> Strict Content Filter</span>}
            checked={settings.strict_content_filter}
            onChange={v => handleUpdate({ strict_content_filter: v })}
          />
          <Toggle
            label={<span><FaLock /> Private Account</span>}
            checked={settings.private_account}
            onChange={v => handleUpdate({ private_account: v })}
          />
          <Select
            label={<span><FaCommentSlash /> DM Restrictions</span>}
            value={settings.dm_restrictions}
            options={[
              { value: 'everyone', label: 'Everyone' },
              { value: 'followers_only', label: 'Followers Only' },
              { value: 'approved_only', label: 'Approved Contacts Only' },
              { value: 'nobody', label: 'No one' }
            ]}
            onChange={v => handleUpdate({ dm_restrictions: v })}
          />
          <Toggle
            label={<span><FaMapMarkerAlt /> Location Sharing</span>}
            checked={settings.location_sharing}
            onChange={v => handleUpdate({ location_sharing: v })}
          />
          <Toggle
            label={<span><FaDownload /> Download Prevention</span>}
            checked={settings.download_prevention}
            onChange={v => handleUpdate({ download_prevention: v })}
          />
          <Toggle
            label={<span><FaFilter /> Comment Filtering</span>}
            checked={settings.comment_filter}
            onChange={v => handleUpdate({ comment_filter: v })}
          />
          <Toggle
            label={<span><FaUserSecret /> Stranger Message Blocking</span>}
            checked={settings.stranger_blocking}
            onChange={v => handleUpdate({ stranger_blocking: v })}
          />
        </div>
      </div>

      <div className={styles.card}>
        <ContactRestrictions settings={settings} />
      </div>

      <div className={styles.card}>
        <AgeVerification userId={settings.teen_id} />
      </div>

      <div className={styles.card}>
        <PrivacyControls userAge={settings.birth_date ? (new Date().getFullYear() - new Date(settings.birth_date).getFullYear()) : null} myGuardians={settings.myGuardians} />
      </div>
    </div>
  );
};
export default TeenSafetySettingsMain;
