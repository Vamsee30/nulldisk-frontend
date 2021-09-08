import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';
import payload from './auth/reducer'

export const store = configureStore({
  reducer: {payload}
})

export type AppDispatch = typeof store.dispatch;
export type AppState = ReturnType<typeof store.getState>
export type RootState = ReturnType<typeof store.getState>
