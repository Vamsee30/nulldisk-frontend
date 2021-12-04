import { createAction } from '@reduxjs/toolkit'
import {IPayload} from '../../hooks/useApi'

export const setUsername = createAction<string>('auth/setUsername')
export const setPassword = createAction<string>('auth/setPassword')
export const setModalOpen = createAction<boolean>('auth/setModalOpan')
