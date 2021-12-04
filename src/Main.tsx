import React, {useState, useEffect, useRef, useLayoutEffect} from 'react';
import useApi, {IPayload} from './hooks/useApi';
import Modal from 'react-modal'
import Vim from './Vim';
import Auth from './Auth';
import Review from './Review';
import './Main.css';
import './modal.css';
var dateFormat = require("dateformat");
Modal.setAppElement('#root')

type orderByDate = 'date_created'|'date_updated'
type sortType = 'DESC'|'ASC'

interface ISearchFilters {
  primary: string,
  when: string,
  date: null|Date,
  order_by: orderByDate,
  sort: sortType,
}

interface IResult {
  id: number,
  title: string,
  content: string,
  date_created: Date,
  date_updated: Date,
  author: number
}

function Main():JSX.Element { 

  const [postId,updatePostId] = useState<number|null>(null)
  const [content, updateContent] = useState<string>('');
  const [auth, updateAuth] = useState<boolean>(false)
  const [authModalIsOpen, setAuthModal] = useState(false)
  const [searchPanelIsOpen, setSearchPanelIsOpen] = useState(false)
  const [reviewPanelIsOpen, setReviewPanelIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<null|Array<IResult>>(null)
  const [previewId, setPreviewId] = useState<null|number>(null)
  const [newChanges, setNewChanges] = useState(false)
  const [alertText, setAlertText] = useState('')
  const [safeChangeCallback, setSafeChangeCallback] = useState<null|(()=>void)>(null)
  const [dialogChangesIsOpen, setDialogChangesIsOpen] = useState(false)
  const [IoLinksIsOpen, setIoLinksIsOpen] = useState(false)
  const [incomingLinks, setIncomingLinks] = useState<Array<IResult>>([])
  const [outgoingLinks, setOutgoingLinks] = useState<Array<IResult>>([])
  const defaultFilters:ISearchFilters = {
    primary: 'date_created',
    when: 'after',
    date: null,
    order_by: 'date_created',
    sort: 'DESC'
  }
  const [searchFilters, setSearchFilters] = useState<ISearchFilters>(defaultFilters)

  const vimRef = useRef<Vim>(null)

  const [payload, setPayload] = useState<IPayload>({
    path: '',
    method: 'GET',
    body: null,
    callback: ()=>null
  })
  //useApi(opts, payload)

  function closeAuthModal(){
    if(vimRef.current){
      vimRef.current.focus()
    }
  }

  function _setResults(res:Array<any>){
    var parsed_results:Array<IResult> = res.map(x=>({
      ...x,
      date_created: new Date(x.date_created),
      date_updated: new Date(x.date_updated),
    }))
    return setResults(parsed_results)
  }

  function write(Content:string, callback:()=>void){
    console.log('write function called')
    // This function is passed to vim for :w
    // It must distinguish between a new file vs saving a new file
    if(postId === null){
      var pl = {
        path: 'notes/',
        method: 'POST',
        body: {content: Content},
      }
    } else {
      var pl = {
        path: 'notes/'+postId+'/',
        method: 'PUT',
        body: {content: Content},
      }
    }
    const PayLoad = {...pl, callback:(res:any)=>{
      updatePostId(res.id)
      getOutLinks()
      setNewChanges(false)
      // dev: try and extract the filename and print it on the status bar
      if(typeof(res.id)==='number'){
        // Do some callback magic
        callback()
      }
      console.log(res)
    }}

    setPayload(PayLoad)
  }

  function quit(override=false){

    const PayLoad = {
      path: '',
      method: 'logout',
      body: '',
      callback:(res:null)=>{
        updatePostId(null)
        if(vimRef.current){
          vimRef.current.flush('')
        }
        updateAuth(false)
        setAuthModal(true)
      }
    }
    if(override){
      setPayload(PayLoad)
    } else{
      safeClose(()=>{
        setPayload(PayLoad)
      })
    }
  }


  function safeClose(callback:()=>void){
    if(newChanges === false){
      callback()
    } else {
      setAlertText('Warning! You have unsaved changes.')
      setSafeChangeCallback(()=>()=>callback())
    }
  }

  function newFile(){
      safeClose(()=>{
        updatePostId(null)
        setIncomingLinks([])
        setOutgoingLinks([])
        if(vimRef.current){
          vimRef.current.flush('')
        }
        setNewChanges(false)
      })
  }
  
  function openDocument(){
    if(previewId){
      // check for unsaved changes
      setSearchPanelIsOpen(false)
      setIoLinksIsOpen(false)
      
      safeClose(()=>{
        updatePostId(previewId)
        setPreviewId(null)
      })
    }
  }


  function insertDocument(){
    if(results){
      const result = results.filter(x=>x['id']==previewId)[0]
      var itext = '['+result['title']+']'+'(VID='+result['id']+')'
      if(vimRef.current){
        vimRef.current.insert(itext)
        setSearchPanelIsOpen(false)
      }
    }
  }
  function deleteDocument(){
    const payload = {
      path: 'notes/'+previewId+'/delete/',
      method: 'GET',
      body: null,
      callback:(res:any)=>{
        if(res.delete !== false){
          if(results !== null){
            setResults(results.filter(x=>x.id != res.delete))
            setPreviewId(null)
          }
        }
      }
    }
    setAlertText('Are you sure you want to delete this forever?')
    setSafeChangeCallback(()=>()=>{
      setPayload(payload)
    })
  }


  function getBacklinks(){
    const payload = {
      path: 'notes/'+postId+'/getBacklinks/',
      method: 'GET',
      body: null,
      callback:(res:any)=>{
        setIncomingLinks(res)
      }
    }
    setPayload(payload)
  }

  function getOutLinks(){
    console.log('getting outlinks')
    const payload = {
      path: 'notes/'+postId+'/getOutlinks/',
      method: 'GET',
      body: null,
      callback:(res:any)=>{
        console.log(res)
        setOutgoingLinks(res)
      }
    }
    setPayload(payload)
  }

  function executeQuery(){
    const payload = {
      path: 'notes/search/?query='+query,
      method: 'GET',
      body: null,
      callback: (res:any)=>{
        console.log(res)
        _setResults(res)
        // Todo handle null results
      }
    }
    setSearchFilters(defaultFilters)
    setPayload(payload)
    setPreviewId(null)
  }

  useEffect(()=>{
    console.log(postId)
    console.log(auth)

    if(auth && postId){
      console.log('selected new post:'+postId)
      // logged in & postId has changed...
      const payload = {
        path: 'notes/'+postId+'/',
        method: 'GET',
        body: null,
        callback: (result:any)=> {
          console.log('got a new result!')
          updateContent(result.content)
          getBacklinks()
          getOutLinks()
          setNewChanges(false)
        }
      }
      setPayload(payload)
      // getBacklinks()
    }
  },[postId])

  useEffect(()=>{
    // when content is updated, trigger reload by changing the VimKey
    if(vimRef.current){
      vimRef.current.flush(content)
    }
  },[content])

  useEffect(()=>{
    console.log(searchFilters)
  },[searchFilters])

  useEffect(()=>{
    console.log('Safe Change Callback Set')
    if(safeChangeCallback !== null){
      setDialogChangesIsOpen(true)
    }
  },[safeChangeCallback])

  function resultRows(data:Array<IResult>){
    return(
      <div>{data !== null &&
        data.map(row=>{
        var selectedPreview = row['id'] == previewId ? 'selectedRow':''
        return (
          <div className={'searchResult '+selectedPreview} onClick={()=>{
            if(previewId==row['id']){
              setPreviewId(null)
            } else{
              setPreviewId(row['id'])
            }
          }}>
            <div className="searchResults_wrapper">
              <div className="searchResultTitle">{row['title']}</div>
              <div className="searchResultDate">{dateFormat(row[searchFilters.order_by],'dd/mmm/yyyy')}</div>

              </div>
          </div>
        )
      })}</div> 
    )
  }

  function filteredResults(results:Array<IResult>){
    var fresults = results.filter(x=>{
      if(searchFilters.date!==null){
        if(searchFilters.when==='before'){
          return x[searchFilters.order_by] <= searchFilters.date
        }
        if(searchFilters.when==='after'){
          return x[searchFilters.order_by] >= searchFilters.date
        }
      } else {
        return true
      }
    })
    fresults.sort((a,b)=>{
      if(searchFilters.sort==='ASC'){
        return a[searchFilters.order_by].getTime()-b[searchFilters.order_by].getTime()
      } else {
        return b[searchFilters.order_by].getTime()-a[searchFilters.order_by].getTime()
      }
    })
    return fresults
  }


  return (
    <div className='main'>
    <Auth payload={payload} setPayload={setPayload} setAuth={updateAuth} closeAction={closeAuthModal}/>
      <Vim  content={content} save={write} quit={quit} ref={vimRef} changesCallback={setNewChanges}/>
        
        <Modal
        isOpen={reviewPanelIsOpen}
        onRequestClose={()=>{}}
        className='DarkModal'
        overlayClassName='OpaqueOverlay'
        >
        <Review 
        setPayload={setPayload} 
        closeModal={()=>{
          setReviewPanelIsOpen(false)
          if(vimRef.current){
            vimRef.current.focus()
          }
        }} 
        updatePostId={updatePostId}
        backLinks={[...outgoingLinks,...incomingLinks]}
        />
        </Modal>

        <Modal
        isOpen={searchPanelIsOpen}
        onRequestClose={()=>{
          setSearchPanelIsOpen(false)
          if(vimRef.current){
            vimRef.current.focus()
          }

            
        }}
        className='SearchModal'
        overlayClassName='SearchOverlay'
        >
          <div className="searchBox">
            <form action="#" autoComplete="off" onSubmit={(e)=>{
              e.preventDefault()
              executeQuery()
            }}>
            <input className='greenput' name="query" autoFocus onChange={(e)=>setQuery(e.target.value)}/>
            <select className='greenput_narrow' onChange={(e)=>setSearchFilters({...searchFilters,primary:e.target.value})}>
              <option value='date_created'>Created</option>
              <option value="date_updated">Updated</option>
            </select>
            <select className='greenput_narrow' onChange={(e)=>setSearchFilters({...searchFilters,when:e.target.value})}>
              <option value="after">After</option>
              <option value="before">Before</option>
            </select>
            <input className='greenput_narrow' type="date" onChange={(e)=>setSearchFilters({...searchFilters,date:(e.target.value===''?null:new Date(e.target.value))})} />
            &nbsp; :: &nbsp;
            <select className='greenput_narrow' onChange={(e)=>setSearchFilters({...searchFilters,order_by:e.target.value as orderByDate})}>
              <option value='date_created'>Created</option>
              <option value="date_updated">Updated</option>
            </select>
            <select className='greenput_narrow' onChange={(e)=>setSearchFilters({...searchFilters,sort:e.target.value as sortType})}>
              <option value="DESC">DESC</option>
              <option value="ASC">ASC</option>
            </select>
            </form>

          {previewId !==null &&
          <div className="searchButtonsWrapper">
            <div className="button_open button" onClick={openDocument}>Open</div>
            <div className="button_insert button" onClick={insertDocument}>Insert</div>
            <div className="button_delete button" onClick={deleteDocument}>Delete</div>
          </div>
          }

          <div className="searchResults">
          {results !==null && results.some(x=>x) &&
            resultRows(filteredResults(results))
          }
          </div>
          <div className="spacer"></div>
          <div className="searchPreview"><pre>
          {previewId !== null && results !==null &&
            results.filter(x=>x['id']==previewId).map(prev=>prev['content']) 
          }
          {previewId ===null && (<span>search for a document to preview it here</span>)}
          </pre></div>
          </div>
        </Modal>

        <Modal isOpen={ dialogChangesIsOpen } className="SearchModal" overlayClassName="SearchOverlay"><div className="alertBox">
          <span className="alertText">{alertText}</span>
          <div className="button" onClick={()=>{
            if(safeChangeCallback !==null){
              safeChangeCallback()
            }
            setDialogChangesIsOpen(false)
          }}>Override</div>
          <div className="button" onClick={()=>setDialogChangesIsOpen(false)}>Abort</div>
          </div></Modal>

          <Modal isOpen={IoLinksIsOpen} className="SearchModal" overlayClassName="SearchOverlay" onRequestClose={()=>{ 
            setIoLinksIsOpen(false)
            if(vimRef.current){
              vimRef.current.focus()
            }
          }}>
        <div className="IoLinks_wrapper">
        <div className="IoLinks_navigation">
          {(previewId && incomingLinks !==null && outgoingLinks !==null) && (incomingLinks.filter(x=>x['id']==previewId).length>0 || outgoingLinks.filter(x=>x['id']==previewId).length>0) &&
            <div className="button" onClick={openDocument}>Open</div>
          }
        </div>
        <div className="IoLinks_incoming"><span className="title">Incoming Links</span>
            {incomingLinks !==null && 
            resultRows(incomingLinks)}
          </div>
          <div className="IoLinks_outgoing"><span className="title">Outgoing Links</span>
            {outgoingLinks !==null &&
            resultRows(outgoingLinks)}
          </div>
          <div className="IoLinks_preview">
            <pre>
              {previewId && incomingLinks &&
                incomingLinks.filter(object=>object['id']==previewId).map(res=>res['content'])
              }
              {previewId && outgoingLinks &&
                outgoingLinks.filter(object=>object['id']==previewId).map(res=>res['content'])
              }
            </pre>
          </div>
        </div>
        </Modal>

          <div className="main_buttons_wrapper">
            <div className="button" onClick={()=>setSearchPanelIsOpen(true)}>Explorer</div>
            <div className="button" onClick={()=>setReviewPanelIsOpen(true)}>Review</div>
            <div className="button" onClick={()=>newFile()}>New File</div>
            <div className="button" onClick={()=>setIoLinksIsOpen(true)}><span style={(incomingLinks.length>0||outgoingLinks.length>0) ? ({color:'red', fontWeight:'bold'}) : ({}) }>Connections { incomingLinks.length}/{outgoingLinks.length}</span></div>
          </div>
    </div>
  )
}

export default Main
