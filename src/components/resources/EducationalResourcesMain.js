import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import styles from './EducationalResourcesMain.module.css';
import { FaExternalLinkAlt, FaPhoneAlt } from 'react-icons/fa';

const EducationalResourcesMain = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResources = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('safety_resources')
        .select('*')
        .eq('published', true)
        .order('category', { ascending: true });

      if (error) {
        setError(error.message);
      } else {
        setResources(data || []);
      }
      setLoading(false);
    };
    fetchResources();
  }, []);

  if (loading) return <div className={styles.loading}>Loading resources...</div>;
  if (error) return <div className={styles.error}>Error loading resources: {error}</div>;

  const parentsResources = resources.filter(r => r.audience === 'parent' || r.audience === 'both');
  const teenResources = resources.filter(r => r.audience === 'teen' || r.audience === 'both');
  const crisisResources = resources.filter(r => r.is_crisis_resource);

  const ResourceCard = ({ resource }) => (
    <div className={styles.card}>
      <h3 className={styles.cardTitle}>{resource.title}</h3>
      <p className={styles.cardDescription}>{resource.description || 'No description available.'}</p>
      <div className={styles.cardFooter}>
        <span className={styles.categoryBadge}>{resource.category}</span>
        {resource.url && (
          <a href={resource.url} target="_blank" rel="noopener noreferrer" className={styles.linkButton}>
            Read More <FaExternalLinkAlt size={12} />
          </a>
        )}
      </div>
    </div>
  );

  const CrisisCard = ({ resource }) => (
    <div className={styles.card} style={{ borderColor: 'var(--error-alpha-30)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <h3 className={styles.cardTitle}>{resource.title}</h3>
        <span className={styles.crisisBadge}>CRISIS SUPPORT</span>
      </div>
      <p className={styles.cardDescription}>{resource.description}</p>
      <div className={styles.cardFooter}>
        {resource.crisis_hotline && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--error)', fontWeight: 'bold' }}>
            <FaPhoneAlt /> {resource.crisis_hotline}
          </div>
        )}
        {resource.url && (
          <a href={resource.url} target="_blank" rel="noopener noreferrer" className={styles.linkButton} style={{ color: 'var(--error)' }}>
            Get Help <FaExternalLinkAlt size={12} />
          </a>
        )}
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Educational Resources</h1>
        <p className={styles.subtitle}>Guides, tips, and support for safe digital experiences</p>
      </div>

      {crisisResources.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle} style={{ color: 'var(--error)' }}>Crisis Resources</h2>
          <div className={styles.grid}>
            {crisisResources.map(r => <CrisisCard key={r.id} resource={r} />)}
          </div>
        </div>
      )}

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>For Parents & Guardians</h2>
        <div className={styles.grid}>
          {parentsResources.length > 0 ? (
            parentsResources.map(r => <ResourceCard key={r.id} resource={r} />)
          ) : (
            <p style={{ color: 'var(--text-secondary)' }}>No resources found.</p>
          )}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>For Teens</h2>
        <div className={styles.grid}>
          {teenResources.length > 0 ? (
            teenResources.map(r => <ResourceCard key={r.id} resource={r} />)
          ) : (
            <p style={{ color: 'var(--text-secondary)' }}>No resources found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default EducationalResourcesMain;

