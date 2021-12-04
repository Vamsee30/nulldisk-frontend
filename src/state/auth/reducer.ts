import { createReducer } from '@reduxjs/toolkit'
import {setUsername, setPassword, setModalOpen} from './actions'

export interface IAuth{
  username: string;
  password: string;
  modalOpen: boolean;
}

const initialState:IAuth = {
  username: '',
  password: '',
  modalOpen: false
}

export const store = createReducer(initialState, (builder) =>
  builder
    .addCase(setUsername, (state, action) => ({
      ...state,
      username: action.payload,
    }))
    .addCase(setPassword, (state, action) => ({
      ...state,
      password: action.payload,
    }))
    .addCase(setModalOpen, (state, action) => ({
      ...state,
      modalOpen: action.payload,
    }))
);

export default store
