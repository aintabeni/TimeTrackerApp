
import React from 'react';
import type { AppState, AppAction } from '../types';

export const AppStateContext = React.createContext<AppState | undefined>(undefined);
export const AppDispatchContext = React.createContext<React.Dispatch<AppAction> | undefined>(undefined);
