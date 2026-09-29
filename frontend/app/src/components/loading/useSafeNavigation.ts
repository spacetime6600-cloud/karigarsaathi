import { useContext } from 'react';
import { UNSAFE_DataRouterStateContext } from 'react-router-dom';

export interface SafeNavigation {
  state: 'idle' | 'submitting' | 'loading';
  location?: {
    pathname: string;
    search: string;
    hash: string;
    state: unknown;
    key: string;
  };
}

const IDLE_NAVIGATION: SafeNavigation = {
  state: 'idle',
  location: undefined,
};

/**
 * useSafeNavigation
 * Unconditionally and safely reads router navigation state without throwing
 * when rendered in non-data routers (e.g. MemoryRouter in unit tests).
 */
export function useSafeNavigation(): SafeNavigation {
  const routerState = useContext(UNSAFE_DataRouterStateContext);
  return (routerState?.navigation as SafeNavigation) || IDLE_NAVIGATION;
}
