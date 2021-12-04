import React, {useState} from 'react';
import useApi, {IPayload} from './hooks/useApi';
import Modal from 'react-modal'
import './modal.css';
Modal.setAppElement('#root')

function Auth():JSX.Element{

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const opts = {
    username: username,
    password: password,
    fail: ()=>null,
  }

  const defaultPayload = {
      path:'notes/validateAuth/',
      method: 'GET',
      body: null,
      callback: ()=>null
  }

  //const _payload = (props.payload===null)?defaultPayload:props.payload
  // console.log(_payload)
  useApi(opts, defaultPayload)

  
  return(
    <></>
  )
}

export default Auth;
