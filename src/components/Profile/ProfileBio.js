import React from 'react';
import { linkifyText } from '../../utils/linkifyText';
import Icon from '../ui/Icon';
import styles from './ProfileBio.module.css';

const ProfileBio = ({ fullName, bio, website, location }) => {
    return (
        <div className={styles.bioSection}>
            {fullName && <h3 className={styles.fullName}>{fullName}</h3>}

            {bio && (
                <p className={styles.bio}>
                    {linkifyText(bio, styles.link)}
                </p>
            )}

            {website && (
                <a
                    href={website.startsWith('http') ? website : `https://${website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.website}
                >
                    <Icon name="Link" size={14} />
                    <span>{website.replace(/^https?:\/\//, '')}</span>
                </a>
            )}

            {location && (
                <div className={styles.location}>
                    <Icon name="MapPin" size={14} />
                    <span>{location}</span>
                </div>
            )}
        </div>
    );
};

export default ProfileBio;
