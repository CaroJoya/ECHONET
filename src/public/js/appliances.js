//
//
// Appliances Class 
//    define of Appliances(kaden) (AC, ElectricLock, Shutter) 
//    contrloes and draw image(veiw)
//
//  jissou V&C of MVC
//  M is jissou in model
//

'use strict';


//
//  Clock class
//    click action: time manage (shift time)
//    click action: auto time passing mode
//
class appliances_Clock{

   static CLK_IMG_LIST = ['clock-00.png', 'clock-01.png', 'clock-02.png', 'clock-03.png', 'clock-04.png', 'clock-05.png', 'clock-06.png', 'clock-07.png', 'clock-08.png', 'clock-09.png', 'clock-10.png', 'clock-11.png'];
   constructor(house){         // Clock has no device id
        this.model = new Clock(house);
        this.location = null;
        this.img_list = [];
        let img;
        for (const img_file of appliances_Clock.CLK_IMG_LIST){
            img = new Image();
            img.src = 'js/img/' + img_file; 
            this.img_list.push(img);
        }
        this.model.set_hour(7); // initialize 07:00 (only for visual)
   }

   setup(location){
      this.location = location;
   }

   get_time(){
       if( this.model.get_auto_increment_mode() == true){
           this.model.forward_hour(1);
       }
       return( this.model.get_time());
   }
   flip_sync_mode(){           // sync mode ...  auto increment hour of clock
      this.model.flip_auto_increment_mode();     // trigger of incre is get_time
   }
   is_night(){
       const hour = this.model.get_hour();
       if(hour >= 20 || hour <= 4){
           return( true);
       }else{
           return( false);
       }
   }

   is_inside_then_action(mouse_x, mouse_y){
        let ret_val = false;
        const [x, y, w, h] = this.location;
        if ( mouse_x >= x && 
             mouse_y >= y &&
             mouse_x <= (x + w) && 
	     mouse_y <= (y + h)){
                 this.model.forward_hour(2);  // put the clock forward 2 hour
                 ret_val = true;   // click is inside, so return true
        }else{
               ret_val = false;  // click is outside, so return false
        }
        return(ret_val);
   }

   draw(ctx){
        const [x,y,w,h] = this.location;
        let hour = this.model.get_hour();
        if(hour >= 12){
            hour -= 12;
        }
        ctx.drawImage(this.img_list[hour],x,y,w,h);
        if(this.model.get_auto_increment_mode() === true){
            ctx.strokeText('S Y N C', 393, 97);
        }

        this.model.forward_second(12);  // set the clock forward 12 second (auto time passing )

   }
}

class appliances_ClockSyncSW{

   constructor(house,clock){         // Clock has no device id
        this.model = new ClockSyncSW(house,clock);
        this.location = null;
        this.img = new Image();
        this.img.src = 'js/img/round_flame.png';
        //this.model.set_sync_flag(false);  // default sync off
   }

   setup(location){
      this.location = location;
   }

   is_inside_then_action(mouse_x, mouse_y){
        let ret_val = false;
        const [x, y, w, h] = this.location;
        if ( mouse_x >= x && 
             mouse_y >= y &&
             mouse_x <= (x + w) && 
	     mouse_y <= (y + h)){
                 //this.model.flip_sync_flag();  // not manage flag
                 const clock = this.model.get_clock();
                 clock.flip_sync_mode();
        }else{
               ret_val = false;  // click is outside, so return false
        }
        return( ret_val);
   }

   draw(ctx){
        const [x,y,w,h] = this.location;
        ctx.drawImage(this.img,x,y,w,h);
        //if (this.model.get_sync_flag() === true){
        //     ctx.strokeText('*sync sw*',388, 153);
        //}else{
             ctx.strokeText('sync sw',388, 153);
        //}
   }

}


//
// Thermometer class
//    not draw image, only manage value of temperature
//
class appliances_Thermometer{

   constructor(house){            // no device id
        this.model = new Thermometer(house);
        this.location = null;
   }

   setup(location){
        this.location = location;
   }

   get_temperature(){
       return( this.model.get_temperature());
   }

   draw(ctx){  // not draw Thermometer image
   }
}



//
// Aircon class
//    click action: switch true/false of operationStatus 
//    animation... brow wind image
//
class appliances_HomeAirConditioner{

    constructor(device_id,house){
        this.model = new HomeAirConditioner(device_id,house);
        this.location = null;
        this.img = new Image();
        this.img.src = 'js/img/airconditioner.png'; 
        this.img_wind = new Image();
        this.img_wind.src = 'js/img/wind.png'; 
        this.draw_update_counter = 0;    // for animation effect (e.g. blink)
        //this.set_property("id", device_id);
        this.set_property("deviceType", "homeAirConditioner");
        this.set_property("instance", 1);
        this.set_property("deviceName", "エアコンA");
        this.set_property("connection", "online");
   }
   get_description(){
       return(this.model.get_description());
   }
   get_properties(){
       return(this.model.get_properties());
   }
   get_property(name){
       return( this.model.get_property(name));
   }
   set_property(name,value){
       return( this.model.set_property(name,value));
   }
   setup(location){
      this.location = location;
   }
   draw(ctx){

        const [x, y, w, h] = this.location;
        ctx.drawImage(this.img,x,y,w,h);
        if(this.model.get_property('operationStatus') === true){
            this.draw_update_counter += 0.5;
            if((this.draw_update_counter % 10) < 8){
                ctx.drawImage(this.img_wind,x-5,y+50,w*0.85,h);
            }
        }
   }

   is_inside_then_action(mouse_x, mouse_y){

        //console.log('check click inside of AC');
        let ret_val = false;
        const [x,y,w,h] = this.location;
        if ( mouse_x >= x && mouse_y >= y &&
             mouse_x <= (x + w) && mouse_y <= (y + h)){
             //console.log('inside AC!!');
             const value = ! this.model.get_property('operationStatus');
             this.model.set_property('operationStatus', value) ;
             ret_val = true;
        }else{
             //console.log('not inside AC!!');
             ret_val = false;
        }
        return( ret_val);
   }
}


//
// ElectricLock class
//     click action: switch lock/unlock of lockStatus
//     switch images (lock/unlock)
//     no animation
//
class appliances_ElectricLock{

    constructor(device_id,house){
        this.model = new ElectricLock(device_id,house);
        this.location = null;

        this.img_lock = new Image();
        this.img_lock.src = 'js/img/locked.png'; 
        this.img_unlock = new Image();
        this.img_unlock.src = 'js/img/unLocked.png'; 
        //this.set_property("id", device_id);
        this.set_property("deviceType", "electricLock");
        this.set_property("instance", 1);
        this.set_property("deviceName", "電気錠");
        this.set_property("connection", "online");
        this.set_property("_newCached", true);
   }

   setup(location){
      this.location = location;
   }

   get_description(){

       return( this.model.get_description());
   }
   get_properties(){
       return(this.model.get_properties());
   }
   get_property(name){

       return( this.model.get_property(name));
   }
   set_property(name,value){

       return(this.model.set_property(name,value));
   }

   is_inside_then_action(mouse_x, mouse_y){
        //console.log('check click inside of LOCK');
        let ret_val = false;
        const [x,y,w,h] = this.location;
        if ( mouse_x >= x && mouse_y >= y &&
             mouse_x <= (x + w) && mouse_y <= (y + h)){
             if(this.model.get_property('lockStatus')  === 'lock'){
                  this.model.set_property('lockStatus', 'unlock');
             }else{
                  this.model.set_property('lockStatus', 'lock');
             }
             ret_val = true;
        }else{
             //console.log('not inside AC!!');
             ret_val = false;
        }
        return(ret_val);
   }

   draw(ctx){
      const [x,y,w,h] = this.location;
      if(this.model.get_property('lockStatus') === 'lock'){
          ctx.drawImage(this.img_lock,x,y,w,h);
      }else{
          ctx.drawImage(this.img_unlock,x-40,y,w+40,h);
      }
   }
}

//
// ElectricRainDoor(Shutter) class
//     click action: none
//     switch images: none
//     animation: opening/closing
//
class appliances_ElectricRainDoor{

    constructor(device_id,house){
        this.model = new ElectricRainDoor(device_id, house);
        this.location = null;
        this.controller = null;
        //this.set_property("id", device_id);
        this.set_property("deviceType", "electricRainDoor");
        this.set_property("instance", 1);
        this.set_property("deviceName", "シャッターA");
        this.set_property("connection", "online");
        this.set_property("shutterType", "ip_screen");
        this.set_property("isEnabledHalfopen", true);
   }
   set_controller(controller){
      this.controller = controller;
   }
   setup(location){
       this.location = location;
   }
   get_description(){
       return( this.model.get_description());
   }
   get_properties(){
       return(this.model.get_properties());
   }
   get_property(name){
       return(this.model.get_property(name));
   }
   set_property(name,value){
       console.log('set value..Shutter');
       return(this.model.set_property(name,value));
   }

   draw(ctx){
       const open_control = this.model.get_property('openControl');
       let open_rate = this.model.get_property('openRate');
       if(open_control === 'close'){
           open_rate -= 1.3; 
           if(open_rate <= 0){
                 open_rate = 0;
                 this.model.set_property('openControl','stop');
           }
           this.model.set_property('openRate',open_rate);
       }else if(open_control === 'open'){
           open_rate += 1.3; 
           if(open_rate >= 100){
                 open_rate = 100;
                 this.model.set_property('openControl','stop');
           }
           this.model.set_property('openRate',open_rate);
       }
       const [[x1,y1,w1,h1],[x2,y2,w2,h2]] = this.location;
       const sh_height = h1*(100 - open_rate)/100
       ctx.fillStyle='#AfAfAf';
       ctx.fillRect(x1,y1,w1,sh_height);
       ctx.fillRect(x2,y2,w2,sh_height);

       // draw parts of shutter
       for (let l_y = 0 ; l_y < sh_height ; l_y = l_y + 16){
	 ctx.beginPath();
	 ctx.moveTo(x1, y1 + sh_height - l_y);
	 ctx.lineTo(x2 + w2, y1 + sh_height - l_y);
	 ctx.stroke();
	 ctx.stroke();

       }   
   }

}


class appliances_ShutterController{

    constructor(house,shutter){
        this.shutter = shutter;
        this.model = null;
        this.location = null;
        this.model = new ElectricRainDoorController(house)

        this.img = new Image();
        this.img.src = 'js/img/shutter_controller.png'; 
   }

   setup(location){
      this.location = location;
   }
   draw(ctx){
      const [x,y,w,h] = this.location;
      ctx.drawImage(this.img,x,y,w,h);
   }
   is_inside_then_action(mouse_x, mouse_y){
        let ret_val = false;
        //console.log('check inside');
        const [x, y, w, h] = this.location;
        if ( mouse_x >= x && mouse_y >= y &&
             mouse_x <= (x + w) && mouse_y <= (y + h)){
               const mouse_height = mouse_y - y;
               if( mouse_height >= w * 0.7){
                    this.shutter.set_property('openControl','close');
               }else if( mouse_height >= w * 0.4){
                    this.shutter.set_property('openControl','stop');
               }else{
                    this.shutter.set_property('openControl','open');
               }
               ret_val = true;   // click is inside, so return true
        }else{
               ret_val = false;  // click is outside, so return false
        }
        //console.log('touch sw');
        //console.log(this.controller_mode);
        return(ret_val);
   }
}
