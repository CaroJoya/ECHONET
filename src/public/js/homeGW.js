//
// Class define of Home Gateway (homeGW)
//
// using
//   "https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.0.1/socket.io.js"
//

'use strict';

const SERVER_IP = location.hostname;
const SERVER_PORT = location.port;

const HR = '-----------------------------------------<br>'

class HomeGW{

    static SERVER_URL = `ws://${SERVER_IP}:${SERVER_PORT}`;

    constructor(){  
         this.device_list = {};  // list of appliances , key: device_id , value : device_object
         this.socket = null;
         this.setup_websocket();
    }

    setup_websocket(){
         this.socket = io(HomeGW.SERVER_URL);
         ///////////////////////////////////////////////////////////////////////
         //
         //  setting handlers for socket events
         //
         ///////////////////////////////////////////////////////////////////////
         this.socket.on('connect', () => {
              write_log('[s<-c] connected');
              this.socket.emit('hello', {data: 'im connected2!!'});
         });
         
         this.socket.on('connect_error', () => {
              write_log('[E] Connection error with server!!');   
              // retry connect 
              //this.socket.connect(); //(no need, auto retry)
         });

         //
         //  requests of executing procedure from WebServer
         //
         this.socket.on('request', (msg) => { 
               this.ws_request(msg); 
         });

         this.socket.on('ack', (msg) => {
                write_log('[s->c] ack'); 
         });
    }

    /////////////////////////////////////////////
    //
    //  called procedure via oRPC/ws (ore RPC)
    //  set/get properties of specified device
    //
    /////////////////////////////////////////////
    get_ELAPI_versions() {
       return ELAPI_VERSIONS;
    }

    get_ELAPI_v1_descriptions(){
       return ELAPI_V1_DESC;
    }

    get_devices() {
        let devices = []
	for (const device_id in this.device_list){
	    const device = this.device_list[device_id];
            const description = device.get_description();
            let device_info = {};
            device_info['id'] = device_id;
            device_info['deviceType'] = description['deviceType'];
            device_info['manufacturer'] = device.get_property('manufacturer');
            device_info['protocol'] = ECHONET_LITE_PROTOCOL;
	    devices.push(device_info);
	}
	return devices;
    }

    get_description(device_id) {
       let ret_val = null;
       console.log('get description');
       if (device_id in this.device_list){
	  const device = this.device_list[device_id];
	  ret_val = device.get_description();
       }else{
	  console.log('not registered device id');
	  ret_val = false;
       }
       return ret_val;
    }

    get_properties(device_id) {
       let ret_val = null;
       console.log('get properties');
       if (device_id in this.device_list){
	  const device = this.device_list[device_id];
	  ret_val = device.get_properties();
       }else{
	  console.log('not registered device id');
	  ret_val = false;
       }
       return ret_val;
    }

    get_property(device_id, property_name) {
       let ret_val = {};
       console.log('get property!!');
       if (device_id in this.device_list){
	  const device = this.device_list[device_id];
	  ret_val[property_name] = device.get_property(property_name);
       }else{
	  console.log('not registered device id');
	  ret_val[property_name] = false;
       }
       return ret_val;
    }

    set_property(device_id, property_name,property_value) {
       let ret_val = {};
       console.log('set property!!');
       if (device_id in this.device_list){
	  const device = this.device_list[device_id];
	  ret_val[property_name] = device.set_property(property_name,property_value);
       }else{
	  console.log('not registered device id');
	  ret_val[property_name] = false;
       }
       return ret_val;
    }


    ///////////////////////////////////////////////
    //  
    //  func for hogeGW
    //
    set_device_list(device_list){
            this.device_list = devlice_list;
    }

    add_device(device_id, device_obj){
             this.device_list[device_id] = device_obj;
    }


    ///////////////////////////////////////////////////////////////////////
    //
    //  functions for communicating Web Server via WebSocket (oRPC(ore RPC))
    //
    ///////////////////////////////////////////////////////////////////////
    
    //  server --> client
    ws_request(msg) {
        let ret_val = null;
        let obj = JSON.parse(msg);
        let request_id = obj.request_id;
        let response_id = request_id;     // !!!!<<< we should make response ID
        console.log(obj);
        let procedure_name = obj.procedure_name
        
        if( procedure_name === 'get_property_value'){
             const device_id = obj.args.device_id;
             const property_name = obj.args.property_name;
             ret_val = this.get_property(device_id, property_name);

         }else if( procedure_name === 'get_properties'){
             const device_id = obj.args.device_id;
             ret_val = this.get_properties(device_id);

         }else if( procedure_name === 'get_description'){
             const device_id = obj.args.device_id;
             ret_val = this.get_description(device_id);
        
         }else if( procedure_name === 'set_property_value'){
             const device_id = obj.args.device_id;
             const property_name = obj.args.property_name;
             const property_value = obj.args.property_value;
             ret_val = this.set_property(device_id, property_name, property_value);

         }else if( procedure_name === 'get_api_versions'){
             ret_val = this.get_ELAPI_versions();

         }else if( procedure_name === 'get_v1_descriptions'){
             ret_val = this.get_ELAPI_v1_descriptions();

         }else if( procedure_name === 'get_devices'){
             ret_val = this.get_devices();

         }else{
             ret_val = "Error! unknwon procedure name"
         }

         log_clr();
         write_log('[s->c] request');
         write_log(msg);
         this.ws_response(response_id, ret_val);
    }

    // server <-- client
    ws_report(msg){
        const t = new Date();
        const time = t.getTime()/1000 + ' [s<-c] report';
        const log =  HR + time + '<br>'; // + '<br>' + HR;
        const ret_msg = JSON.stringify(msg); // convert object -> JSON formata
        this.socket.emit('report', {data: ret_msga});  
        document.getElementById('log').innerHTML += log;
    }

    // server <-- client
    ws_response(response_id, value){      // socket, 
        const t = new Date();
        let ret_val = {};
        ret_val.value = value;
        ret_val.response_id = response_id;
        ret_val.timestamp = t.getTime()/1000;    // convert msec -> sec
        const ret_msg = JSON.stringify(ret_val); // convert object -> JSON format
        const log = HR + t.getTime()/1000 + ' [s<-c] response' + '<br>' + ret_msg + '<br>';
        this.socket.emit('response', ret_msg);
        document.getElementById('log').innerHTML += log
    }

}


///////////////////////////////////////////////////
//
//  defines for ECHONET Lite Web API
//
///////////////////////////////////////////////////
const ECHONET_LITE_PROTOCOL = {
    "type": "ECHONET_Lite v1.13",
    "version": "Rel.J"
};

const ELAPI_VERSIONS = {
  "versions": [
    {
      "id": "v1",
      "status": "CURRENT",
      "updated": "2018-01-01T12:34:56+09:00"
    },
    {
      "id": "v2",
      "status": "EXPERIMENTAL",
      "updated": "2018-01-02T01:02:03+09:00"
    }
  ]
};



const ELAPI_V1_DEVICES = [
  {
    "id": "",
    "deviceType": "homeAirConditioner",
    "protocol": {
      "type": "ECHONET_Lite v1.13",
      "version": "Rel.J"
    },
    "manufacturer": {
      "code": "0x012345",
      "descriptsions": {
        "ja": "someMaker",
        "en": "someMaker"
      }
    }
  },
  {
    "id": "",
    "deviceType": "electricLock",
    "protocol": {
      "type": "ECHONET_Lite v1.13",
      "version": "Rel.J"
    },
    "manufacturer": {
      "code": "0x012345",
      "descriptsions": {
        "ja": "someMaker",
        "en": "someMaker"
      }
    }
  },
  {
    "id": "",
    "deviceType": "electricRainDoor",
    "protocol": {
      "type": "ECHONET_Lite v1.13",
      "version": "Rel.J"
    },
    "manufacturer": {
      "code": "0x012345",
      "descriptsions": {
        "ja": "someMaker",
        "en": "someMaker"
      }
    }
  }
];

const ELAPI_V1_DESC = {
  "v1": [
    {
      "descriptions": {
        "en": "device resource",
        "ja": "devicesの説明文"
      },
      "name": "devices",
      "total": 10
    },
    {
      "descriptions": {
        "en": "controller resource",
        "ja": "controllersの説明文"
      },
      "name": "controllers",
      "total": 1
    },
    {
      "descriptions": {
        "en": "sites resource",
        "ja": "sitesの説明文"
      },
      "name": "sites",
      "total": 5
    },
    {
      "descriptions": {
        "en": "user resource",
        "ja": "usersの説明文"
      },
      "name": "users",
      "total": 100
    },
    {
      "descriptions": {
        "en": "group resource",
        "ja": "groupsの説明文"
      },
      "name": "groups",
      "total": 3
    },
    {
      "descriptions": {
        "en": "bulks resource",
        "ja": "bulksの説明文"
      },
      "name": "bulks",
      "total": 10
    },
    {
      "descriptions": {
        "en": "histories resource",
        "ja": "historiesの説明文"
      },
      "name": "histories",
      "total": 20
    }
  ]
};
