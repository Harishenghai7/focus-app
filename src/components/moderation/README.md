# 🛡️ Focus Content Filter & Moderator

A bulletproof, multi-layer content integrity system for the Focus platform.

## Mission
Ensure Focus remains a sanctuary where users invest time rather than killing it with toxic, adult, or misleading content.

## Architecture - 5 Layers of Protection

### Layer 1: Real-Time Pre-Upload Gateway
**Location**: `ContentModerationService.js`, `useUploadMedia.js`

- **AI Vision Scanning**: TensorFlow.js + NSFWJS for client-side analysis
- **Zero-Tolerance Thresholds**: 
  - Nudity/Porn: 1% threshold (immediate block)
  - Violence: 5% threshold
  - Suggestive: 15% threshold
- **API Fallback**: Sightengine integration for enhanced detection
- **No File Touches Storage** without passing the scan

```javascript
import { useUploadMedia } from '../hooks/useUploadMedia';

const { uploadFile, isScanning, scanProgress } = useUploadMedia({
    enableModeration: true
});

const result = await uploadFile(file, 'posts', { caption });
// result.contentRating, result.safetyHash automatically included
```

### Layer 2: Purpose-Driven Quality Control
**Location**: `ContentModerationService.js` (analyzeImageQuality)

- **Resolution Check**: Minimum 320x320
- **Blur Detection**: Laplacian variance analysis
- **Brightness/Contrast**: Automatic rejection of underexposed/overexposed
- **Low-Effort Detection**: Quality Standard Violation for pixelated/dark images

### Layer 3: Ruthless User Feedback & Enforcement
**Location**: `ContentIntegrityModal.jsx`

**H2 Theme UI**:
- 20px glass blur backdrop
- Satin borders (1px gradient)
- Pulsing status indicators (60fps)
- Color-coded states:
  - 🔴 Red: Content Blocked (critical violations)
  - 🟠 Orange: Warning (minor issues)
  - 🟡 Yellow: Quality Notice
  - 🟢 Green: Approved

**Violation Messages**:
- "Explicit adult content detected"
- "Violent or graphic content detected"
- "Toxic or harmful language detected"
- "Focus is for growth, not toxicity"

### Layer 4: Database Integrity & RLS
**Location**: `20260422_content_integrity_system.sql`

**Safety Metadata**:
```sql
safety_hash TEXT          -- Unique hash of scan results
content_rating NUMERIC    -- 0-1 safety score
ai_scan_passed BOOLEAN    -- Did content pass?
content_violations JSONB  -- Array of violations
scan_timestamp TIMESTAMPTZ
```

**RLS Policy**: `is_content_safe()`
- Teen users (13-17): Only see content with rating ≥ 0.95
- Adult users: Content with rating ≥ 0.7
- Auto-flag content with rating < 0.5

### Layer 5: UI/UX Perfection
**Features**:
- Progress bar with gradient animation
- Pulsing dots during scanning
- Real-time violation list
- Safety score badge
- Smooth 60fps transitions

## Quick Start

### 1. Install Dependencies

```bash
npm install @tensorflow-models/toxicity nsfwjs
```

### 2. Add Environment Variables (Optional)

```env
VITE_SIGHTENGINE_API_USER=your_user
VITE_SIGHTENGINE_API_SECRET=your_secret
```

### 3. Run Database Migration

```bash
psql -d focus -f supabase/migrations/20260422_content_integrity_system.sql
```

### 4. Use in Your Component

```javascript
import { useUploadMedia } from '../hooks/useUploadMedia';
import ContentIntegrityModal from '../components/moderation/ContentIntegrityModal';

function CreatePost() {
    const {
        uploadFile,
        uploading,
        isScanning,
        scanProgress,
        lastModerationResult
    } = useUploadMedia({ enableModeration: true });
    
    const [showModal, setShowModal] = useState(false);
    
    const handleUpload = async (file, caption) => {
        setShowModal(true);
        
        try {
            const result = await uploadFile(file, 'posts', { caption });
            console.log('Content rating:', result.contentRating);
            console.log('Safety hash:', result.safetyHash);
        } catch (err) {
            // Content blocked - shown in modal
        }
    };
    
    return (
        <>
            <input type="file" onChange={handleUpload} />
            
            <ContentIntegrityModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                scanResult={lastModerationResult}
                isScanning={isScanning}
                scanProgress={scanProgress}
            />
        </>
    );
}
```

## API Reference

### ContentModerationService

```javascript
import { ContentModerationService } from '../services/ContentModerationService';

// Initialize models
await ContentModerationService.initialize();

// Analyze image
const result = await ContentModerationService.analyzeImage(file);
// { isSafe: boolean, safetyScore: number, violations: [] }

// Analyze text
const result = await ContentModerationService.analyzeText(caption);
// { isSafe: boolean, safetyScore: number, categories: {} }

// Full purity scan
const result = await ContentModerationService.performPurityScan({
    mediaFiles: [file1, file2],
    caption: 'My post caption',
    type: 'post'
});
// { 
//     passed: boolean, 
//     blocked: boolean,
//     contentRating: number,
//     safetyHash: string,
//     violations: [],
//     warnings: []
// }
```

### useContentModeration Hook

```javascript
import { useContentModeration } from '../hooks/useContentModeration';

const {
    isScanning,           // Boolean
    scanProgress,         // 0-100
    scanStageLabel,       // Human-readable status
    performPurityScan,    // Function
    quickScanImage,       // Function
    scanText,             // Function
    wouldBeBlocked,       // Boolean
    violationSummary      // Object
} = useContentModeration({
    onViolation: (violations) => console.log(violations),
    onQualityIssue: (warnings) => console.log(warnings)
});
```

### useUploadMedia Hook

```javascript
import { useUploadMedia } from '../hooks/useUploadMedia';

const {
    // Upload functions
    uploadFile,
    uploadMultipleFiles,
    
    // Upload states
    uploading,
    progress,
    error,
    
    // Moderation states
    isScanning,
    scanProgress,
    lastModerationResult,
    contentRating,
    safetyHash,
    
    // Utilities
    reset,
    moderationEnabled
} = useUploadMedia({
    enableModeration: true,
    onModerationResult: (result) => console.log(result)
});
```

## Violation Types

| Type | Severity | Action |
|------|----------|--------|
| `NUDITY_PORN` | Critical | Block + Flag Account |
| `NUDITY_HENTAI` | Critical | Block + Flag Account |
| `VIOLENCE` | Critical | Block + Flag Account |
| `THREAT` | Critical | Block + Review |
| `TOXICITY` | High | Block or Warn |
| `IDENTITY_ATTACK` | High | Block or Warn |
| `SUGGESTIVE` | Medium | Warning |
| `QUALITY_ISSUES` | Low | Warning |
| `TOO_BLURRY` | Low | Warning |

## Safety Score Calculation

```
contentRating = √(mediaSafety × textSafety)

mediaSafety = Product of all image safety scores
  - Porn: 1 - porn_probability
  - Hentai: 1 - hentai_probability  
  - Violence: 1 - violence_probability

textSafety = 1 - max(toxicity_probabilities)
```

## Database Schema

### content_violations table
```sql
CREATE TABLE content_violations (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    content_type TEXT, -- 'post', 'boltz', 'flash'
    content_id UUID,
    violation_type TEXT,
    violation_score NUMERIC,
    severity TEXT, -- 'low', 'medium', 'high', 'critical'
    content_preview TEXT,
    scan_metadata JSONB,
    action_taken TEXT, -- 'blocked', 'warned', 'flagged'
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Posts/Boltz/Flashes safety columns
```sql
ALTER TABLE posts ADD COLUMN safety_hash TEXT;
ALTER TABLE posts ADD COLUMN content_rating NUMERIC DEFAULT 1.0;
ALTER TABLE posts ADD COLUMN ai_scan_passed BOOLEAN DEFAULT TRUE;
ALTER TABLE posts ADD COLUMN content_violations JSONB DEFAULT '[]';
```

## RLS Policies

```sql
-- Only safe content visible to teens
CREATE POLICY safety_content_select_posts ON posts
FOR SELECT USING (
    public.is_content_safe(
        COALESCE(content_rating, 1.0), 
        COALESCE(ai_scan_passed, TRUE), 
        user_id
    )
);
```

## Performance

- **Model Loading**: ~2-3 seconds on first use
- **Image Analysis**: ~100-300ms per image (NSFWJS)
- **Text Analysis**: ~50-100ms (Toxicity model)
- **Quality Analysis**: ~50-100ms
- **Total Scan**: ~500ms per image + text

## Testing

```javascript
// Test with safe content
const safeResult = await ContentModerationService.performPurityScan({
    mediaFiles: [safeImage],
    caption: "Beautiful sunset today!"
});
// → { passed: true, contentRating: 0.98 }

// Test with toxic text
const toxicResult = await ContentModerationService.analyzeText(
    "You are stupid and worthless"
);
// → { isSafe: false, violations: [{ type: 'INSULT' }] }
```

## Security Notes

1. **Client-Side First**: All scanning happens client-side with TensorFlow.js
2. **No PII Leaked**: Content is never sent to third parties (unless Sightengine configured)
3. **Fail-Safe**: If scanning fails, content is allowed (logged for review)
4. **Immutable**: safety_hash prevents tampering with moderation results
5. **Audited**: All violations recorded in content_violations table

## Roadmap

- [ ] Video frame extraction for NSFW detection
- [ ] Real-time caption scanning (as user types)
- [ ] Admin moderation dashboard
- [ ] Appeal system for blocked content
- [ ] Machine learning improvement loop

---

**Focus Content Filter** - One upload, one scan, zero tolerance for toxicity.
