import { useCallback, useMemo } from 'react'
import { addPayload } from './actions'
import { useSelector, useDispatch } from 'react-redux'
import {IPayload} from './reducer'
import {AppState} from '../index'

export function useAddPayload(): (payload:IPayload)=>void {
  const dispatch = useDispatch()
  return useCallback((payload)=>dispatch(addPayload(payload)), [dispatch])
}

export function useGetPayload():IPayload {
  return useSelector((state:AppState)=>state.payload)
}
