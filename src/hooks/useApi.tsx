import {useState, useEffect, useCallback} from 'react'
import createPersistedState from 'use-persisted-state'
import {apiUrl} from '../config'
console.log("MODE: "+apiUrl)
export interface IProps {
    username:string,
    password:string,
    fail: ()=>void
}

export interface IPayload {
    path:string,
    method:string,
    body:{}|null,
    callback: (result:any)=>any,
}

function useApi(props:IProps, payload:IPayload){

    const [accessKey, setAccessKey] = useState('')
    const useRefreshKeyState = createPersistedState('refreshKey')
    const [refreshKey, setRefreshKey] = useRefreshKeyState('')
    //const [refreshKey, setRefreshKey] = useState('')
    const [refreshKeyIsValid, setRefreshKeyIsValid] = useState<null|boolean>(null)
    // const apiUrl = 'http://127.0.0.1:8000/api/'
    // const apiUrl = '/api/'
    const [accessKeyIsValid, setAccessKeyIsValid] = useState<null|boolean>(null)

    
    const go = useCallback((accessKey)=>{
        const {body, method, path} = payload
        console.log('executing GO:'+accessKey)
        if(method === 'logout'){
            return logout(payload.callback)
        }
        const options = {
            method: method,
            headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer '+accessKey,
            },
            ... (body !== null) && { body: JSON.stringify(body) }
        }
        fetch(apiUrl+path,options)
        .then(response=>{
            if(response.status !== 200){
                setAccessKeyIsValid(false)
            } else {
                setAccessKeyIsValid(true)
                response.json()
                .then(response=>{
                    payload.callback(response)
                })
            }
        })
    },[payload])

    function logout(callback:(response:null)=>void){
        setRefreshKey('')
        setAccessKey('')
        setRefreshKeyIsValid(null)
        setAccessKeyIsValid(null)
        callback(null)
    }

    useEffect(()=>{
        if(accessKeyIsValid===false){
            console.log('access key is false')
            // We tried to make a request, but our key is invalid.
            // We need to use the refresh key
            const options = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', },
                body: JSON.stringify( {'refresh': refreshKey} ),
            }
            fetch(apiUrl+'token/refresh/', options)
            .then(response=>{
                if(response.status !== 200 ){
                    setRefreshKeyIsValid(false)
                    // this needs to trigger a login event
                } else {
                    response.json()
                    .then(response=>{
                        setRefreshKeyIsValid(true)
                        setAccessKey(response.access)
                        // setAccessKeyIsValid(true)
                    })
                }
            })
        }
    },[accessKeyIsValid])


    useEffect(()=>{
        console.log('responding to change in access key:'+accessKey)
        go(accessKey)
    },[accessKey,payload])

    useEffect(()=>{
        if(refreshKeyIsValid===false){
            // even after trying to login, the RK is invalid
            // We must straight up log in.
            const options = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: props.username,
                    password: props.password,
                 })
            }
            fetch(apiUrl+'token/', options)
            .then(response=>{
                console.log(response.status)
                if(response.status !== 200){
                    setAccessKeyIsValid(null)
                    setRefreshKeyIsValid(null)
                    props.fail()
                    console.log('total fail')
                }
                else { 
                    console.log('login works')
                    response.json()
                    .then(response=>{
                        setAccessKey(response.access)
                        setRefreshKey(response.refresh)
                        // setRefreshKeyIsValid(true)
                        // setAccessKeyIsValid(true) // Commenting this out disables the loop
                    })
                }
            })
        }

        
    },[refreshKeyIsValid])

};

export default useApi
