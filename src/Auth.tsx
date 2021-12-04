import React, {useState} from 'react';
import useApi, {IPayload} from './hooks/useApi';
import Modal from 'react-modal'
import './modal.css';
Modal.setAppElement('#root')

interface IProps {
  payload:IPayload,
  setPayload:(payload:IPayload)=>void,
  setAuth:(auth:boolean)=>void,
  closeAction:()=>void,
}


function Auth(props:IProps):JSX.Element{

  const [auth, _updateAuth] = useState<boolean>(false)
  const [authModalIsOpen, setAuthModal] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  function updateAuth(auth:boolean){
    _updateAuth(auth)
    props.setAuth(auth)
  }

  const opts = {
    username: username,
    password: password,
    fail: forceLogin,
  }

  const defaultPayload:IPayload = {
      path:'notes/validateAuth/',
      method: 'GET',
      body: null,
      callback: loginAction
  }

  //
  // console.log(_payload)

  if(props.payload.path===''){
    props.setPayload(defaultPayload)
  }

  useApi(opts, props.payload)

  function forceLogin(){
    setAuthModal(true)
    updateAuth(false)
  }

  function closeAuthModal(){
    if(auth){ setAuthModal(false)
      props.closeAction()
    }
  }


  function SubmitLogin(){
    props.setPayload(defaultPayload)
  }

  function loginAction(res:any){
    updateAuth(true)
    setAuthModal(false)
    setUsername(res.auth)
  }


  return(

    <Modal
      isOpen={authModalIsOpen}
      onRequestClose={closeAuthModal}
      className='SearchModal'
      overlayClassName='SearchOverlay'
      >
      <div className="IoLinks_wrapper">
      <div className="IoLinks_incoming">
      
      <form onSubmit={(e)=>{
        e.preventDefault()
        SubmitLogin()
      }}>
          <input name='username' className='greenput_narrow' onChange={(e)=>{
            setUsername(e.target.value)
          }}/><br />
          <input type="password" name='password' className='greenput_narrow' onChange={(e)=>{
            setPassword(e.target.value)
          }}/><br />
          <button className='greenput_narrow' type="submit">Login</button>
        </form>
      
      </div>
      <div className="IoLinks_outgoing"><h1>NullDisk</h1><ul><li>Military Grade Encryption</li><li>Zettelkasten Schema</li><li>VIM Keybindings</li></ul></div>
      </div>
      </Modal>
  )
}

// Auth.defaultProps = defaultProps
export default Auth;
