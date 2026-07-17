import { Lead } from '../../types';
import { VerificationResult } from '../services/authService';

export type ToastType = 'tip' | 'success' | 'info' | 'progress';

export interface ToastItem {
  id: string;
  message: string;
  type?: ToastType;
  blink?: boolean;
}

export interface AuditPatch {
  audited: boolean;
  email?: string;
  phone_number?: string;
  website?: string;
  status?: string;
}

export interface LeadStoreState {
  // Core discovery results
  leads: Lead[];
  selectedLead: Lead | null;

  // Verification
  verificationResults: Record<string, VerificationResult>;
  verifyingLeadIds: Set<string>;

  // Deep audit
  auditResults: Record<string, any>;
  auditPatches: Record<string, AuditPatch>;
  isAuditing: boolean;
  isBulkAuditing: boolean;
  bulkAuditProgress: { done: number; total: number };

  // Market / discovery meta
  marketExhausted: boolean;
  suggestedCities: string[];
  limitInfo: any;
  showUpgradeWall: boolean;
  lastHuntCount: number;

  // Async flags
  loading: boolean;
  error: string | null;
  isVerifying: boolean;
  isFindingMore: boolean;

  // Toasts
  toasts: ToastItem[];
}

export type LeadStoreAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_LEADS'; payload: Lead[] }
  | { type: 'UPDATE_LEAD'; payload: { id: string; patch: Partial<Lead> } }
  | { type: 'SET_SELECTED_LEAD'; payload: Lead | null }
  | { type: 'SET_VERIFICATION_RESULTS'; payload: Record<string, VerificationResult> }
  | { type: 'MERGE_VERIFICATION_RESULTS'; payload: Record<string, VerificationResult> }
  | { type: 'ADD_VERIFYING_IDS'; payload: string[] }
  | { type: 'REMOVE_VERIFYING_IDS'; payload: string[] }
  | { type: 'SET_AUDIT_RESULT'; payload: { id: string; result: any } }
  | { type: 'CLEAR_AUDIT_RESULT'; payload: string }
  | { type: 'SET_AUDIT_PATCH'; payload: { id: string; patch: AuditPatch } }
  | { type: 'SET_MARKET_EXHAUSTED'; payload: boolean }
  | { type: 'SET_SUGGESTED_CITIES'; payload: string[] }
  | { type: 'SET_LIMIT_INFO'; payload: any }
  | { type: 'SET_UPGRADE_WALL'; payload: boolean }
  | { type: 'SET_LAST_HUNT_COUNT'; payload: number }
  | { type: 'SET_IS_AUDITING'; payload: boolean }
  | { type: 'SET_IS_VERIFYING'; payload: boolean }
  | { type: 'SET_IS_FINDING_MORE'; payload: boolean }
  | { type: 'SET_IS_BULK_AUDITING'; payload: boolean }
  | { type: 'SET_BULK_PROGRESS'; payload: { done: number; total: number } }
  | { type: 'ADD_TOAST'; payload: ToastItem }
  | { type: 'REMOVE_TOAST'; payload: string }
  | { type: 'UPDATE_TOAST'; payload: { id: string; message: string } }
  | { type: 'RESET_SEARCH_SESSION' };