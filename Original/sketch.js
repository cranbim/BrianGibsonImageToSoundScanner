let capture;
var source;
var cells;
var step=10;
let slider

let bars=[]
let drones=[]
let triggers=[]
let numBars=5
let modifyShade=0
let scanH=200
let triggerThreshold=0.2
let inputHeight,inputWidth
let outputWidth, outputHeight
let bw, bh, stepsPerBar
let sensitivitySlider, sensitivity
let baseSlider, sensitivityBase
let startingLightness=-37
let startingSensitivity=8
let startingSensitivityBase=0.6

let testSounds=[]
let droneSounds=[]
let numSounds=11
let numDrones=5

let button;
let select;
let selectPrev=false
let constraints = {
    video: {
      deviceId: {
        exact: 0
      },
    }
  };
const devices = [];
let numDevices=0
let currentDevice=0



function preload(){
  for(let i=0; i<numSounds; i++){
    testSounds[i]=loadSound("./tempSounds/"+nf(i,2,0)+'.mp3')
  }
  for(let i=0; i<numDrones; i++){
    droneSounds[i]=loadSound("./droneSounds/drone"+nf(i,2,0)+'.mp3')
  }
}


function gotDevices(deviceInfos) {
  for (let i = 0; i !== deviceInfos.length; ++i) {
    const deviceInfo = deviceInfos[i];
    if (deviceInfo.kind == 'videoinput') {
      devices.push({
        label: deviceInfo.label,
        id: deviceInfo.deviceId
      });
    }
  }
  console.log(devices);
  numDevices=devices.length
  let supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
  console.log(supportedConstraints);
  constraints = {
    video: {
      deviceId: {
        exact: devices[currentDevice].id
      },
    }
  };
  capture=createCapture(constraints);
}


function setup() {
  createCanvas(800,400);
  navigator.mediaDevices.enumerateDevices()
    .then(gotDevices);
  button=new Button(200,300,50)
  select=new Button(50,350,30)
  inputWidth=width/2
  inputHeight=height
  outputWidth=width/4
  outputHeight=height
  // colorMode(HSB);
  source=createImage(height, height);
  capture = createCapture(VIDEO);
  capture.hide();
  bw=height/numBars
  for(let i=0; i<numBars; i++){
    bars.push(new BarOfGreyness(i*bw, inputWidth, inputHeight, bw, scanH, step))
  }
  bh=outputHeight/numBars
  for(let i=0; i<numBars; i++){
    drones.push(new DroneChannel(inputWidth, i*bh, outputWidth, bh))
  }
  stepsPerBar=floor(bw/step)
  console.log('triggers: '+stepsPerBar*numBars)
  for(let i=0; i<stepsPerBar*numBars; i++){
    triggers.push(new Trigger(inputWidth+outputWidth, i*step, outputWidth, step, floor(i/stepsPerBar), i%stepsPerBar))
  }
  slider = createSlider(-100, 100,startingLightness,1);
  slider.position(inputWidth*0.1, inputWidth*0.1);
  slider.size(inputWidth*0.8);
  sensitivitySlider = createSlider(1,10,startingSensitivity,0.25);
  sensitivitySlider.position(inputWidth*0.1, inputWidth*0.2);
  sensitivitySlider.size(inputWidth*0.8);
  baseSlider = createSlider(0.3,0.7,startingSensitivityBase,0.025);
  baseSlider.position(inputWidth*0.1, inputWidth*0.3);
  baseSlider.size(inputWidth*0.8);
  droneSounds.forEach(ds=>{
    ds.loop()
    ds.setVolume(0)
  })
}

function draw() {
  background(235,135,0)
  sensitivityBase=baseSlider.value()
  sensitivity=sensitivitySlider.value()
  modifyShade=slider.value()
  // modifyShade=map(mouseY,0,height,-100,+100)
  // triggerThreshold=map(mouseX,0,width,50,150)
  source.copy(capture, capture.width*0.25, 0,capture.width*0.65, capture.height, 0,0,height, height);
  image(source,0,0)
    
  source.loadPixels();
  bars.forEach(bar=>{
    bar.scan(source.pixels)
  })
  drones.forEach((drone,i)=>{
    drone.show(source.pixels)
    drone.run(bars[i].val)
    droneSounds[i].setVolume(drone.val*0.5)
  })
  triggers.forEach((trigger,i)=>{
    trigger.show()
    trigger.run(0)
    let soundNum=i%numSounds
    if(true){
      //if(mouseIsPressed && trigger.didTrigger){
      if(button.isDown && trigger.didTrigger){
        testSounds[soundNum].setVolume(0.2)
        testSounds[soundNum].play()
      }
    }
  })
  fill(0,50,230)
  // stroke(255)
  noStroke()
  strokeWeight(1)
  textSize(height*0.05)
  text(`lightness ${slider.value()}`,inputWidth*0.1, inputWidth*0.09)
  text(`sensitivity ${sensitivitySlider.value()}`,inputWidth*0.1, inputWidth*0.19)
  text(`sensitivity base ${baseSlider.value()}`,inputWidth*0.1, inputWidth*0.29)
  text('drones',inputWidth+outputWidth*0.1,inputHeight*0.1)
  text('triggers',inputWidth+outputWidth*1.1,inputHeight*0.1)
  
  button.run()
  button.show()
  select.run()
  select.show()
  if(select.isDown && select.isDown!=selectPrev){
    //trigger
    console.log('trigger')
    currentDevice=(currentDevice+1)%numDevices
    constraints.video.deviceId.exact=devices[currentDevice].id
    capture=createCapture(constraints);
  }
  selectPrev=select.isDown
}


class Trigger{
  constructor(x,y,w,h,barIndex,trigIndex){
    console.log(barIndex, trigIndex)
    this.x=x
    this.y=y
    this.valPoint=w*0.8
    this.w=w
    this.h=h
    this.val=0
    this.valHist=[]
    this.maxHist=200
    this.xStep=this.valPoint*0.95/this.maxHist
    this.barIndex=barIndex
    this.trigIndex=trigIndex
    this.delayAfterTrigger=60
    this.lastTriggered=0
  }
  
  run(){
    this.didTrigger=false
    if(this.lastTriggered>0){
      this.lastTriggered--
    }
    let valNow=bars[this.barIndex].scanSteps[this.trigIndex]
    if(valNow<triggerThreshold && this.lastTriggered==0) {
      this.val=1
      this.didTrigger=true
      this.lastTriggered=this.delayAfterTrigger
    }
    this.valHist.push(this.val)
    // console.log(this.barIndex, this.trigIndex, this.val)
    if(this.valHist.length>this.maxHist){
      this.valHist.shift()
    }
    this.val+=(0-this.val)*0.1
  }
  
  show(){
    push()
    translate(this.x, this.y)
    // stroke(255)
    noStroke()
    fill(200)
    rect(0,0,this.w, this.h)
    let x=this.valPoint
    let y=0
    beginShape()
    for(let i=this.valHist.length-1; i>=0; i--){
      y=this.valHist[i]*this.h
      vertex(x, this.h-y)
      x-=this.xStep
    }
    noFill()
    stroke(0)
    strokeWeight(1)
    endShape()
    fill(200,0,0)
    noStroke()
    y=this.val*this.h
    ellipse(this.valPoint, this.h-y, 2)
    pop()
  }
}


class DroneChannel{
  constructor(x,y,w,h){
    this.x=x
    this.y=y
    this.valPoint=w*0.8
    this.w=w
    this.h=h
    this.val=0
    this.valHist=[]
    this.maxHist=200
    this.xStep=this.valPoint*0.95/this.maxHist
    
  }
  
  run(val){
    this.val=constrain(sensitivityBase + (val-sensitivityBase) * sensitivity, 0,1)
    this.valHist.push(this.val)
    if(this.valHist.length>this.maxHist){
      this.valHist.shift()
    }
  }
  
  show(){
    push()
    translate(this.x, this.y)
    stroke(255)
    fill(180)
    rect(0,0,this.w, this.h)
    let x=this.valPoint
    let y=0
    beginShape()
    for(let i=this.valHist.length-1; i>=0; i--){
      y=this.valHist[i]*this.h
      vertex(x, this.h-y)
      x-=this.xStep
    }
    noFill()
    stroke(0)
    strokeWeight(1)
    endShape()
    fill(200,0,0)
    noStroke()
    y=this.val*this.h
    ellipse(this.valPoint, this.h-y, 5)
    pop()
  }
  
  
}




class BarOfGreyness{
  constructor(x,w,h,bw,scanH,step){
    this.x=x
    this.w=w
    this.bw=bw
    this.h=h
    this.step=step
    this.scanH=scanH
    this.scanBand=0
    this.scanSteps=[]
    this.val=0
  }
  
  scan(sourcePixels){
    noStroke()
    let offset,cr,cg,cb, shade
    let avgShade=0
    let cellCount=0
    for(let j=0; j<this.h; j+=this.step){
      let scanBandVal=0
      let scanStep=0
      for(let i=0; i<this.bw; i+=this.step){
        offset=(j*(this.w)+(this.x+i))*4
        cr=sourcePixels[offset+0]
        cg=sourcePixels[offset+1]
        cb=sourcePixels[offset+2]
        shade=(cr+cg+cb)/3 + modifyShade
        scanBandVal+=shade
        avgShade+=shade
        cellCount++
        fill(shade)
        rect(this.x+i,0+j,this.step, this.step)
        if(j<=this.scanH && j+this.step>this.scanH){
          this.scanSteps[scanStep]=shade/(255+modifyShade)
        }
        scanStep++
      }
      scanBandVal=scanBandVal/scanStep
      if(j<=this.scanH && j+this.step>this.scanH){
        this.scanBand=scanBandVal
      }
    }
    avgShade=avgShade/cellCount
    this.val=avgShade/(255+modifyShade)
    // noFill()
    fill(avgShade,150)
    // stroke(0)
    rect(this.x,0,this.bw, this.h)
    fill(this.scanBand)
    rect(this.x,this.scanH,this.bw,this.step)
    this.scanSteps.forEach((ss,i)=>{
      if(ss<triggerThreshold){
        fill(255,0,0)
      } else {
        fill(ss*255)
      }
      rect(this.x+(i+0.25)*this.step, this.scanH+this.step*0.25, this.step*0.5,this.step*0.5)
    })
  }
}


class Button{
  constructor(x,y,r){
    this.x=x;
    this.y=y;
    this.r=r;
    this.hover=false;
    this.isMouse=false;
    this.isTouch=false;
    this.isDown=false;
  }
  
  run(){
    this.hover=dist(mouseX, mouseY,this.x,this.y)<this.r
    this.isMouse=mouseIsPressed && this.hover
    let anyTouches=false
    touches.forEach(touch=>{
      if(dist(touch.x,touch.y,this.x, this.y)<this.r){
        anyTouches=true
      }
    })
    this.isTouch=anyTouches
    // this.isTouch=touches.reduce((count,touch)=>{
    //   count+(dist(touch.x,touch.y,this.x, this.y)<this.r?1:0)
    // },0)>0
    this.isDown=this.isMouse || this.isTouch
  }
  
  show(){
    fill(128)
    if(this.isTouch){
      fill(0,0,255)
    } else if(this.isMouse){
      fill(0,255,0)
    } else if(this.hover){
      fill(235,135,0)
    } else {
      fill(128)
    }
    ellipse(this.x, this.y,this.r*2)
  }
}
