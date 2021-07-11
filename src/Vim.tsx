import React, {useImperativeHandle} from 'react';
import './index.css';
import './Vim.css';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/the-matrix.css';
import 'codemirror/addon/dialog/dialog.css';
import CodeMirror from 'codemirror';
import md5 from 'md5';
//import CodeMirror from '@jkvim/react-codemirror2'
//require('codemirror/lib/codemirror.js');
require('codemirror/mode/markdown/markdown.js');
require('codemirror/mode/javascript/javascript');
require('codemirror/keymap/vim.js');
require('codemirror/addon/dialog/dialog.js');
require('codemirror/addon/search/searchcursor.js');
require('codemirror/mode/clike/clike.js');
require('codemirror/addon/edit/matchbrackets.js');

interface IProps{
  content: string,
  defaultMsg: string,
  writeStatus: string,
  save: (content:string,callback:()=>void)=>void;
  quit: (override:boolean)=>void;
  changesCallback: (x:boolean)=>void; // lets parent know when changes have been made
  ref: React.MutableRefObject<Vim|null>,
}
interface IState{
  content: string,
  currentSig: string,
  lastSig: string,
  writeStatus: string,
  commandDisplay: string,
  vimMode: string,
  widgets: Array<IWidget>,
}

interface IWidget {
  title: string,
  width: number|null,
  url: string,
  line: number,
  widget: null|any,
}


class Vim extends React.Component<IProps, IState> {

  private codeInput = React.createRef<HTMLTextAreaElement>();
  private editor:CodeMirror.Editor|null;
  
  static defaultProps = {
    content: '',
    defaultMsg: '93',
    writeStatus: 'File written to database!',
    save: (content:string)=>{},
    changesCallback: (x:boolean)=>{},
  }

  constructor(props: IProps){
    super(props);
    this.state = {
      content: this.props.content,
      currentSig: '',
      lastSig: '',
      writeStatus: this.props.defaultMsg,
      commandDisplay: '',
      vimMode: 'normal',
      widgets: [],
    }
    this.editor = null;
    this.vimrc();
  }

  componentDidMount(){

    if(this.codeInput.current){

      this.editor = CodeMirror.fromTextArea(this.codeInput.current,{mode:'markdown', keyMap:'vim',theme:'the-matrix', lineNumbers:true, showCursorWhenSelecting: true, lineWrapping:true});
      var keys = '';
      this.editor.getDoc().setValue(this.props.content)
      this.editor.on("change",(edit)=>{
        const data = edit.getValue()
        const sig = md5(data)
        this.setState({
          content:data,
          currentSig: sig
        });
        if(this.state.lastSig !== sig){
          this.setState({writeStatus:'Unsaved changes...'})
          this.props.changesCallback(true)
        }
      });

      CodeMirror.on(this.editor, 'vim-keypress', (key:string)=>{
        keys = keys + key;
        this.setState({commandDisplay:keys})
      });

      CodeMirror.on(this.editor, 'vim-command-done', (e:any)=> {
        keys = '';
        this.setState({commandDisplay:keys})
      });

      CodeMirror.on(this.editor, 'vim-mode-change', (e:any)=> {
        this.setState({vimMode:e.mode})
      });
    
    }

  }

  insert = (text:string) => {
    if(this.editor){
      var doc = this.editor.getDoc()
      var cursor = doc.getCursor()
      doc.replaceRange(text,cursor)
    }
  }


  flush = (text:string) => {
    if(this.editor){
      var doc = this.editor.getDoc()
      doc.setValue(text)
    }
  }

  insert_image = (line:number,src:string,width:null|number) => {
    if(this.editor){
      var doc = this.editor.getDoc()
      const element = document.createElement('img')
      element.src= src
      console.log(width)
      if(width){
        element.width=width
      }
      return doc.addLineWidget(line, element,{above:false, noHScroll:true})
    }
  }

  reload_images = () => {
    var pattern = /!\[(.*?)\](\[width=(\d{1,})\])?\((.*)\)/
    var lines = this.state.content.split('\n')
    var active_widgets:Array<IWidget> = []
    this.state.widgets.map(x=>x.widget.clear())
    for(var i=0;i<lines.length; i++){
      var match = pattern.exec(lines[i])
      if(match){
        var image = {
          title: match[1],
          width: (match[3]===null)?null:parseInt(match[3]),
          url: match[4],
          line: i+1,
          widget: this.insert_image(i+1,match[4],(match[3]===null)?null:parseInt(match[3]))
        }
        console.log(image)
        active_widgets.push(image)
      }
    }
    this.setState({
      widgets:active_widgets
    })
  }


  vimrc = () =>{
    CodeMirror.Vim.map('J', '5j', 'normal')
    CodeMirror.Vim.map('K', '5k', 'normal')
    CodeMirror.Vim.mapCommand('jk', 'action', 'exitInsertMode', {}, { context: 'insert' });

    CodeMirror.Vim.mapCommand('U', 'action', 'redo', {}, { context: 'normal' });

    CodeMirror.Vim.image_reload = ()=>{
      this.reload_images()
    }
    CodeMirror.Vim.image_disable = () => {
      this.state.widgets.map(x=>x.widget.clear())
    }
    CodeMirror.Vim.quit = () => {
      this.props.quit(false)
    }
    CodeMirror.Vim.wquit = () => {
      this.props.save(this.state.content,()=>this.props.quit(true))
    }
    CodeMirror.commands.save = ()=>{
      this.props.save(this.state.content,()=>{})
      this.props.changesCallback(false)
      this.setState({
        writeStatus:this.props.writeStatus,
        lastSig: md5(this.state.content)
      });
    };
  }
  

  statusBars = () => {
    return (
      <div className="statusBar_wrapper">
      <div className="statusBar_write">{this.state.writeStatus}</div>
        <div className="statusBar_buffer">Key buffer: {this.state.commandDisplay}</div>
        <div className="statusBar_mode">Vim mode: { this.state.vimMode }</div>
      </div>
    )
  }

  render = () => {
    const statusBar = this.statusBars()
    return(
      <div className="vim">
        <textarea id="code" name="code" className="code" ref={this.codeInput} ></textarea>
        {statusBar}
      </div>
    )
  }
}

export default Vim;
