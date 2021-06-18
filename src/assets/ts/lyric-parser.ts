const timeExp = /\[(\d{2,}):(\d{2})(?:[\.\:](\d{2,3}))?]/g

const STATE_PAUSE = 0
const STATE_PLAYING = 1

const tagRegMap = {
    title: 'ti',
    artist: 'ar',
    album: 'al',
    offset: 'offset',
    by: 'by'
}

function noop(){}

export default class Lyric{
    private lrc: string;
    private tags: {};
    private lines: any[];
    private handler: () => void;
    private state: number;
    private curLineIndex: number;
    private speed: number;
    private offset: number;
    private startStamp: number
    private timer: {} | null
    constructor(lrc:string, handler=noop,speed=1) {
        this.lrc = lrc
        this.tags = {}
        this.lines = []
        this.handler = handler
        this.state = STATE_PAUSE
        this.curLineIndex = 0
        this.speed = speed
        this.offset = 0
        this.startStamp = 0
        this.timer = null
        this._init()
    }
    _init(){
        this._initTag()
        this._initLines()
    }
    _initTag(){
        for(let tag in tagRegMap){
            // @ts-ignore
            const matches = this.lrc.match(new RegExp(`\\[${tagRegMap[tag]}:([^\\]]*)]`, 'i'))
            // @ts-ignore
            this.tags[tag] = matches && (matches[1] || '')
        }
    }
    _initLines(){
        const lines = this.lrc.split('\n')
        for(let i=0;i<lines.length;i++){
            const line = lines[i]
            let result = timeExp.exec(line)
            if(result){
                const txt = line.replace(timeExp,'').trim()
                if(txt){
                    if(result[3].length === 3){
                        // @ts-ignore
                        result[3] = result[3]/10
                    }
                    this.lines.push({
                        time: Number(result[1])*60*1000+Number(result[2])*1000+ (Number(result[3]) || 0) * 10,
                        txt
                    })
                }
            }
        }
        this.lines.sort((a,b)=>{
            return a.time - b.time
        })
    }
    _findCurLineIndex(time:number){
        for(let i=0;i<this.lines.length;i++){
            if(time<=this.lines[i].time){
                return i
            }
        }
        return this.lines.length-1
    }
    _callHandler(i:number){
        if(i<0){
            return
        }
        // @ts-ignore
        this.handler({
            txt: this.lines[i].txt,
            lineNum: i
        })
    }
    _playReset(isSeek=false){
        let line = this.lines[this.curLineIndex]
        let delay
        if(isSeek){
            delay = line.time - (+new Date() - this.startStamp!)
        }else {
            let preTime = this.lines[this.curLineIndex-1]?this.lines[this.curLineIndex-1].time : 0
            delay = line.time - preTime
        }
        this.timer = setTimeout(()=>{
            this._callHandler(this.curLineIndex++)
            if(this.curLineIndex<this.lines.length && this.state === STATE_PLAYING){
                this._playReset()
            }
        },(delay/this.speed))
    }

    changeSpeed(speed:number){
        this.speed = speed
    }
    play(offset=0,isSeek=false){
        if(!this.lines.length){
            return
        }
        this.state = STATE_PLAYING
        this.curLineIndex = this._findCurLineIndex(offset)

        this._callHandler(this.curLineIndex-1)
        this.offset = offset
        this.startStamp = +new Date() - offset

        if(this.curLineIndex<this.lines.length){
            // @ts-ignore
            clearTimeout(this.timer)
            this._playReset(isSeek)
        }
    }

    togglePlay(offset:number){
        if(this.state === STATE_PLAYING){
            this.stop()
            this.offset = offset
        }else {
            this.state = STATE_PLAYING
            this.play(offset,true)
        }
    }

    stop(){
        this.state = STATE_PAUSE
        this.offset = 0
        // @ts-ignore
        clearTimeout(this.timer)
    }

    seek(offset:number){
        this.play(offset,true)
    }
}
