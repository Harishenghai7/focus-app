/**
 * useSafetyAudit.js
 * =================
 * 🚑  PILLAR 5 — Client wrapper for the `safety-audit` Edge Function.
 *
 * Usage (inside useReport.submit, immediately after the report row exists):
 *     const { runAudit } = useSafetyAudit();
 *     runAudit(reportId).catch(console.error); // fire-and-forget
 *
 * Fire-and-forget is recommended — the audit takes 2-4s and users should get
 * their confirmation immediately. The result persists to `reports.ai_*`
 * columns; admin dashboards pick it up asynchronously.
 *
 * H2 Innovative — Ruthless Reporting.
 */

import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';

export const useSafetyAudit = () => {
    const [auditing, setAuditing] = useState(false);
    const [lastVerdict, setLastVerdict] = useState(null);
    const [error, setError] = useState(null);

    const runAudit = useCallback(async (reportId) => {
        if (!reportId) return null;
        setAuditing(true);
        setError(null);
        try {
            const { data, error: invokeErr } = await supabase.functions.invoke('safety-audit', {
                body: { reportId },
            });
            if (invokeErr) throw invokeErr;
            setLastVerdict(data);
            return data;
        } catch (err) {
            console.error('[useSafetyAudit] invoke failed:', err);
            setError(err?.message || String(err));
            return null;
        } finally {
            setAuditing(false);
        }
    }, []);

    return { runAudit, auditing, lastVerdict, error };
};

export default useSafetyAudit;
