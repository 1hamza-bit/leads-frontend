import { useCallback } from 'react';
import { useLeadStore } from '../store/LeadStoreContext';
import { useToasts } from './useToasts';
import api from '../components/api';
import { Lead } from '../../types';

// Encapsulates every write path that touches a lead's verification/audit
// status: the manual "Verify" button, the manual "Deep Audit" button, and
// the multi-lead bulk audit batch. Centralizing these means the
// "already audited, don't re-select" rule and the per-lead progress
// tracking only have to be correct in one place.
export const useLeadAudit = () => {
  const { state, dispatch } = useLeadStore();
  const { addToast, addPersistentToast, updateToast, removeToast } = useToasts();

  const handleVerifyLead = useCallback(
    async (lead: Lead) => {
      if (state.isVerifying) return;
      dispatch({ type: 'SET_IS_VERIFYING', payload: true });
      try {
        const res = await api.post(`/verify-lead/${lead.id}`);
        const result = res.data;
        const overall = result.overall;
        dispatch({
          type: 'UPDATE_LEAD',
          payload: { id: lead.id, patch: { status: overall === 'verified' ? 'verified' : (lead as any).status } },
        });
        dispatch({ type: 'MERGE_VERIFICATION_RESULTS', payload: { [lead.id]: result } });
        addToast(
          overall === 'verified'
            ? `✓ "${lead.name}" verified.`
            : `Verification complete for "${lead.name}" — ${overall === 'failed' ? 'no valid contact found' : 'partial match'}.`,
          overall === 'verified' ? 'success' : 'info'
        );
      } catch (e: any) {
        const errData = e.response?.data;
        dispatch({
          type: 'SET_ERROR',
          payload:
            errData?.error === 'pro_required'
              ? 'Lead verification is available on the Pro plan.'
              : 'Contact verification failed.',
        });
      } finally {
        dispatch({ type: 'SET_IS_VERIFYING', payload: false });
      }
    },
    [state.isVerifying, dispatch, addToast]
  );

  const performAudit = useCallback(
    async (lead: Lead) => {
      if (state.isAuditing) return;
      dispatch({ type: 'SET_IS_AUDITING', payload: true });
      dispatch({ type: 'CLEAR_AUDIT_RESULT', payload: lead.id });

      try {
        const res = await api.post(`/deep-audit/${lead.id}`);
        const result = res.data;

        dispatch({
          type: 'UPDATE_LEAD',
          payload: {
            id: lead.id,
            patch: {
              email: result.email ?? (lead as any).email,
              website: result.website ?? (lead as any).website,
              phone_number: result.phone_number ?? (lead as any).phone_number,
              status: result.email_verified_by_audit
                ? 'verified'
                : result.updated && result.website
                  ? 'partial'
                  : (lead as any).status,
              deep_audit_ran: true,
            } as any,
          },
        });
        dispatch({ type: 'SET_AUDIT_RESULT', payload: { id: lead.id, result } });
        dispatch({
          type: 'SET_AUDIT_PATCH',
          payload: {
            id: lead.id,
            patch: {
              audited: true,
              email: result.email ?? (lead as any).email,
              phone_number: result.phone_number ?? (lead as any).phone_number,
              website: result.website ?? (lead as any).website,
              status: result.email_verified_by_audit ? 'verified' : (lead as any).status,
            },
          },
        });

        if (result.email_verified_by_audit || result.updated) {
          try {
            const verifyRes = await api.post(`/verify-lead/${lead.id}`);
            dispatch({ type: 'MERGE_VERIFICATION_RESULTS', payload: { [lead.id]: verifyRes.data } });
            const verifyOverall = verifyRes.data?.overall;
            if (verifyOverall === 'verified' || verifyOverall === 'partial') {
              dispatch({
                type: 'UPDATE_LEAD',
                payload: { id: lead.id, patch: { status: verifyOverall === 'verified' ? 'verified' : (lead as any).status } },
              });
            }
          } catch {
            if (result.email) {
              dispatch({
                type: 'MERGE_VERIFICATION_RESULTS',
                payload: {
                  [lead.id]: {
                    lead_id: lead.id,
                    overall: 'partial',
                    email: {
                      is_valid: true,
                      deliverability: 'probable',
                      status: 'audit_verified',
                      checks: {
                        format: true, disposable: false, mx: null,
                        smtp_reachable: null, is_catchall: null, mailbox_exists: null, port_blocked: null,
                      },
                    },
                  } as any,
                },
              });
            }
          }
        }
      } catch (e: any) {
        const errData = e.response?.data;
        dispatch({
          type: 'SET_ERROR',
          payload: errData?.error === 'pro_required' ? 'Deep Audit is available on the Pro plan.' : 'Deep audit failed. Please try again.',
        });
      } finally {
        dispatch({ type: 'SET_IS_AUDITING', payload: false });
      }
    },
    [state.isAuditing, dispatch]
  );

  const bulkAuditMissingLeads = useCallback(
    async (targetLeads?: Lead[]) => {
      if (state.isBulkAuditing) return;

      const needsAudit = (targetLeads ?? state.leads).filter(l => {
        if (state.auditPatches[l.id]?.audited) return false; // already audited this session
        if (!(l as any).email) return true;
        const vr = state.verificationResults[l.id] as any;
        if (!vr) return true;
        const emailOk = vr?.email?.is_valid;
        return emailOk === false || emailOk === null || emailOk === undefined;
      });

      if (!needsAudit.length) {
        addToast('All leads already have verified emails.', 'info');
        return;
      }

      dispatch({ type: 'SET_IS_BULK_AUDITING', payload: true });
      dispatch({ type: 'SET_BULK_PROGRESS', payload: { done: 0, total: needsAudit.length } });

      const toastId = addPersistentToast(`⚡ Deep Audit running — 0 of ${needsAudit.length} leads processed`);

      for (let i = 0; i < needsAudit.length; i++) {
        const lead = needsAudit[i];
        try {
          const res = await api.post(`/deep-audit/${lead.id}`);
          const result = res.data;

          dispatch({
            type: 'UPDATE_LEAD',
            payload: {
              id: lead.id,
              patch: {
                email: result.email ?? (lead as any).email,
                website: result.website ?? (lead as any).website,
                phone_number: result.phone_number ?? (lead as any).phone_number,
                status: result.email_verified_by_audit ? 'verified' : (lead as any).status,
                deep_audit_ran: true,
              } as any,
            },
          });
          dispatch({ type: 'SET_AUDIT_RESULT', payload: { id: lead.id, result } });
          dispatch({
            type: 'SET_AUDIT_PATCH',
            payload: {
              id: lead.id,
              patch: {
                audited: true,
                email: result.email ?? (lead as any).email,
                phone_number: result.phone_number ?? (lead as any).phone_number,
                website: result.website ?? (lead as any).website,
                status: result.email_verified_by_audit ? 'verified' : (lead as any).status,
              },
            },
          });

          updateToast(toastId, `⚡ Deep Audit running — ${i + 1} of ${needsAudit.length} leads processed`);

          if (result.email_verified_by_audit || result.updated) {
            try {
              const verifyRes = await api.post(`/verify-lead/${lead.id}`);
              dispatch({ type: 'MERGE_VERIFICATION_RESULTS', payload: { [lead.id]: verifyRes.data } });
            } catch { /* non-fatal */ }
          }
        } catch (e: any) {
          const errData = e.response?.data;
          if (errData?.error === 'pro_required') {
            dispatch({ type: 'SET_ERROR', payload: 'Bulk Deep Audit requires Pro plan.' });
            break;
          }
          console.error(`Bulk audit failed for lead ${lead.id}:`, e);
        }

        dispatch({ type: 'SET_BULK_PROGRESS', payload: { done: i + 1, total: needsAudit.length } });
        if (i < needsAudit.length - 1) await new Promise(r => setTimeout(r, 800));
      }

      dispatch({ type: 'SET_IS_BULK_AUDITING', payload: false });
      dispatch({ type: 'SET_BULK_PROGRESS', payload: { done: 0, total: 0 } });
      removeToast(toastId);
      addToast(`✓ Deep Audit complete — ${needsAudit.length} leads processed and updated.`, 'success');
    },
    [state.isBulkAuditing, state.leads, state.auditPatches, state.verificationResults, dispatch, addToast, addPersistentToast, updateToast, removeToast]
  );

  return { handleVerifyLead, performAudit, bulkAuditMissingLeads };
};