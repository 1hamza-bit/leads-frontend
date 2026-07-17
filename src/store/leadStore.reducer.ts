import { LeadStoreState, LeadStoreAction } from './leadStore.types';

export const initialLeadStoreState: LeadStoreState = {
  leads: [],
  selectedLead: null,
  verificationResults: {},
  verifyingLeadIds: new Set(),
  auditResults: {},
  auditPatches: {},
  isAuditing: false,
  isBulkAuditing: false,
  bulkAuditProgress: { done: 0, total: 0 },
  marketExhausted: false,
  suggestedCities: [],
  limitInfo: null,
  showUpgradeWall: false,
  lastHuntCount: 10,
  loading: false,
  error: null,
  isVerifying: false,
  isFindingMore: false,
  toasts: [],
};

export function leadStoreReducer(state: LeadStoreState, action: LeadStoreAction): LeadStoreState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'SET_LEADS':
      return { ...state, leads: action.payload };

    case 'UPDATE_LEAD':
      return {
        ...state,
        leads: state.leads.map(l => (l.id === action.payload.id ? { ...l, ...action.payload.patch } : l)),
        selectedLead:
          state.selectedLead?.id === action.payload.id
            ? { ...state.selectedLead, ...action.payload.patch }
            : state.selectedLead,
      };

    case 'SET_SELECTED_LEAD':
      return { ...state, selectedLead: action.payload };

    case 'SET_VERIFICATION_RESULTS':
      return { ...state, verificationResults: action.payload };

    case 'MERGE_VERIFICATION_RESULTS':
      return { ...state, verificationResults: { ...state.verificationResults, ...action.payload } };

    case 'ADD_VERIFYING_IDS':
      return { ...state, verifyingLeadIds: new Set([...state.verifyingLeadIds, ...action.payload]) };

    case 'REMOVE_VERIFYING_IDS': {
      const next = new Set(state.verifyingLeadIds);
      action.payload.forEach(id => next.delete(id));
      return { ...state, verifyingLeadIds: next };
    }

    case 'SET_AUDIT_RESULT':
      return { ...state, auditResults: { ...state.auditResults, [action.payload.id]: action.payload.result } };

    case 'CLEAR_AUDIT_RESULT': {
      const next = { ...state.auditResults };
      delete next[action.payload];
      return { ...state, auditResults: next };
    }

    case 'SET_AUDIT_PATCH':
      return { ...state, auditPatches: { ...state.auditPatches, [action.payload.id]: action.payload.patch } };

    case 'SET_MARKET_EXHAUSTED':
      return { ...state, marketExhausted: action.payload };

    case 'SET_SUGGESTED_CITIES':
      return { ...state, suggestedCities: action.payload };

    case 'SET_LIMIT_INFO':
      return { ...state, limitInfo: action.payload };

    case 'SET_UPGRADE_WALL':
      return { ...state, showUpgradeWall: action.payload };

    case 'SET_LAST_HUNT_COUNT':
      return { ...state, lastHuntCount: action.payload };

    case 'SET_IS_AUDITING':
      return { ...state, isAuditing: action.payload };

    case 'SET_IS_VERIFYING':
      return { ...state, isVerifying: action.payload };

    case 'SET_IS_FINDING_MORE':
      return { ...state, isFindingMore: action.payload };

    case 'SET_IS_BULK_AUDITING':
      return { ...state, isBulkAuditing: action.payload };

    case 'SET_BULK_PROGRESS':
      return { ...state, bulkAuditProgress: action.payload };

    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, action.payload] };

    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };

    case 'UPDATE_TOAST':
      return {
        ...state,
        toasts: state.toasts.map(t => (t.id === action.payload.id ? { ...t, message: action.payload.message } : t)),
      };

    case 'RESET_SEARCH_SESSION':
      return {
        ...state,
        leads: [],
        selectedLead: null,
        verificationResults: {},
        auditResults: {},
        marketExhausted: false,
        suggestedCities: [],
        error: null,
      };

    default:
      return state;
  }
}