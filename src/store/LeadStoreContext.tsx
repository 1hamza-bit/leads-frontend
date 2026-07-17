import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { leadStoreReducer, initialLeadStoreState } from './leadStore.reducer';
import { LeadStoreState, LeadStoreAction } from './leadStore.types';

interface LeadStoreContextValue {
  state: LeadStoreState;
  dispatch: React.Dispatch<LeadStoreAction>;
}

const LeadStoreContext = createContext<LeadStoreContextValue | undefined>(undefined);

// Mount once, near the top of the authenticated app tree. Every screen that
// touches lead/audit/toast state — the dashboard, the results view, the
// header toasts — reads from this single source of truth instead of
// receiving it hand-threaded through props.
export const LeadStoreProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(leadStoreReducer, initialLeadStoreState);
  return <LeadStoreContext.Provider value={{ state, dispatch }}>{children}</LeadStoreContext.Provider>;
};

// Raw access to state + dispatch. Prefer the domain hooks (useToasts,
// useLeadDiscovery, useLeadAudit) in components — they wrap this with
// intention-revealing function names instead of raw action objects.
export const useLeadStore = () => {
  const ctx = useContext(LeadStoreContext);
  if (!ctx) throw new Error('useLeadStore must be used within a <LeadStoreProvider>');
  return ctx;
};