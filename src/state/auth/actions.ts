import { createAction } from '@reduxjs/toolkit'
import {IPayload} from '../../hooks/useApi'

export const addPayload = createAction<IPayload>('api/addPayload')
