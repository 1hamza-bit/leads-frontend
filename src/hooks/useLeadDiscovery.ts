import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLeadStore } from '../store/LeadStoreContext';
import { useToasts } from './useToasts';
import api from '../components/api';
import { verifyLeads, VerificationResult } from '../services/authService';

const normalizeUrl = (url: string) =>
  (url || '').toLowerCase().replace(/https?:\/\/(www\.)?/, '').replace(/\/$/, '').trim();

interface HuntCriteria {
  niche: string;
  city: string;
  idealCompanyType: string;
}

// Encapsulates the two ways leads enter the store: a fresh hunt that
// replaces the session, and "find more" which appends new, de-duplicated
// results using the same criteria. Both share the verification-kickoff
// logic via verifyBatch so a batch's "verifying" state is always scoped to
// just the ids in that batch (never a global flag).
export const useLeadDiscovery = ({ niche, city, idealCompanyType }: HuntCriteria) => {
  const { state, dispatch } = useLeadStore();
  const { addToast } = useToasts();
  const navigate = useNavigate();

  const verifyBatch = useCallback(
    (leadIds: string[], successMessage: string) => {
      if (!leadIds.length) return;
      dispatch({ type: 'ADD_VERIFYING_IDS', payload: leadIds });
      verifyLeads(leadIds)
        .then(({ results }: any) => {
          const map: Record<string, VerificationResult> = {};
          results.forEach((r: any) => { map[r.lead_id] = r; });
          dispatch({ type: 'MERGE_VERIFICATION_RESULTS', payload: map });
          addToast(successMessage, 'success');
        })
        .catch((e: any) => console.error('Verification error:', e))
        .finally(() => dispatch({ type: 'REMOVE_VERIFYING_IDS', payload: leadIds }));
    },
    [dispatch, addToast]
  );

  const runDiscovery = useCallback(
    async (count: number) => {
      dispatch({ type: 'SET_LAST_HUNT_COUNT', payload: count });
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'RESET_SEARCH_SESSION' });

      try {
        const response = await api.post('/search-leads', { niche, city, count, idealCompanyType });
        const { data: foundLeads, limit_info, market_exhausted } = response.data;
        if (limit_info) dispatch({ type: 'SET_LIMIT_INFO', payload: limit_info });

        const normalized = (foundLeads || []).map((l: any) => ({
          ...l,
          phone: l.phone_number || l.phone,
          city: l.city || city,
          niche: l.niche || niche,
          scoreBreakdown: l.scoreBreakdown ?? {},
          socials: {},
          source: l.source || 'ai_search',
          confidence: l.score,
        }));

        if (!normalized.length) {
          dispatch({
            type: 'SET_ERROR',
            payload: market_exhausted
              ? `Market exhausted — no more ${niche} leads found in ${city}. Try a nearby city.`
              : 'No leads found. Try a broader niche or different city.',
          });
          return;
        }

        if (market_exhausted) dispatch({ type: 'SET_MARKET_EXHAUSTED', payload: true });
        dispatch({ type: 'SET_LEADS', payload: normalized });

        const persisted: Record<string, VerificationResult> = {};
        normalized.forEach((l: any) => {
          if (l.verification?.overall) {
            persisted[l.id] = {
              lead_id: l.id,
              overall: l.verification.overall,
              email: l.verification.email ?? {},
              website: l.verification.website ?? {},
            } as any;
          }
        });
        if (Object.keys(persisted).length) dispatch({ type: 'SET_VERIFICATION_RESULTS', payload: persisted });

        dispatch({ type: 'SET_SELECTED_LEAD', payload: normalized[0] });
        navigate('/results');

        verifyBatch(
          normalized.map((l: any) => l.id),
          `✓ Verified ${normalized.length} lead${normalized.length === 1 ? '' : 's'}.`
        );

        if (market_exhausted) {
          try {
            const exRes = await api.post('/market-exhaustion', { niche, city });
            if (exRes.data?.suggested_cities?.length) {
              dispatch({ type: 'SET_SUGGESTED_CITIES', payload: exRes.data.suggested_cities });
            }
          } catch (_) { /* non-fatal */ }
        }
      } catch (e: any) {
        const errData = e.response?.data;
        if (errData?.error === 'trial_expired') {
          dispatch({ type: 'SET_UPGRADE_WALL', payload: true });
          return;
        }
        dispatch({ type: 'SET_ERROR', payload: errData?.message || errData?.error || 'Search failed. Please try again.' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    [niche, city, idealCompanyType, dispatch, navigate, verifyBatch]
  );

  const findMoreLeads = useCallback(async () => {
    if (state.isFindingMore || state.loading) return;
    dispatch({ type: 'SET_IS_FINDING_MORE', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const response = await api.post('/search-leads', { niche, city, count: state.lastHuntCount, idealCompanyType });
      const { data: foundLeads, limit_info, market_exhausted } = response.data;
      if (limit_info) dispatch({ type: 'SET_LIMIT_INFO', payload: limit_info });

      const existingIds = new Set(state.leads.map(l => l.id));
      const existingSignatures = new Set(
        state.leads.map(l => `${(l.name || '').trim().toLowerCase()}|${normalizeUrl(l.website)}`)
      );

      const normalized = (foundLeads || [])
        .map((l: any) => ({
          ...l,
          phone: l.phone_number || l.phone,
          city: l.city || city,
          niche: l.niche || niche,
          scoreBreakdown: l.scoreBreakdown ?? {},
          socials: {},
          source: l.source || 'ai_search',
          confidence: l.score,
        }))
        .filter(
          (l: any) =>
            !existingIds.has(l.id) &&
            !existingSignatures.has(`${(l.name || '').trim().toLowerCase()}|${normalizeUrl(l.website)}`)
        );

      if (market_exhausted) dispatch({ type: 'SET_MARKET_EXHAUSTED', payload: true });

      if (!normalized.length) {
        addToast(
          market_exhausted
            ? `Market exhausted — no more new ${niche} leads found in ${city}.`
            : 'No additional new leads found this round — try again shortly.',
          'info'
        );
        if (market_exhausted) {
          try {
            const exRes = await api.post('/market-exhaustion', { niche, city });
            if (exRes.data?.suggested_cities?.length) {
              dispatch({ type: 'SET_SUGGESTED_CITIES', payload: exRes.data.suggested_cities });
            }
          } catch (_) { /* non-fatal */ }
        }
        return;
      }

      const merged = [...state.leads, ...normalized].sort((a: any, b: any) => (b.score ?? 0) - (a.score ?? 0));
      dispatch({ type: 'SET_LEADS', payload: merged });
      addToast(`✓ Found ${normalized.length} more lead${normalized.length === 1 ? '' : 's'}.`, 'success');

      const persisted: Record<string, VerificationResult> = {};
      normalized.forEach((l: any) => {
        if (l.verification?.overall) {
          persisted[l.id] = {
            lead_id: l.id,
            overall: l.verification.overall,
            email: l.verification.email ?? {},
            website: l.verification.website ?? {},
          } as any;
        }
      });
      if (Object.keys(persisted).length) dispatch({ type: 'MERGE_VERIFICATION_RESULTS', payload: persisted });

      verifyBatch(
        normalized.map((l: any) => l.id),
        `✓ Verified ${normalized.length} new lead${normalized.length === 1 ? '' : 's'}.`
      );
    } catch (e: any) {
      const errData = e.response?.data;
      if (errData?.error === 'trial_expired') {
        dispatch({ type: 'SET_UPGRADE_WALL', payload: true });
        return;
      }
      dispatch({ type: 'SET_ERROR', payload: errData?.message || errData?.error || 'Failed to find more leads. Please try again.' });
    } finally {
      dispatch({ type: 'SET_IS_FINDING_MORE', payload: false });
    }
  }, [niche, city, idealCompanyType, state.isFindingMore, state.loading, state.lastHuntCount, state.leads, dispatch, addToast, verifyBatch]);

  return { runDiscovery, findMoreLeads };
};