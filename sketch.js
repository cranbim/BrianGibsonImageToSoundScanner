let version=0.015
let capture;
var source;
var cells;
var step=10;
let slider
let logo

let bars=[]
let drones=[]
let dronesV=[]
let triggers=[]
let numBars=5
let triggerBar=Math.floor(numBars/2)
let modifyShade=0
let scanH=200
let scanV=200
let triggerThreshold=0.2
let inputHeight,inputWidth
let outputWidth, outputHeight
let bw, bh, stepsPerBar
let sensitivitySlider, sensitivity
let baseSlider, sensitivityBase
let startingLightness=-37
let startingSensitivity=8
let startingSensitivityBase=0.6
let viewportWidth
let viewportHeight

let testSounds=[]
let droneSounds=[]
let numSounds=20
let numDrones=5
let droneMaxVolume=0.3

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
// let captureW=640
// let captureH=480
let sourceW=400
let sourceH=400
let hasStarted=false
let startButton
let stopButton


function preload(){
  for(let i=0; i<numSounds; i++){
    testSounds[i]=loadSound("./tempSounds/trigger"+nf(i,2,0)+'.mp3')
  }
  for(let i=0; i<numDrones; i++){
    droneSounds[i]=loadSound("./droneSounds/drone"+nf(i,2,0)+'.mp3')
  }
  logo=loadImage('./CrispySmokedWeb_Bacon.png')
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
  if(windowWidth>windowHeight/1.6){
    createCanvas(windowHeight/1.8, windowHeight);
  } else {
    createCanvas(windowWidth, windowHeight);
  }
  // console.log(windowHeight, floor(windowHeight/1.6))
  // createCanvas(535, 800);
  viewportWidth=width
  viewportHeight=height
  inputWidth=floor(viewportWidth*0.7)
  step=floor(inputWidth/40)
  inputWidth=step*40
  inputHeight=inputWidth//floor(viewportWidth*0.7)
  triggerWidth=floor(inputWidth*3/7)
  triggerHeight=inputWidth
  droneWidth=inputWidth
  droneHeight=inputWidth*0.5
  sourceW=inputWidth
  sourceH=inputHeight
  navigator.mediaDevices.enumerateDevices()
    .then(gotDevices);
  button=new Button(viewportWidth*0.8,viewportHeight*0.875,viewportHeight*0.08,'triggers')
  select=new Button(viewportWidth*0.8,viewportHeight*0.725,viewportHeight*0.04,'cam')
  stopButton=new Button(viewportWidth*0.8,viewportHeight*0.625,viewportHeight*0.04,'stop')
  startButton=new Button(viewportWidth*0.5,viewportHeight*0.5,viewportWidth*0.25,'start')
  
  // colorMode(HSB);
  source=createImage(sourceW, sourceH);
  capture = createCapture(VIDEO,{ flipped:true });
  capture.hide();
  bw=inputWidth/numBars
  let scanForTriggers=false
  for(let i=0; i<numBars; i++){
    scanForTriggers=(i==triggerBar)
    bars.push(new BarOfGreyness(i*bw, 0, inputWidth, inputHeight, bw, scanForTriggers, scanH, step))
  }
  bh=floor(outputHeight/numBars)
  // for(let i=0; i<numBars; i++){
  //   drones.push(new DroneChannel(inputWidth, i*bh, outputWidth*0.5, bh))
  // }
  dw=floor(droneWidth/numBars)
  for(let i=0; i<numBars; i++){
    dronesV.push(new DroneChannelVert(i*dw, inputHeight, dw, droneHeight))
  }
  stepsPerBar=floor(bw/step)
  console.log('triggers: '+stepsPerBar*numBars)
  for(let i=0; i<stepsPerBar*numBars; i++){
    triggers.push(new Trigger(inputWidth, i*step, triggerWidth, step, floor(i/stepsPerBar), i, triggerBar))
  }
  
  droneSounds.forEach(ds=>{
    ds.loop()
    ds.setVolume(0)
  })
}

function draw() {
  if(hasStarted){
    realDraw()
  } else {
    preDraw()
  }
}

function preDraw(){
  background(50)
  push()
  translate(width*0.25, height*0.925)
  imageMode(CENTER)
  scale(0.4*width/500)
  image(logo,0,0)
  pop()
  textAlign(LEFT, CENTER)
  textFont('courier')
  textSize(width*0.03)
  text(version,width*0.05, width*0.05)
  textAlign(CENTER, CENTER)
  textSize(width*0.03)
  text('IS A WORLD WELL MAPPED A WORLD CONTROLLED?',width/2, height*0.15)
  textSize(width*0.05)
  text('Image to Sound Scanner',width/2, height*0.2)
  textSize(width*0.03)
  text('for Brian Gibson',width*0.35, height*0.25)
  text('by Dave Webb',width*0.6, height*0.275)
  textSize(width*0.03)
  text('@crispysmokedweb',width*0.75, height*0.95)
  startButton.run()
  startButton.show()
  if(startButton.isDown){
    hasStarted=true
    setupSliders()
    startDrones()
    constraints.video.deviceId.exact=devices[currentDevice].id
    capture=createCapture(constraints);
  }
}

function startDrones(){
  droneSounds.forEach(ds=>{
    ds.loop()
    ds.setVolume(0)
  })
}

function stopDrones(){
  droneSounds.forEach(ds=>{
    ds.stop()
    ds.setVolume(0)
  })
}

function stopSliders(){
  removeElements()
}

function setupSliders(){
  slider = createSlider(-100, 100,startingLightness,1);
  slider.position(inputWidth*0.1,inputHeight+droneHeight+(height-inputHeight-droneHeight)*0.2);
  slider.size(triggerHeight*0.8);
  sensitivitySlider = createSlider(1,10,startingSensitivity,0.25);
  sensitivitySlider.position(inputWidth*0.1,inputHeight+droneHeight+(height-inputHeight-droneHeight)*0.4);
  sensitivitySlider.size(inputWidth*0.8);
  baseSlider = createSlider(0.3,0.7,startingSensitivityBase,0.025);
  baseSlider.position(inputWidth*0.1,inputHeight+droneHeight+(height-inputHeight-droneHeight)*0.6);
  baseSlider.size(inputWidth*0.8);
}

function realDraw() {
  background(50)
  push()
  translate(width*0.25, height*0.95)
  imageMode(CENTER)
  // scale(0.35)
  // scale(0.3*logo.width/width)
  scale(0.4*width/500)
  image(logo,0,0)
  pop()
  sensitivityBase=baseSlider.value()
  sensitivity=sensitivitySlider.value()
  modifyShade=slider.value()
  // modifyShade=map(mouseY,0,height,-100,+100)
  // triggerThreshold=map(mouseX,0,width,50,150)
  source.copy(capture, capture.width*0.5-capture.height*0.5, 0,capture.height, capture.height, 0,0,sourceW, sourceH);
  image(source,0,0)
    
  source.loadPixels();
  bars.forEach(bar=>{
    bar.scanVert(source.pixels)
  })
  // drones.forEach((drone,i)=>{
  //   drone.show(source.pixels)
  //   drone.run(bars[i].val)
  //   droneSounds[i].setVolume(drone.val*0.5)
  // })
  dronesV.forEach((drone,i)=>{
    drone.show(source.pixels)
    drone.run(bars[i].val)
    droneSounds[i].setVolume(drone.val*droneMaxVolume)
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
  fill(200)
  // stroke(255)
  noStroke()
  strokeWeight(1)
  textSize(width*0.03)
  textSize(this.ts)
  textAlign(LEFT, BASELINE)
  textFont('courier')
  text(`lightness ${slider.value()}`,inputWidth*0.1,inputHeight+droneHeight+(height-inputHeight-droneHeight)*0.17)
  text(`sensitivity ${sensitivitySlider.value()}`,inputWidth*0.1,inputHeight+droneHeight+(height-inputHeight-droneHeight)*0.37)
  text(`sensitivity base ${baseSlider.value()}`,inputWidth*0.1,inputHeight+droneHeight+(height-inputHeight-droneHeight)*0.57)
  // text('drones',inputWidth+outputWidth*0.1,inputHeight*0.1)
  // text('triggers',inputWidth+outputWidth*1.1,inputHeight*0.1)
  
  button.run()
  button.show()
  select.run()
  select.show()
  //show cam current value and number of cams
  textSize(width*0.03)
  textAlign(LEFT, CENTER)
  text(currentDevice, viewportWidth*0.9,viewportHeight*0.715)
  text(numDevices, viewportWidth*0.9,viewportHeight*0.735)
  stopButton.run()
  stopButton.show()
  if(stopButton.isDown){
    hasStarted=false
    setupSliders()
    stopDrones()
    stopSliders()
  }
  if(select.isDown && select.isDown!=selectPrev){
    //trigger
    console.log('change cam')
    currentDevice=(currentDevice+1)%numDevices
    constraints.video.deviceId.exact=devices[currentDevice].id
    capture=createCapture(constraints);
  }
  selectPrev=select.isDown
}


class Trigger{
  constructor(x,y,w,h,barIndex,trigIndex,triggerBar){
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
    this.triggerBar=triggerBar
    this.delayAfterTrigger=60
    this.lastTriggered=0
  }
  
  run(){
    this.didTrigger=false
    if(this.lastTriggered>0){
      this.lastTriggered--
    }
    let valNow=bars[this.triggerBar].scanSteps[this.trigIndex]
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
    ellipse(this.valPoint, this.h-y, 2+5*this.val)
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


class DroneChannelVert{
  constructor(x,y,w,h){
    this.x=x
    this.y=y
    this.valPoint=h*0.8
    this.w=w
    this.h=h
    this.val=0
    this.valHist=[]
    this.maxHist=200
    this.yStep=this.valPoint*0.95/this.maxHist
    
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
    let y=this.valPoint
    let x=0
    beginShape()
    for(let i=this.valHist.length-1; i>=0; i--){
      x=this.valHist[i]*this.w
      vertex(x, y)
      y-=this.yStep
    }
    noFill()
    stroke(0)
    strokeWeight(1)
    endShape()
    fill(200,0,0)
    noStroke()
    x=this.val*this.w
    ellipse(x, this.valPoint, 5)
    pop()
  }
  
  
}




class BarOfGreyness{
  constructor(x,y,w,h,bw,scanForTriggers,scanH,step){
    this.x=x
    this.y=y
    this.w=w
    this.bw=bw
    this.h=h
    this.step=step
    this.scanH=scanH
    this.scanForTriggers=scanForTriggers
    this.scanBand=0
    this.scanSteps=[]
    this.val=0
  }
  
  scanVert(sourcePixels){
    noStroke()
    let offset,cr,cg,cb, shade
    let avgShade=0
    let cellCount=0
    let scanStep=0
    for(let j=0; j<this.h; j+=this.step){
      let scanBandVal=0
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
        if(this.scanForTriggers && i==0){
          this.scanSteps[scanStep]=shade/(255+modifyShade)
        }
        // scanStep++
      }
      scanBandVal=scanBandVal/scanStep
      
      scanStep++
    }
    avgShade=avgShade/cellCount
    this.val=avgShade/(255+modifyShade)
    // noFill()
    fill(avgShade,150)
    // stroke(0)
    rect(this.x,0,this.bw, this.h)
    if(this.scanForTriggers){
      fill(this.scanBand)
      rect(this.x,this.y,this.step,this.h)
      this.scanSteps.forEach((ss,i)=>{
        if(ss<triggerThreshold){
          fill(255,0,0)
        } else {
          fill(ss*255)
        }
        // rect(this.x+(i+0.25)*this.step, this.scanH+this.step*0.25, this.step*0.5,this.step*0.5)
        rect(this.x+this.step*0.25, this.y+(i+0.25)*this.step, this.step*0.5,this.step*0.5)
      })
    }
    
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
  constructor(x,y,r,label){
    this.x=x;
    this.y=y;
    this.r=r;
    this.hover=false;
    this.isMouse=false;
    this.isTouch=false;
    this.isDown=false;
    this.label=label;
    textSize(20)
    let tw=textWidth(label)
    this.ts=20*r*1/tw
  }

  click(){
    return this.hover()
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
    noStroke()
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
    fill(200)
    textSize(this.ts)
    textAlign(CENTER, CENTER)
    textFont('courier')
    text(this.label,this.x, this.y)
  }
}
