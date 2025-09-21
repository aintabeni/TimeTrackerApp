
import React, { useReducer, useEffect } from 'react';
import { AppStateContext, AppDispatchContext } from './AppContext';
import { appReducer } from './appReducer';
import { INITIAL_STATE } from '../constants';
import type { AppState } from '../types';

const APP_STATE_STORAGE_KEY = 'lifeos-app-state';

const getInitialState = (): AppState => {
  try {
    const storedState = localStorage.getItem(APP_STATE_STORAGE_KEY);
    if (storedState) {
      return JSON.parse(storedState);
    }
  } catch (error) {
    console.error("Failed to parse state from localStorage", error);
  }
  return INITIAL_STATE;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, getInitialState());

  useEffect(() => {
    try {
      localStorage.setItem(APP_STATE_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save state to localStorage", error);
    }
  }, [state]);

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
};
