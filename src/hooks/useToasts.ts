import { useCallback } from 'react';
import { useLeadStore } from '../store/LeadStoreContext';
import { ToastType } from '../store/leadStore.types';

export const useToasts = () => {
  const { state, dispatch } = useLeadStore();

  // Auto-dismissing toast (tips, success, info). 5s lifetime, matches the
  // previous inline implementation exactly.
  const addToast = useCallback(
    (message: string, type: ToastType = 'tip') => {
      const id = Math.random().toString(36).substr(2, 9);
      dispatch({ type: 'ADD_TOAST', payload: { id, message, type } });
      setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: id }), 5000);
      return id;
    },
    [dispatch]
  );

  // Persistent, blinking toast for long-running batch operations (e.g. bulk
  // deep audit). Caller is responsible for removing it via removeToast once
  // the operation completes.
  const addPersistentToast = useCallback(
    (message: string) => {
      const id = `persistent-${Date.now()}`;
      dispatch({ type: 'ADD_TOAST', payload: { id, message, type: 'progress', blink: true } });
      return id;
    },
    [dispatch]
  );

  const updateToast = useCallback(
    (id: string, message: string) => dispatch({ type: 'UPDATE_TOAST', payload: { id, message } }),
    [dispatch]
  );

  const removeToast = useCallback((id: string) => dispatch({ type: 'REMOVE_TOAST', payload: id }), [dispatch]);

  return { toasts: state.toasts, addToast, addPersistentToast, updateToast, removeToast };
};