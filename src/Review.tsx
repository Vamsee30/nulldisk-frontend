import {create} from 'domain';
import React, {useState, useEffect,} from 'react';
import createPersistedState from 'use-persisted-state'
import {IPayload} from './hooks/useApi';
import './review.css';

interface IResult {
  id: number,
  title: string,
  content: string,
  date_created: Date,
  date_updated: Date,
  author: number
}

interface IDeck {
  note: IResult,
  easiness: number,
  interval: number,
  repetitions: number,
  due_date: Date,
  last_reviewed: Date
}

interface ICard {
  content: string,
  blanks: Array<{word: string, hidden: boolean}>
}

interface IProps {
  setPayload: (payload:IPayload)=>void,
  closeModal: ()=>void,
  updatePostId: (post:number)=>void,
  backLinks: Array<IResult>
}


function Review(props:IProps):JSX.Element {

  const useCards = createPersistedState('cards')
  const [cards, setCards] = useCards<Array<ICard>|null>(null)
  const [jsxCards, setJsxCards] = useState<Array<any>>([])
  const useDeck = createPersistedState('deck')
  const [deck, _setDeck] = useDeck<Array<IDeck>>([])
  const useDue = createPersistedState('due')
  const [due, setDue] = useDue<Array<IDeck>>([])
  const useIncorrect = createPersistedState('incorrect')
  const [incorrect, setIncorrect] = useIncorrect<Array<number>>([])
  const useCorrect = createPersistedState('correct')
  const [correct, setCorrect] = useCorrect<Array<number>>([])
  const useDaysAhead = createPersistedState('daysAhead')
  const [daysAhead, _setDaysAhead] = useDaysAhead<number>(0)
  const useToday = createPersistedState('today')
  const [today, setToday] = useToday<Date>(new Date())
  const [quality, _setQuality] = useState<null|number>(null)
  const usePageIndex = createPersistedState('pageIndex')
  const [pageIndex, setPageIndex] = usePageIndex(0)
  const useCardIndex = createPersistedState('cardIndex')
  const [cardIndex, setCardIndex] = useCardIndex(0)
  const useQuery = createPersistedState('query')
  const [query, setQuery] = useQuery('')

  function setDeck(_deck:Array<any>){
    const revs = _deck.map((r)=>{
      const note =  {...r.note, date_created: new Date(r.note.date_created), date_updated: new Date(r.note.date_updated) } 
      return { ...r, note:note, easiness:parseFloat(r.easiness), due_date: new Date(r.due_date), last_reviewed: new Date(r.last_reviewed) }
    })
    _setDeck(revs)
    console.log(revs)
  }

  function setQuality(quality:string){
    if ( quality === '' ) {
      _setQuality(null)
    } else {
      _setQuality(parseInt(quality))
    }
  }

  function setDaysAhead(days:any){
    if(!isNaN(days)){
      _setDaysAhead(parseInt(days))
    }
  }

  function extractCards(content:string):Array<string>{
    // Extract blocks that contain cards
    const blocks = content.split(/\n{2,}/)
    const cards = blocks.filter((x)=>/:{2,}|__/.test(x))
    return cards
  }

  function extractBlanks(card:string):Array<string>{
    const inline = /[^:]::([^:]*?)(?:\n|$)/g
    const blank = /(__\S.*?\S__)/g
    const multiline = /[^:]:::((?:\s(?!___).*)*)/gm
    var results = []
    var match
    while(match=multiline.exec(card)){
      results.push({content: match[1].trim(), index:match.index})
    }
    while(match=inline.exec(card)){
      results.push({content: match[1].trim(), index:match.index})
    }
    while(match=blank.exec(card)){
      results.push({content: match[1].trim(), index:match.index})
    }
    results.sort((a,b)=>a.index-b.index)
    console.log('SHOWW MEE')
    console.log(results)
    return results.map((x)=>x.content)
  }

  function toggleBlank(cardI:number, blankI:number):void{
    if(cards !==null ){
      var cardsObject = cards.map((card,pageIndex)=>{
        if(pageIndex===cardI){
          var blankObjects = card.blanks.map((blank,blankIndex)=>{
            if(blankIndex===blankI){
              return {...blank, hidden:!blank.hidden}
            } else {
              return blank
            }
          })
          return {...card, blanks:blankObjects}
        } else {
          return card
        }
      })
      setCards(cardsObject)
    }
  }


  function submitSearch(event:React.FormEvent){
    event.preventDefault()
    props.setPayload({
      path: 'review/search/?query='+query,
      method: 'GET',
      body: null,
      callback: (res)=>{
        setDeck(res)
        setIncorrect([])
        setCorrect([])
      }
    })
  }

  function submitQuality(event:React.FormEvent){
    event.preventDefault()
    if (quality != null){
      props.setPayload({
        path: 'review/memorize/',
        method: 'POST',
        body: {...due[pageIndex],quality:quality},
        callback: (res)=>{
          console.log(res)
          if(parseInt(res.repetitions)===0){
            setIncorrect(ignore=>[...ignore,parseInt(res.note.id)])
          } else {
            setCorrect(ignore=>[...ignore,parseInt(res.note.id)])
          }
        }
      })
    }
  }

  function cforward() { 
    if(cards !==null && cardIndex+2 <= cards.length){
      setCardIndex(cardIndex+1)
    }
  }

  function cbackward() { 
    if(cardIndex > 0){
      setCardIndex(cardIndex-1)
    }
  }

  function pforward() { 
    if(pageIndex+2 <= due.length){
      setPageIndex(pageIndex+1)
    }
  }

  function pbackward() { 
    if(pageIndex-1 >= 0){
      setPageIndex(pageIndex-1)
    }
  }

  function Title():JSX.Element {
    if(due.length>0){
      return <>{due[pageIndex].note.title}</>
    }
    return <></>
  }

  function escapeRegex(text:string):string{
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  }

  useEffect(()=>{
    var jsxcards:Array<any> = []
    if (cards !==null ){
      for( const [pageIndex, {content,blanks}] of cards.entries() ){
        var contentArray:Array<any> = [content+' ']
        for( const [blankIndex, {word,hidden}] of blanks.entries() ){
          var append:any = []
          for(var i=0; i < contentArray.length; i=i+2){
            const components = contentArray[i].split(word)
            const visibility = (hidden)?'hidden':'visible';
            if(contentArray[i].match(escapeRegex(word))){
              var insert =[]
              for(var y=0; y < components.length; y++){
                insert.push(components[y])
                if(components[y+1]){
                  insert.push(
                                  <span className={visibility} onClick={()=>toggleBlank(pageIndex,blankIndex)}>{word}</span>
                                )
                }
              }
              append.push({key:i, items:insert})
            }
          }
          for(const [i, {key,items}] of append.entries()){
            contentArray.splice(key,1,...items)
          }
        }
        jsxcards.push(contentArray)
      }
    }
    setJsxCards(jsxcards)
    // setCardIndex(0)
  },[cards])

  useEffect(()=>{
    if(due.length>0){
      console.log(`Loading card ${pageIndex}`)
      console.log(due[pageIndex].note.id)
      props.updatePostId(due[pageIndex].note.id)
      var newCards = extractCards(due[pageIndex].note.content).map((card)=>{
        const blanks = extractBlanks(card).map((blank)=>(
          {
            word: blank,
            hidden: true
          }
        ))
        const cardObject = {
          content: card,
          blanks: blanks
        }
        return cardObject
      })
      if(cards !== null){
        if( JSON.stringify(cards.map(x=>x.content)) != JSON.stringify(newCards.map(x=>x.content)) ){
          setCardIndex(0)
        }
      }
      setCards(newCards)
    } else {
      setCards(null)
    }
  },[pageIndex,due])


  useEffect(()=>{
    const newPages = deck.filter((x)=>x.repetitions===0)
    const overDuePages = deck.filter((x)=>x.repetitions>0 && x.due_date <= today)
    var ignore = [...incorrect,...correct]
    const new_due = [...newPages,...overDuePages].filter(x=>!ignore.includes(x.note.id))
    if (JSON.stringify(new_due.map(x=>x.note.content)) != JSON.stringify(due.map(x=>x.note.content)) ){
      setPageIndex(0)
      setCardIndex(0)
      setDue(new_due)
      console.log('WE ARE NOT THE SAME')
    }
  },[deck,today,correct,incorrect])

  useEffect(()=>{
    var date:Date = new Date()
    date.setDate(date.getDate() + daysAhead)
    setToday(date)
    setDeck(deck) // this is only here to unserialize Date fields when waking up from local storage.
  },[daysAhead])

  useEffect(()=>{
    if( due.filter(x=>![...correct,...incorrect].includes(x.note.id)).length === 0 ){
      if ( incorrect.length > 0 ) {
        setIncorrect([])
      }
    }
  },[correct,incorrect])


  return(
    <>

          <form onSubmit={submitSearch}>
          <input className="greenput" type="text" defaultValue={query} placeholder="Search for Deck" onChange={(e)=>setQuery(e.target.value)}/>
          </form>

            <div className="review_bar">
            <div>            <input className="greenput_tight" defaultValue={daysAhead} placeholder="Advance Days" type="text" onChange={(e)=>setDaysAhead(e.target.value)} /></div>
            <div>Decks: {deck.length}</div>
            <div>Due: {due.length}</div>
            <div>Done: {correct.length}+/{incorrect.length}-</div>
            <div>Cards: { cards != null ? (<>{cardIndex+1}/{ cards.length }</>):(<>None</>)}</div>
            </div>
          <br />
          <div className="main_buttons_wrapper">
            <div className="button" onClick={cbackward}>Prev Card</div>
            <div className="button" onClick={cforward}>Next Card</div>
            <div className="button" onClick={pbackward}>Prev Deck</div>
            <div className="button" onClick={pforward}>Next Deck</div>
            <div className="button" onClick={()=>props.closeModal()}><span style={(props.backLinks.length>0)?{color:'red',fontWeight:'bold'}:{}}>Context</span></div>
          </div>

          <h1><Title/></h1>
          <pre>
          {jsxCards[cardIndex]}
          </pre>
          {cards !=null && cardIndex+1===cards.length &&
          <form onSubmit={submitQuality}>
          <select className="greenput_narrow" id="quality" onChange={(e)=>setQuality(e.target.value)}>
          <option value="">---</option>
          <option value="5">Easy</option>
          <option value="4">Correct with hessitation</option>
          <option value="3">Correct but difficult</option>
          <option value="2">Incorrect, but almost</option>
          <option value="0">Incorrect, blackout</option>
          </select>
          &nbsp;<input className="greenput_narrow" type="submit" value="Submit" />
          </form>
          }

    </>
  )
}

export default Review;
