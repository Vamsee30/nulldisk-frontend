import { useCallback, useMemo } from 'react'
import { setUsername,setPassword,setModalOpen } from './actions'
import { useSelector, useDispatch } from 'react-redux'
import {IAuth} from './reducer'
import {AppState} from '../index'

export function useSetUsername(): (payload:string)=>void {
  const dispatch = useDispatch()
  return useCallback((payload)=>dispatch(setUsername(payload)), [dispatch])
}

export function useSetPassword(): (payload:string)=>void {
  const dispatch = useDispatch()
  return useCallback((payload)=>dispatch(setPassword(payload)), [dispatch])
}

export function useSetModalOpen(): (payload:boolean)=>void {
  const dispatch = useDispatch()
  return useCallback((payload)=>dispatch(setModalOpen(payload)), [dispatch])
}

export function useGetAuthState():IAuth {
  return useSelector((state:AppState)=>state.payload)
}
