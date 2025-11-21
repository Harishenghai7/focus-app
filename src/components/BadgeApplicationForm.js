import React, { useState, useCallback } from 'react';
import supabase from '../lib/supabase';

/**
 * BadgeApplicationForm
 * Multi-step application form for official badges.
 * Handles: brand, business, media_press, musician, athlete, public_figure
 */

const OFFICIAL_BADGE_TYPES = ['brand','business','media_press','musician','athlete','public_figure'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ['image/png','image/jpeg','application/pdf'];

// Field configuration per badge type (step 1: core info; step 2: documents/links)
const BADGE_FORM_CONFIG = {
  brand: {
    label: 'Brand Badge',
    step1: [
      { name: 'company_name', label: 'Company Name', required: true },
      { name: 'registration_number', label: 'Registration Number', required: true },
      { name: 'website_url', label: 'Website URL', required: true, type: 'url' },
      { name: 'official_email', label: 'Official Email', required: true, type: 'email', help: 'Must match website domain' },
      { name: 'social_links', label: 'Social Media Links (optional)', type: 'textarea', required: false }
    ],
    step2: [
      { name: 'registration_certificate', label: 'Registration Certificate (PDF/Image)', required: true, type: 'file' }
    ]
  },
  business: {
    label: 'Business Badge',
    step1: [
      { name: 'business_name', label: 'Business Name', required: true },
      { name: 'gst_or_tax_id', label: 'GST / Tax ID', required: true },
      { name: 'physical_address', label: 'Physical Address', required: true },
      { name: 'phone_number', label: 'Phone Number', required: true, type: 'tel' }
    ],
    step2: [
      { name: 'registration_certificate', label: 'Business Registration Certificate', required: true, type: 'file' }
    ]
  },
  media_press: {
    label: 'Media / Press Badge',
    step1: [
      { name: 'outlet_name', label: 'Media Outlet Name', required: true },
      { name: 'portfolio_links', label: 'Portfolio / Articles (links)', type: 'textarea', required: true }
    ],
    step2: [
      { name: 'press_credentials', label: 'Press Credentials', required: true, type: 'file' },
      { name: 'journalist_id_card', label: 'Journalist ID Card', required: true, type: 'file' }
    ]
  },
  musician: {
    label: 'Musician Badge',
    step1: [
      { name: 'artist_name', label: 'Artist Name', required: true },
      { name: 'profile_link', label: 'Spotify/Apple Music Profile Link', required: true, type: 'url' },
      { name: 'release_links', label: 'Released Music Links', type: 'textarea', required: false }
    ],
    step2: [
      { name: 'listener_count_screenshot', label: 'Monthly Listener Count Screenshot', required: true, type: 'file' }
    ]
  },
  athlete: {
    label: 'Athlete Badge',
    step1: [
      { name: 'sport', label: 'Sport', required: true },
      { name: 'team_club', label: 'Team / Club', required: true },
      { name: 'federation_id', label: 'Federation Membership ID', required: true }
    ],
    step2: [
      { name: 'competition_proof', label: 'Competition Participation Proof', required: true, type: 'file' }
    ]
  },
  public_figure: {
    label: 'Public Figure Badge',
    step1: [
      { name: 'field', label: 'Field (Entertainment, Politics, etc.)', required: true },
      { name: 'platform_links', label: 'Other Platform Links (10K+ followers)', type: 'textarea', required: true },
      { name: 'wikipedia_url', label: 'Wikipedia Page URL', type: 'url', required: false },
      { name: 'media_coverage_links', label: 'Media Coverage Links', type: 'textarea', required: true }
    ],
    step2: [
      { name: 'supporting_docs', label: 'Supporting Documents (optional)', required: false, type: 'file' }
    ]
  }
};

function BadgeApplicationForm({ userId }) {
  const [badgeType, setBadgeType] = useState('brand');
  const [step, setStep] = useState(1); // 1=info, 2=documents, 3=review
  const [formData, setFormData] = useState({});
  const [files, setFiles] = useState({}); // fieldName -> File
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [submittedInfo, setSubmittedInfo] = useState(null);
  const [agree, setAgree] = useState(false);

  const config = BADGE_FORM_CONFIG[badgeType];

  const updateField = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const onFileDrop = useCallback((e, fieldName) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(fieldName, file);
  }, []);

  function handleFile(fieldName, file) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setErrors(prev => ({ ...prev, [fieldName]: 'Invalid file type' }));
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setErrors(prev => ({ ...prev, [fieldName]: 'File exceeds 5MB' }));
      return;
    }
    setErrors(prev => ({ ...prev, [fieldName]: null }));
    setFiles(prev => ({ ...prev, [fieldName]: file }));
  }

  function validateStep() {
    const stepFields = step === 1 ? config.step1 : step === 2 ? config.step2 : [];
    const newErrors = {};
    stepFields.forEach(f => {
      if (f.required) {
        if (f.type === 'file') {
          if (!files[f.name]) newErrors[f.name] = 'Required document missing';
        } else if (!formData[f.name]) {
          newErrors[f.name] = 'Required field';
        }
      }
      if (f.type === 'url' && formData[f.name]) {
        try { new URL(formData[f.name]); } catch { newErrors[f.name] = 'Invalid URL'; }
      }
      if (f.type === 'email' && formData[f.name]) {
        const email = formData[f.name];
        const valid = /.+@.+\..+/.test(email);
        if (!valid) newErrors[f.name] = 'Invalid email';
        if (f.name === 'official_email' && formData.website_url) {
          try {
            const domain = new URL(formData.website_url).hostname.replace(/^www\./,'');
            if (!email.endsWith(domain)) newErrors[f.name] = 'Email domain mismatch';
          } catch {/* ignore */}
        }
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function saveDraft() {
    if (!userId) return;
    setDraftSaved(false);
    const payload = {
      user_id: userId,
      badge_type: badgeType,
      data: formData,
      step,
      status: 'draft'
    };
    const { error } = await supabase.from('badge_applications').upsert(payload);
    if (!error) setDraftSaved(true);
  }

  async function submitApplication() {
    if (!validateStep() || !agree) return;
    setSubmitting(true);
    // Upload files to storage bucket
    const uploaded = {};
    for (const [fieldName, file] of Object.entries(files)) {
      const path = `${userId}/${badgeType}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from('badge-docs').upload(path, file);
      if (uploadError) {
        setErrors(prev => ({ ...prev, [fieldName]: 'Upload failed' }));
      } else {
        uploaded[fieldName] = path;
      }
    }
    const trackingId = crypto.randomUUID();
    const { error } = await supabase.from('badge_applications').insert({
      user_id: userId,
      badge_type: badgeType,
      data: formData,
      files: uploaded,
      status: 'submitted',
      tracking_id: trackingId
    });
    setSubmitting(false);
    if (!error) {
      setSubmittedInfo({ trackingId, reviewEta: '3-5 business days' });
      // Optionally trigger email via RPC / Edge Function (placeholder)
      // await supabase.functions.invoke('sendApplicationEmail', { body: { trackingId, badgeType, userId } });
    } else {
      setErrors(prev => ({ ...prev, submit: 'Submission failed. Please retry.' }));
    }
  }

  function next() { if (step < 3 && validateStep()) setStep(step + 1); }
  function prev() { if (step > 1) setStep(step - 1); }

  if (submittedInfo) {
    return (
      <div className="badge-app-form success">
        <h2>Application Submitted</h2>
        <p>Your application for <strong>{config.label}</strong> was received.</p>
        <p>Tracking ID: <code>{submittedInfo.trackingId}</code></p>
        <p>Estimated review time: {submittedInfo.reviewEta}</p>
        <p>A confirmation email has been sent.</p>
        <button onClick={()=> { setSubmittedInfo(null); setStep(1); setFormData({}); setFiles({}); }}>Submit Another</button>
      </div>
    );
  }

  return (
    <div className="badge-app-form">
      <h2>Official Badge Application</h2>
      <div className="badge-type-select">
        {OFFICIAL_BADGE_TYPES.map(bt => (
          <button key={bt} className={bt===badgeType? 'active':''} onClick={()=> { setBadgeType(bt); setStep(1); setFormData({}); setFiles({}); setErrors({}); }}>
            {BADGE_FORM_CONFIG[bt].label}
          </button>
        ))}
      </div>
      <div className="progress-indicator">Step {step} of 3</div>

      {step === 1 && (
        <div className="form-section">
          {config.step1.map(field => renderField(field, formData, updateField, errors))}
        </div>
      )}
      {step === 2 && (
        <div className="form-section">
          {config.step2.map(field => field.type === 'file' ? renderFileField(field, files, handleFile, onFileDrop, errors) : renderField(field, formData, updateField, errors))}
        </div>
      )}
      {step === 3 && (
        <div className="review-section">
          <h3>Review Your Application</h3>
          <ul className="review-list">
            {Object.entries(formData).map(([k,v]) => (
              <li key={k}><strong>{k}:</strong> {String(v).slice(0,200)}</li>
            ))}
          </ul>
          <div className="review-files">
            {Object.entries(files).map(([k,f]) => (
              <div key={k}>{k}: {f.name}</div>
            ))}
          </div>
          <label className="terms"><input type="checkbox" checked={agree} onChange={e=> setAgree(e.target.checked)} /> I agree to the terms and conditions.</label>
          {(!agree) && <div className="error">You must agree before submitting.</div>}
        </div>
      )}

      <div className="actions">
        {errors.submit && <div className="error">{errors.submit}</div>}
        <button disabled={step===1} onClick={prev}>Back</button>
        {step < 3 && <button onClick={next}>Next</button>}
        {step < 3 && <button type="button" onClick={saveDraft}>Save Draft</button>}
        {step === 3 && <button disabled={submitting || !agree} onClick={submitApplication}>{submitting? 'Submitting...':'Submit Application'}</button>}
        {draftSaved && <span className="draft-saved">Draft saved!</span>}
      </div>

      <style>{`
        .badge-app-form { background:#0f172a; color:#f1f5f9; padding:1.2rem; border:1px solid #1e293b; border-radius:16px; max-width:800px; margin:0 auto; font-family:system-ui, sans-serif; }
        .badge-app-form h2 { margin:0 0 1rem; font-size:1.25rem; }
        .badge-type-select { display:flex; flex-wrap:wrap; gap:.5rem; margin-bottom:.75rem; }
        .badge-type-select button { background:#1e293b; color:#fff; border:1px solid #334155; padding:.45rem .75rem; font-size:.7rem; border-radius:8px; cursor:pointer; }
        .badge-type-select button.active { background:#3b82f6; border-color:#3b82f6; }
        .progress-indicator { font-size:.75rem; margin-bottom:.6rem; opacity:.8; }
        .form-field { display:flex; flex-direction:column; gap:.3rem; margin-bottom:.8rem; }
        .form-field label { font-size:.7rem; font-weight:600; display:flex; justify-content:space-between; align-items:center; }
        .form-field input[type=text],
        .form-field input[type=url],
        .form-field input[type=email],
        .form-field input[type=tel],
        .form-field textarea { background:#1e293b; border:1px solid #334155; color:#fff; padding:.55rem .6rem; border-radius:8px; font-size:.75rem; resize:vertical; }
        .form-field textarea { min-height:90px; }
        .help { font-size:.55rem; opacity:.6; margin-left:.4rem; }
        .error { color:#f87171; font-size:.6rem; }
        .file-drop { border:2px dashed #334155; padding:1rem; text-align:center; border-radius:12px; font-size:.65rem; cursor:pointer; background:#1e293b; position:relative; }
        .file-drop.drag { background:#3b82f6; }
        .file-info { margin-top:.4rem; font-size:.6rem; opacity:.85; }
        .actions { display:flex; gap:.6rem; align-items:center; flex-wrap:wrap; margin-top:1rem; }
        .actions button { background:#3b82f6; color:#fff; border:none; padding:.6rem .9rem; font-size:.7rem; border-radius:8px; cursor:pointer; transition:background .2s; }
        .actions button[disabled] { opacity:.5; cursor:not-allowed; }
        .actions button:hover:not([disabled]) { background:#2563eb; }
        .draft-saved { font-size:.6rem; color:#22c55e; }
        .review-section { background:#1e293b; padding:.8rem .9rem; border-radius:12px; }
        .review-list { list-style:none; padding:0; margin:0 0 .6rem; display:flex; flex-direction:column; gap:.3rem; font-size:.6rem; }
        .review-files { font-size:.6rem; display:flex; flex-direction:column; gap:.25rem; margin-bottom:.6rem; }
        .terms { font-size:.6rem; display:flex; align-items:center; gap:.4rem; margin-top:.4rem; }
        @media (max-width:640px){ .badge-app-form { padding:.9rem; } .actions button { flex:1 1 auto; } }
      `}</style>
    </div>
  );
}

function renderField(field, formData, updateField, errors) {
  const value = formData[field.name] || '';
  return (
    <div className="form-field" key={field.name}>
      <label htmlFor={field.name}>{field.label}{field.required && <span>*</span>} {field.help && <span className="help" title={field.help}>?</span>}</label>
      {field.type === 'textarea' ? (
        <textarea id={field.name} value={value} onChange={e=> updateField(field.name, e.target.value)} />
      ) : (
        <input id={field.name} type={field.type || 'text'} value={value} onChange={e=> updateField(field.name, e.target.value)} />
      )}
      {errors[field.name] && <div className="error">{errors[field.name]}</div>}
    </div>
  );
}

function renderFileField(field, files, handleFile, onFileDrop, errors) {
  const file = files[field.name];
  return (
    <div className="form-field" key={field.name}>
      <label>{field.label}{field.required && <span>*</span>}</label>
      <div
        className={`file-drop`}
        onDragOver={e=> { e.preventDefault(); e.currentTarget.classList.add('drag'); }}
        onDragLeave={e=> { e.preventDefault(); e.currentTarget.classList.remove('drag'); }}
        onDrop={e=> { e.currentTarget.classList.remove('drag'); onFileDrop(e, field.name); }}
        onClick={()=> {
          const input = document.createElement('input');
            input.type='file'; input.accept=ACCEPTED_TYPES.join(',');
            input.onchange = (ev)=> {
              const f = ev.target.files[0];
              if (f) handleFile(field.name, f);
            };
            input.click();
        }}
      >
        {file ? <><strong>{file.name}</strong><div className="file-info">{(file.size/1024/1024).toFixed(2)} MB</div></> : 'Drag & Drop or Click to Upload'}
        <div className="file-info">Accepted: PDF / PNG / JPG up to 5MB</div>
      </div>
      {errors[field.name] && <div className="error">{errors[field.name]}</div>}
    </div>
  );
}

export default BadgeApplicationForm;
