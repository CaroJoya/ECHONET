////////////////////////////////////////////////////////////////////////////
//
// 
//    IoTHouseSimualtor(1.0.8)
//
//    HOUSE Class (Controller and View of MVC model)
// 
//    file: house.js
//
//   manage ...  appliances(kaden object) ()
//               draw appliances
//               handle user event (click) and send
//

//
//  This class models that the owner of the house buys a home appliance 
//  and installs it in the house.
//  Device ID is defined in this house class, because 
//  Device ID is determined when the owner purchase a home appliance


'use strict';

const HomeAirConditionerID =  'fe012345013001012345000000000000ff';
const ElectricLockID =        'fe012345026f01012345000000000000ff';
const ElectricRainDoorID =    'fe012345026301012345000000000000ff';

const LIVING_ROOM_IMG =  'js/img/living_room.png'; 
const LIVING_ROOM_NIGHT_IMG = 'js/img/living_room_nighttime.png'; 

const MONITOR_IMG = 'js/img/monitor.png';
const SOFA_IMG = 'js/img/sofa.png';
const CURTAIN_IMG = 'js/img/curtain.png';
const CURTAIN_GRAY_IMG = 'js/img/curtain_gray.png';


let house_obj = null;

//
//  function main()
//
window.onload = () => {

  house_obj = new HOUSE();

}


class HOUSE{

    static DRAW_INTERVAL = 200;   // draw House image and devices each 0.2 sec

    constructor(){

         this.canvas = document.getElementById('canvas');
         this.ctx = canvas.getContext('2d');

         this.canvas.addEventListener('mousemove', 
                           (evt) => this.mouse_move(evt.offsetX, evt.offsetY), 
                           false);

         this.canvas.addEventListener('click', 
                           (evt) => this.mouse_click(evt.offsetX, evt.offsetY),
                           false);

        // create HomeGW
        this.homeGW = new HomeGW()

        // create appliances
        this.devices = {};
        this.devices['clock'] = new appliances_Clock(this);
        this.devices['clock_sync_sw'] = new appliances_ClockSyncSW(this, this.devices['clock']);
        this.devices['aircon'] = new appliances_HomeAirConditioner(HomeAirConditionerID, this)
        this.devices['lock'] = new appliances_ElectricLock(ElectricLockID,this);
        this.devices['shutter'] = new appliances_ElectricRainDoor(ElectricRainDoorID,this);
        this.devices['shutter_controller'] = new appliances_ShutterController(this,this.devices['shutter']);
        this.devices['thermometer'] = new appliances_Thermometer(this);

        // link controller to shutter
        //this.devices['shutter'].set_controller(this.devices['shutter_controller']);

        // regist appliances to HomeGW
        this.homeGW.add_device(HomeAirConditionerID, this.devices['aircon']);
        this.homeGW.add_device(ElectricLockID, this.devices['lock']);
        this.homeGW.add_device(ElectricRainDoorID, this.devices['shutter']);

        // setup(allocate) appliances in House
        this.devices['aircon'].setup([20,54,328-20,130-54]);
        this.devices['clock'].setup([360,30,100,100]);
        this.devices['clock_sync_sw'].setup([380,140,60,20]);
        this.devices['lock'].setup([450,282,540-450,344-282]);
        this.devices['shutter_controller'].setup([362,230,426-386,280-230]);
        this.devices['shutter'].setup([[12,172 , 170-12, 408-172],[184,172, 335-184,408-172]]);

        // load house image
        this.img_living_room = new Image();
        this.img_living_room.src = LIVING_ROOM_IMG;

        this.img_living_room_night = new Image();
        this.img_living_room_night.src = LIVING_ROOM_NIGHT_IMG;

        // load HomeGW
        this.img_homeGW = new Image();
        this.img_homeGW.src = MONITOR_IMG;

        // load furniture and curtain
        this.img_sofa = new Image();
        this.img_sofa.src = SOFA_IMG;

        this.img_curtain = new Image();
        this.img_curtain.src = CURTAIN_IMG;

        this.img_curtain_gray = new Image();
        this.img_curtain_gray.src = CURTAIN_GRAY_IMG;

        this.mouse_x = 0;
        this.mouse_y = 0;
        this.mouse_click_x = 0;
        this.mouse_click_y = 0;

        // set tick for drawing
        setInterval(() => this.draw(), HOUSE.DRAW_INTERVAL);

   }

   get_time(){

       return this.devices['clock'].get_time();       
   }

   get_temperature(){

     return this.devices['thermometer'].get_temperature();       
   }

   get_homeGW(){

     return this.homeGW;

   }

   // call back function
   mouse_move(x,y){

      this.mouse_x = x;
      this.mouse_y = y;
   }

   // call back function
   mouse_click(x,y){

       this.mouse_click_x = x;
       this.mouse_click_y = y;
       for (const device_name of ['aircon', 'clock', 'clock_sync_sw', 'lock', 'shutter_controller']){
             let ans = this.devices[device_name].is_inside_then_action(x, y);
             if(ans === true){
                   break;
             }
        }
   }
   draw(){

        // draw back ground images
        this.draw_back();

        // draw appliances images
        for (const device of ['shutter','clock', 'clock_sync_sw','lock', 'shutter_controller', 'aircon' ]){
             this.devices[device].draw(this.ctx)
        }

        // draw front images
        this.draw_front();

        // draw infomation
        this.draw_report();
   }
   draw_back(){

        if( this.devices['clock'].is_night() === true){
             this.ctx.drawImage(this.img_living_room_night,0,0,700,500);
        }else{
             this.ctx.drawImage(this.img_living_room,0,0,700,500);        
        }
   }
   draw_front(){

        if( this.devices['clock'].is_night() === true){
             this.ctx.drawImage(this.img_curtain_gray,0,150,358,430-150);
        }else{
             this.ctx.drawImage(this.img_curtain,0,150,358,430-150);
        }
        this.ctx.drawImage(this.img_sofa,45,307,295-45,437-307);
        this.ctx.drawImage(this.img_homeGW,391,185,432-391,217-185);

   }
   draw_report(){

      let pos_y = 490
      this.ctx.strokeStyle='#4F4F4F';
      this.ctx.strokeText('x:',   10, pos_y);           
      this.ctx.strokeText(this.mouse_x,20, pos_y);           
      this.ctx.strokeText('y:',   45, pos_y);           
      this.ctx.strokeText(this.mouse_y,55, pos_y);           

      this.ctx.strokeText('x(c):',83, pos_y);           
      this.ctx.strokeText(this.mouse_click_x,110, pos_y);           
      this.ctx.strokeText('y(c):',135, pos_y);           
      this.ctx.strokeText(this.mouse_click_y,165, pos_y);           

      //this.ctx.strokeText('recv:', 300, pos_y);           
      //this.ctx.strokeText(mqtt_msg, 320, pos_y);           

      //if(client_id !== ''){
      //    let info = 'client id: ' + client_id + '  token:' + token
      //    this.ctx.strokeText(info, 5, 12);           
      //}
  }
}

//
// writes debug log and info to screen
//
function write_log(msg){

    let t = new Date();
    let log = HR + t.getTime()/1000  + ' ' + msg + '<br>';
    document.getElementById('log').innerHTML += log;
}
//
// writes debug log and info to screen
//
function log_clr(){

    document.getElementById('log').innerHTML = '';

}



