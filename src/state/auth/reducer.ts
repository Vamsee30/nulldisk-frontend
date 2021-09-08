import { createReducer } from '@reduxjs/toolkit'
import {addPayload} from './actions'

export interface IPayload{
    path:string,
    method:string,
    body:{}|null,
    callback: (result:any)=>any,
}

const initialState:IPayload = {
  path: '',
  method: '',
  body: null,
  callback: ()=>null
}

export default createReducer(initialState, builder=>
  builder
.addCase(addPayload, (state:IPayload ,action)=>{
  state = action.payload
})
  )
