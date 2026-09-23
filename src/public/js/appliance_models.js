//
// Data Models for Appliances(kaden)  
//
// (1) manage ECHONET Lite properties in appliances(kaden)
// (2) manage any other datas in appliances
//
// note:
//   device_id is managed by House Class and set it when instanciates appliance class
//

'use strict';

class Clock{

   constructor(house){
        this.name = 'Clock';
        this.house = house;

        this.datetime = new Date('2023-01-01T00:00:00.0000+09:00');
        this.auto_increment_mode = false;  // true/false

   }

   set_auto_increment_mode(flag){
        this.auto_increment_mode = flag;  // true/false
   }

   get_auto_increment_mode(){
        return(this.auto_increment_mode);
   }

   flip_auto_increment_mode(flag){
        this.auto_increment_mode = ! this.auto_increment_mode;
   }


   set_time(time){
       return(this.datetime=time);
   }

   set_hour(hour){
       return(this.datetime.setHours(hour));
   }

   get_hour(){
       return(this.datetime.getHours());
   }

   forward_hour(delta){
       this.datetime.setHours(this.datetime.getHours() + delta)
   }

   forward_second(delta){
       this.datetime.setSeconds(this.datetime.getSeconds() + delta)
   }

   get_time(){
       return(this.datetime);
   }
}

class ClockSyncSW{

   constructor(house, clock){
        this.name = 'ClockSyncSW';
        this.house = house;
        this.clock = clock;
        //  this.sync_flag = flag;  // not manage variable
   }

   get_clock(flag){
        return(this.clock);
   }

   //set_sync_flag(flag){
   //     this.sync_flag = flag;
   //}
   //get_sync_flag(){
   //     return(this.sync_flag);
   //}
   //
   //flip_sync_flag(){
   //     this.sync_flag = ! this.sync_flag;   // flip true/false
   //}
}




class Thermometer{

   static OUTDOOR_TEMP = [23.0, 22.0, 21.0, 21.0, 20.0, 20.0, 21.0, 21.5, 22.0, 24.0, 25.0, 26.0, 28.0, 29.5, 32.0, 29.5, 28.0, 27.0, 26.0, 25.0, 24.5, 24.0, 23.5, 23.0];
   static INDOOR_TEMP = [25.0, 24.8, 24.6, 24.4, 23.3, 23.1, 24.0, 25.6, 26.0, 26.5, 26.8, 27.0, 27.3, 27.5, 27.8, 28.0, 27.8, 27.5, 27.3, 27.0, 26.7, 26.5, 25.4, 25.3];

   constructor(house){
        this.name = 'Thermometer';
        this.house = house;
   }

   //
   // returns roomTemperature and outdoorTemperature
   //
   get_temperature(){
        const datetime = this.house.get_time();
        const hour = datetime.getHours();
        return( {'roomTemperature' : Thermometer.INDOOR_TEMP[hour],
                'outdoorTemperature' : Thermometer.OUTDOOR_TEMP[hour]});
   }
}

class HomeAirConditioner{

   constructor(device_id,house){
        this.name = 'HomeAirConditioner';
        this.device_id = device_id;
        this.house = house;

        this.properties = {};            // ECHONET Lite Properties
        this.properties['id'] = device_id;
        this.properties['operationStatus'] = false;  // default power off
        this.properties['operationMode'] = 'auto';
        this.properties['manufacturer'] = DEFAULT_MANUFACTURER;
   }
   get_description(){
       return AC_DESC;
   }
   get_properties(){
      // update custom properties
      this.set_property("roomTemperature", this.get_property("roomTemperature"));
      this.set_property("outdoorTemperature", this.get_property("outdoorTemperature"));
      return(this.properties);
   }
   set_property(name,value){
      this.properties[name] = value;
      return(value);
   }

   get_property(name){
       let value = null;
       if(name === 'roomTemperature' || name === 'outdoorTemperature'){
             let temp = this.house.get_temperature();
             value = temp[name];
       }else if(name in this.properties) {
             value = this.properties[name];
       }else {
             console.log('at get property');
             console.log('Error!! unknown Porperty');
             value = null;
       }
       return(value);
   }
}

class ElectricRainDoorController{

   constructor(house){
        this.name = 'ElectricRainDoorController';
        this.house = house;
        this.properties = {};  
   }
   get_properties(){
      return(this.properties);
   }
   set_property(name, value){
      this.properties[name] = value;
      return(value);
   }
   get_property(name){
        if (name in this.properties) {
            return(this.properties[name]);
        }else{
             console.log('at get property');
             console.log('Error!! unknown Porperty');
             return(null);
        }
   }
}

class ElectricRainDoor{

   constructor(device_id,house){
        this.name = 'ElectricRainDoor';
        this.device_id = device_id;
        this.house = house;

        this.properties = {};           // ECHONET Lite Properties
        this.properties['id'] = device_id;
        this.properties['operationStatus'] = true;  // 24H Powered
        this.properties['openControl'] = 'stop';    // default stop
        this.properties['openRate'] = 100;                    // default fully Opened
        this.properties['openClosedStatus'] = 'fullyOpened';  
        this.properties['manufacturer'] = DEFAULT_MANUFACTURER;
   }

   get_description(){
      return SHUTTER_DESC;
   }
   get_properties(){
      // update custom properties
      this.set_property("openClosedStatus", this.get_property("openClosedStatus"));
      return(this.properties);
   }
   set_property(name, value){
      this.properties[name] = value;
      return(value);
   }

   get_property(name){
        if (name === 'openClosedStatus'){
               const openRate = this.properties.openRate;

               // https://echonet.jp/wp/wp-content/uploads/pdf/General/Standard/web_api/ECHONET_Lite_Web_API_Dev_Specs_v1.4.1.pdf
               // P131  'fullyOpen', 'fullyClosed', 'opening', 'closing', 'stoppedHalfway'
               // 
               if(openRate === 100){
                     this.properties.openClosedStatus = 'fullyOpen';
               }else if(openRate === 0){
                     this.properties.openClosedStatus = 'fullyClosed';
               }else{
                     const openControl = this.properties.openControl;
                     if(openControl === 'open'){
                          this.properties.openClosedStatus = 'opening';
                     } else if(openControl === 'close'){
                          this.properties.openClosedStatus = 'closing';
                     }else{
                          this.properties.openClosedStatus = 'stoppedHalfway';
                    }
               }
        }
        if (name in this.properties) {
            return(this.properties[name]);
        }else{
             console.log('at get property');
             console.log('Error!! unknown Porperty');
             return(null);
        }
   }
}

class ElectricLock{

   constructor(device_id,house){
        this.name = 'ElectricLock';
        this.device_id = device_id;
        this.house = house;

        this.properties = {};           // ECHONET Lite Properties
        this.properties['id'] = device_id;
        this.properties['operationStatus'] = true;  // 24H powered
        this.properties['lockStatus'] = 'lock';  // default value is lock
        this.properties['manufacturer'] = DEFAULT_MANUFACTURER;

   }

   get_description(){
      return LOCK_DESC;
   }
   get_properties(){
      return(this.properties);
   }
   set_property(name, value){
      this.properties[name] = value;
      return(value);
   }
   get_property(name){
        if (name in this.properties) {
            return(this.properties[name]);
        }else{
             console.log('at get property');
             console.log('Error!! unknown Porperty');
             return(null);
        }
   }
}

//
// defines for description 
//

const DEFAULT_MANUFACTURER = {
    "code": "012345",
    "descriptions": {
        "ja": "some manufacturer",
        "en": "some manufacturer"
    }
};


const AC_DESC = {
  "actions": {
    "beepBuzzer": {
      "descriptions": {
        "en": "Buzzer",
        "ja": "ブザー"
      },
      "epc": "0xD0",
      "note": {
        "en": "Access rule of the corresponding ECHONET Lite property is Set only.",
        "ja": "ECHONET LiteではSet only property"
      },
      "schema": {}
    }
  },
  "descriptions": {
    "en": "Home air conditioner",
    "ja": "家庭用エアコン"
  },
  "deviceType": "homeAirConditioner",
  "eoj": "0x0130",
  "properties": {
    "airCleaningMethod": {
      "descriptions": {
        "en": "Mounted air cleaning method",
        "ja": "搭載空気清浄方法"
      },
      "epc": "0xC6",
      "observable": false,
      "schema": {
        "properties": {
          "equippedClusterIon": {
            "descriptions": {
              "en": "Cluster ion",
              "ja": "クラスタイオン方式搭載情報"
            },
            "type": "boolean",
            "values": [
              {
                "descriptions": {
                  "en": "Not equipped",
                  "ja": "非搭載"
                },
                "edt": "0x00",
                "value": false
              },
              {
                "descriptions": {
                  "en": "Equipped",
                  "ja": "搭載"
                },
                "edt": "0x01",
                "value": true
              }
            ]
          },
          "equippedElectronic": {
            "descriptions": {
              "en": "Electronic dust collection",
              "ja": "電気集塵方式搭載情報"
            },
            "type": "boolean",
            "values": [
              {
                "descriptions": {
                  "en": "Not equipped",
                  "ja": "非搭載"
                },
                "edt": "0x00",
                "value": false
              },
              {
                "descriptions": {
                  "en": "Equipped",
                  "ja": "搭載"
                },
                "edt": "0x01",
                "value": true
              }
            ]
          }
        },
        "type": "object"
      },
      "writable": false
    },
    "airFlowDirectionHorizontal": {
      "descriptions": {
        "en": "Air flow direction (horizontal) setting",
        "ja": "風向左右設定"
      },
      "epc": "0xA5",
      "observable": false,
      "schema": {
        "enum": [
          "rc_r",
          "l_lc",
          "lc_c_rc",
          "l_lc_rc_r",
          "r",
          "rc",
          "c",
          "c_r",
          "c_rc",
          "c_rc_r",
          "lc",
          "lc_r",
          "lc_rc",
          "lc_rc_r",
          "lc_c",
          "lc_c_r",
          "lc_c_rc_r",
          "l",
          "l_r",
          "l_rc",
          "l_rc_r",
          "l_c",
          "l_c_r",
          "l_c_rc",
          "l_c_rc_r",
          "l_lc_r",
          "l_lc_rc",
          "l_lc_c",
          "l_lc_c_r",
          "l_lc_c_rc",
          "l_lc_c_rc_r"
        ],
        "type": "string",
        "values": [
          {
            "descriptions": {
              "en": "Right center and Right",
              "ja": "右中・右"
            },
            "edt": "0x41",
            "value": "rc_r"
          },
          {
            "descriptions": {
              "en": "Left and Left center",
              "ja": "左・左中"
            },
            "edt": "0x42",
            "value": "l_lc"
          },
          {
            "descriptions": {
              "en": "Left center, Center and Right center",
              "ja": "左中・中・右中"
            },
            "edt": "0x43",
            "value": "lc_c_rc"
          },
          {
            "descriptions": {
              "en": "Left, Left center, Right center and Right",
              "ja": "左・左中・右中・右"
            },
            "edt": "0x44",
            "value": "l_lc_rc_r"
          },
          {
            "descriptions": {
              "en": "Right",
              "ja": "右"
            },
            "edt": "0x51",
            "value": "r"
          },
          {
            "descriptions": {
              "en": "Right center",
              "ja": "右中"
            },
            "edt": "0x52",
            "value": "rc"
          },
          {
            "descriptions": {
              "en": "Center",
              "ja": "中"
            },
            "edt": "0x54",
            "value": "c"
          },
          {
            "descriptions": {
              "en": "Center and right",
              "ja": "中・右"
            },
            "edt": "0x55",
            "value": "c_r"
          },
          {
            "descriptions": {
              "en": "Center and Right center",
              "ja": "中・右中"
            },
            "edt": "0x56",
            "value": "c_rc"
          },
          {
            "descriptions": {
              "en": "Center, Right center and Right",
              "ja": "中・右中・右"
            },
            "edt": "0x57",
            "value": "c_rc_r"
          },
          {
            "descriptions": {
              "en": "Left center",
              "ja": "左中"
            },
            "edt": "0x58",
            "value": "lc"
          },
          {
            "descriptions": {
              "en": "Left center and Right",
              "ja": "左中・右"
            },
            "edt": "0x59",
            "value": "lc_r"
          },
          {
            "descriptions": {
              "en": "Left center and Right center",
              "ja": "左中・右中"
            },
            "edt": "0x5A",
            "value": "lc_rc"
          },
          {
            "descriptions": {
              "en": "Left center, Right center and Right",
              "ja": "左中・右中・右"
            },
            "edt": "0x5B",
            "value": "lc_rc_r"
          },
          {
            "descriptions": {
              "en": "Left center and Center",
              "ja": "左中・中"
            },
            "edt": "0x5C",
            "value": "lc_c"
          },
          {
            "descriptions": {
              "en": "Left center, Center and Right",
              "ja": "左中・中・右"
            },
            "edt": "0x5D",
            "value": "lc_c_r"
          },
          {
            "descriptions": {
              "en": "Left center, Center, Right center and Right",
              "ja": "左中・中・右中・右"
            },
            "edt": "0x5F",
            "value": "lc_c_rc_r"
          },
          {
            "descriptions": {
              "en": "Left",
              "ja": "左"
            },
            "edt": "0x60",
            "value": "l"
          },
          {
            "descriptions": {
              "en": "Left and Right",
              "ja": "左・右"
            },
            "edt": "0x61",
            "value": "l_r"
          },
          {
            "descriptions": {
              "en": "Left and Right center",
              "ja": "左・右中"
            },
            "edt": "0x62",
            "value": "l_rc"
          },
          {
            "descriptions": {
              "en": "Left, Right center and Right",
              "ja": "左・右中・右"
            },
            "edt": "0x63",
            "value": "l_rc_r"
          },
          {
            "descriptions": {
              "en": "Left and Center",
              "ja": "左・中"
            },
            "edt": "0x64",
            "value": "l_c"
          },
          {
            "descriptions": {
              "en": "Left, Center and Right",
              "ja": "左・中・右"
            },
            "edt": "0x65",
            "value": "l_c_r"
          },
          {
            "descriptions": {
              "en": "Left, Center and Right center",
              "ja": "左・中・右中"
            },
            "edt": "0x66",
            "value": "l_c_rc"
          },
          {
            "descriptions": {
              "en": "Left, Center, Right center and Right",
              "ja": "左・中・右中・右"
            },
            "edt": "0x67",
            "value": "l_c_rc_r"
          },
          {
            "descriptions": {
              "en": "Left, Left center and Right",
              "ja": "左・左中・右"
            },
            "edt": "0x69",
            "value": "l_lc_r"
          },
          {
            "descriptions": {
              "en": "Left, Left center and Right center",
              "ja": "左・左中・右中"
            },
            "edt": "0x6A",
            "value": "l_lc_rc"
          },
          {
            "descriptions": {
              "en": "Left, Left center and center",
              "ja": "左・左中・中"
            },
            "edt": "0x6C",
            "value": "l_lc_c"
          },
          {
            "descriptions": {
              "en": "Left, Left center, Center and Right",
              "ja": "左・左中・中・右"
            },
            "edt": "0x6D",
            "value": "l_lc_c_r"
          },
          {
            "descriptions": {
              "en": "Left, Left center, Center and Right center",
              "ja": "左・左中・中・右中"
            },
            "edt": "0x6E",
            "value": "l_lc_c_rc"
          },
          {
            "descriptions": {
              "en": "Left, Left center, Center, Right center and Right",
              "ja": "左・左中・中・右中・右"
            },
            "edt": "0x6F",
            "value": "l_lc_c_rc_r"
          }
        ]
      },
      "writable": true
    },
    "airFlowDirectionVertical": {
      "descriptions": {
        "en": "Air flow direction (vertical) setting",
        "ja": "風向上下設定"
      },
      "epc": "0xA4",
      "observable": false,
      "schema": {
        "enum": [
          "uppermost",
          "lowermost",
          "central",
          "upperCenter",
          "lowerCenter"
        ],
        "type": "string",
        "values": [
          {
            "descriptions": {
              "en": "Uppermost",
              "ja": "上"
            },
            "edt": "0x41",
            "value": "uppermost"
          },
          {
            "descriptions": {
              "en": "Lowermost",
              "ja": "下"
            },
            "edt": "0x42",
            "value": "lowermost"
          },
          {
            "descriptions": {
              "en": "Central",
              "ja": "中央"
            },
            "edt": "0x43",
            "value": "central"
          },
          {
            "descriptions": {
              "en": "Midpoint between uppermost and central",
              "ja": "上中"
            },
            "edt": "0x44",
            "value": "upperCenter"
          },
          {
            "descriptions": {
              "en": "Midpoint between lowermost and central",
              "ja": "下中"
            },
            "edt": "0x45",
            "value": "lowerCenter"
          }
        ]
      },
      "writable": true
    },
    "airFlowLevel": {
      "descriptions": {
        "en": "Air flow rate setting",
        "ja": "風量設定"
      },
      "epc": "0xA0",
      "observable": true,
      "schema": {
        "oneOf": [
          {
            "maximum": 8,
            "minimum": 1,
            "multipleOf": 1,
            "type": "number"
          },
          {
            "enum": [
              "auto"
            ],
            "type": "string",
            "values": [
              {
                "descriptions": {
                  "en": "Automatic air flow rate control function used.",
                  "ja": "風量自動設定"
                },
                "edt": "0x41",
                "value": "auto"
              }
            ]
          }
        ]
      },
      "writable": true
    },
    "airFlowTemperature": {
      "descriptions": {
        "en": "Measured cooled air temperature",
        "ja": "吹き出し温度計測値"
      },
      "epc": "0xBD",
      "observable": false,
      "schema": {
        "oneOf": [
          {
            "maximum": 125,
            "minimum": -127,
            "type": "number",
            "unit": "Celsius"
          },
          {
            "enum": [
              "unmeasurable"
            ],
            "type": "string",
            "values": [
              {
                "descriptions": {
                  "en": "Unmeasurable",
                  "ja": "計測不能"
                },
                "edt": "0x7E",
                "value": "unmeasurable"
              }
            ]
          }
        ]
      },
      "writable": false
    },
    "airPurification": {
      "descriptions": {
        "en": "Air purification mode setting",
        "ja": "空気清浄モード設定"
      },
      "epc": "0xCF",
      "observable": false,
      "schema": {
        "enum": [
          "on",
          "off"
        ],
        "type": "string",
        "values": [
          {
            "descriptions": {
              "en": "Air purification ON",
              "ja": "空気清浄ON"
            },
            "edt": "0x41",
            "value": "on"
          },
          {
            "descriptions": {
              "en": "Air purification OFF",
              "ja": "空気清浄OFF"
            },
            "edt": "0x42",
            "value": "off"
          }
        ]
      },
      "writable": true
    },
    "airPurifierFunction": {
      "descriptions": {
        "en": "Air purifier function setting",
        "ja": "空気清浄機能モード設定"
      },
      "epc": "0xC7",
      "observable": false,
      "schema": {
        "properties": {
          "autoOfClusterIon": {
            "descriptions": {
              "en": "Cluster ion:Auto function",
              "ja": "クラスタイオン方式：制御状態"
            },
            "type": "boolean",
            "values": [
              {
                "descriptions": {
                  "en": "Non-automatic",
                  "ja": "非AUTO"
                },
                "edt": "0x00",
                "value": false
              },
              {
                "descriptions": {
                  "en": "Automatic",
                  "ja": "AUTO"
                },
                "edt": "0x01",
                "value": true
              }
            ]
          },
          "autoOfElectronic": {
            "descriptions": {
              "en": "Electronic dust collection:Auto function",
              "ja": "電気集塵方式：制御状態"
            },
            "type": "boolean",
            "values": [
              {
                "descriptions": {
                  "en": "Non-automatic",
                  "ja": "非AUTO"
                },
                "edt": "0x00",
                "value": false
              },
              {
                "descriptions": {
                  "en": "Automatic",
                  "ja": "AUTO"
                },
                "edt": "0x01",
                "value": true
              }
            ]
          },
          "levelOfClusterIon": {
            "descriptions": {
              "en": "Cluster ion:Level",
              "ja": "クラスタイオン方式：制御レベル"
            },
            "maximum": 8,
            "minimum": 1,
            "multipleOf": 1,
            "type": "number"
          },
          "levelOfElectronic": {
            "descriptions": {
              "en": "Electronic dust collection:Level",
              "ja": "電気集塵方式：制御レベル"
            },
            "maximum": 8,
            "minimum": 1,
            "multipleOf": 1,
            "type": "number"
          },
          "modeOfClusterIon": {
            "descriptions": {
              "en": "Cluster ion:Mode",
              "ja": "クラスタイオン方式：動作モード"
            },
            "enum": [
              "off",
              "on"
            ],
            "type": "string",
            "values": [
              {
                "descriptions": {
                  "en": "OFF",
                  "ja": "OFF"
                },
                "edt": "0x00",
                "value": "off"
              },
              {
                "descriptions": {
                  "en": "ON",
                  "ja": "ON"
                },
                "edt": "0x01",
                "value": "on"
              }
            ]
          },
          "modeOfElectronic": {
            "descriptions": {
              "en": "Electronic dust collection:Mode",
              "ja": "電気集塵方式：動作モード"
            },
            "enum": [
              "off",
              "on"
            ],
            "type": "string",
            "values": [
              {
                "descriptions": {
                  "en": "OFF",
                  "ja": "OFF"
                },
                "edt": "0x00",
                "value": "off"
              },
              {
                "descriptions": {
                  "en": "ON",
                  "ja": "ON"
                },
                "edt": "0x01",
                "value": "on"
              }
            ]
          }
        },
        "type": "object"
      },
      "writable": true
    },
    "airRefreshMethod": {
      "descriptions": {
        "en": "Mounted air refresh method",
        "ja": "搭載リフレッシュ方法"
      },
      "epc": "0xC8",
      "observable": false,
      "schema": {
        "properties": {
          "equippedClusterIon": {
            "descriptions": {
              "en": "Cluster ion",
              "ja": "クラスタイオン方式搭載情報"
            },
            "type": "boolean",
            "values": [
              {
                "descriptions": {
                  "en": "Not equipped",
                  "ja": "非搭載"
                },
                "edt": "0x00",
                "value": false
              },
              {
                "descriptions": {
                  "en": "Equipped",
                  "ja": "搭載"
                },
                "edt": "0x01",
                "value": true
              }
            ]
          },
          "equippedMinusIon": {
            "descriptions": {
              "en": "Minus ion collection",
              "ja": "マイナスイオン方式搭載情報"
            },
            "type": "boolean",
            "values": [
              {
                "descriptions": {
                  "en": "Not equipped",
                  "ja": "非搭載"
                },
                "edt": "0x00",
                "value": false
              },
              {
                "descriptions": {
                  "en": "Equipped",
                  "ja": "搭載"
                },
                "edt": "0x01",
                "value": true
              }
            ]
          }
        },
        "type": "object"
      },
      "writable": false
    },
    "airRefresherFunction": {
      "descriptions": {
        "en": "Air refresher function setting",
        "ja": "リフレッシュ機能モード設定"
      },
      "epc": "0xC9",
      "observable": false,
      "schema": {
        "properties": {
          "autoOfClusterIon": {
            "descriptions": {
              "en": "Cluster ion:Auto function",
              "ja": "クラスタイオン方式：制御状態"
            },
            "type": "boolean",
            "values": [
              {
                "descriptions": {
                  "en": "Non-automatic",
                  "ja": "非AUTO"
                },
                "edt": "0x00",
                "value": false
              },
              {
                "descriptions": {
                  "en": "Automatic",
                  "ja": "AUTO"
                },
                "edt": "0x01",
                "value": true
              }
            ]
          },
          "autoOfMinusIon": {
            "descriptions": {
              "en": "Minus ion:Auto function",
              "ja": "マイナスイオン方式：制御状態"
            },
            "type": "boolean",
            "values": [
              {
                "descriptions": {
                  "en": "Non-automatic",
                  "ja": "非AUTO"
                },
                "edt": "0x00",
                "value": false
              },
              {
                "descriptions": {
                  "en": "Automatic",
                  "ja": "AUTO"
                },
                "edt": "0x01",
                "value": true
              }
            ]
          },
          "levelOfClusterIon": {
            "descriptions": {
              "en": "Cluster ion:Level",
              "ja": "クラスタイオン方式：制御レベル"
            },
            "maximum": 8,
            "minimum": 1,
            "multipleOf": 1,
            "type": "number"
          },
          "levelOfMinusIon": {
            "descriptions": {
              "en": "Minus ion:Level",
              "ja": "マイナスイオン方式：制御レベル"
            },
            "maximum": 8,
            "minimum": 1,
            "multipleOf": 1,
            "type": "number"
          },
          "modeOfClusterIon": {
            "descriptions": {
              "en": "Cluster ion:Mode",
              "ja": "クラスタイオン方式：動作モード"
            },
            "enum": [
              "off",
              "on"
            ],
            "type": "string",
            "values": [
              {
                "descriptions": {
                  "en": "OFF",
                  "ja": "OFF"
                },
                "edt": "0x00",
                "value": "off"
              },
              {
                "descriptions": {
                  "en": "ON",
                  "ja": "ON"
                },
                "edt": "0x01",
                "value": "on"
              }
            ]
          },
          "modeOfMinusIon": {
            "descriptions": {
              "en": "Minus ion:Mode",
              "ja": "マイナスイオン方式：動作モード"
            },
            "enum": [
              "off",
              "on"
            ],
            "type": "string",
            "values": [
              {
                "descriptions": {
                  "en": "OFF",
                  "ja": "OFF"
                },
                "edt": "0x00",
                "value": "off"
              },
              {
                "descriptions": {
                  "en": "ON",
                  "ja": "ON"
                },
                "edt": "0x01",
                "value": "on"
              }
            ]
          }
        },
        "type": "object"
      },
      "writable": true
    },
    "automaticControlAirFlowDirection": {
      "descriptions": {
        "en": "Automatic control of air flow direction setting",
        "ja": "風向自動設定"
      },
      "epc": "0xA1",
      "observable": false,
      "schema": {
        "enum": [
          "auto",
          "nonAuto",
          "autoVertical",
          "autoHorizontal"
        ],
        "type": "string",
        "values": [
          {
            "descriptions": {
              "en": "Automatic",
              "ja": "AUTO"
            },
            "edt": "0x41",
            "value": "auto"
          },
          {
            "descriptions": {
              "en": "Non-automatic",
              "ja": "非AUTO"
            },
            "edt": "0x42",
            "value": "nonAuto"
          },
          {
            "descriptions": {
              "en": "Automatic (vertical)",
              "ja": "上下AUTO"
            },
            "edt": "0x43",
            "value": "autoVertical"
          },
          {
            "descriptions": {
              "en": "Automatic (horizontal)",
              "ja": "左右AUTO"
            },
            "edt": "0x44",
            "value": "autoHorizontal"
          }
        ]
      },
      "writable": true
    },
    "automaticSwingAirFlow": {
      "descriptions": {
        "en": "Automatic swing of air flow setting",
        "ja": "風向スイング設定"
      },
      "epc": "0xA3",
      "observable": false,
      "schema": {
        "enum": [
          "off",
          "vertical",
          "holizontal",
          "verticalAndHolizontal"
        ],
        "type": "string",
        "values": [
          {
            "descriptions": {
              "en": "OFF",
              "ja": "OFF"
            },
            "edt": "0x31",
            "value": "off"
          },
          {
            "descriptions": {
              "en": "Vertical",
              "ja": "上下"
            },
            "edt": "0x41",
            "value": "vertical"
          },
          {
            "descriptions": {
              "en": "Holizontal",
              "ja": "左右"
            },
            "edt": "0x42",
            "value": "holizontal"
          },
          {
            "descriptions": {
              "en": "Vertical and Holizontal",
              "ja": "上下左右"
            },
            "edt": "0x43",
            "value": "verticalAndHolizontal"
          }
        ]
      },
      "writable": true
    },
    "automaticTemperatureControl": {
      "descriptions": {
        "en": "Automatic temperature control setting",
        "ja": "温度自動設定"
      },
      "epc": "0xB1",
      "observable": false,
      "schema": {
        "type": "boolean",
        "values": [
          {
            "descriptions": {
              "en": "Automatic",
              "ja": "AUTO"
            },
            "edt": "0x41",
            "value": true
          },
          {
            "descriptions": {
              "en": "Non-automatic",
              "ja": "非AUTO"
            },
            "edt": "0x42",
            "value": false
          }
        ]
      },
      "writable": true
    },
    "componentsOperationStatus": {
      "descriptions": {
        "en": "Operation status of components",
        "ja": "内部動作状態"
      },
      "epc": "0xCD",
      "observable": false,
      "schema": {
        "properties": {
          "compressor": {
            "descriptions": {
              "en": "Operation status of the compressor",
              "ja": "コンプレッサ動作状態"
            },
            "enum": [
              "off",
              "on"
            ],
            "type": "string",
            "values": [
              {
                "descriptions": {
                  "en": "Not operating",
                  "ja": "停止中"
                },
                "edt": "0x00",
                "value": "off"
              },
              {
                "descriptions": {
                  "en": "In operation",
                  "ja": "動作中"
                },
                "edt": "0x01",
                "value": "on"
              }
            ]
          },
          "thermostat": {
            "descriptions": {
              "en": "Operation status of the thermostat",
              "ja": "サーモON/OFF状態"
            },
            "enum": [
              "off",
              "on"
            ],
            "type": "string",
            "values": [
              {
                "descriptions": {
                  "en": "OFF",
                  "ja": "OFF"
                },
                "edt": "0x00",
                "value": "off"
              },
              {
                "descriptions": {
                  "en": "ON",
                  "ja": "ON"
                },
                "edt": "0x01",
                "value": "on"
              }
            ]
          }
        },
        "type": "object"
      },
      "writable": false
    },
    "currentConsumption": {
      "descriptions": {
        "en": "Measured value of current consumption",
        "ja": "消費電流計測値"
      },
      "epc": "0xB9",
      "observable": false,
      "schema": {
        "maximum": 6553.3,
        "minimum": 0,
        "multipleOf": 0.1,
        "type": "number",
        "unit": "A"
      },
      "writable": false
    },
    "highspeedOperation": {
      "descriptions": {
        "en": "Normal/highspeed/silent operation setting",
        "ja": "急速動作モード設定"
      },
      "epc": "0xB2",
      "observable": false,
      "schema": {
        "enum": [
          "normal",
          "highspeed",
          "silent"
        ],
        "type": "string",
        "values": [
          {
            "descriptions": {
              "en": "Normal operation",
              "ja": "通常運転"
            },
            "edt": "0x41",
            "value": "normal"
          },
          {
            "descriptions": {
              "en": "High-speed operation",
              "ja": "急速"
            },
            "edt": "0x42",
            "value": "highspeed"
          },
          {
            "descriptions": {
              "en": "Silent operation",
              "ja": "静音"
            },
            "edt": "0x43",
            "value": "silent"
          }
        ]
      },
      "writable": true
    },
    "humidificationLevel": {
      "descriptions": {
        "en": "Degree of humidification setting",
        "ja": "加湿量設定"
      },
      "epc": "0xC4",
      "observable": false,
      "schema": {
        "oneOf": [
          {
            "maximum": 8,
            "minimum": 1,
            "multipleOf": 1,
            "type": "number"
          },
          {
            "enum": [
              "auto"
            ],
            "type": "string",
            "values": [
              {
                "descriptions": {
                  "en": "Automatic control of the degree of humidification",
                  "ja": "加湿量自動"
                },
                "edt": "0x41",
                "value": "auto"
              }
            ]
          }
        ]
      },
      "writable": true
    },
    "humidifierFunction": {
      "descriptions": {
        "en": "Humidifier function setting",
        "ja": "加湿モード設定"
      },
      "epc": "0xC1",
      "observable": false,
      "schema": {
        "enum": [
          "on",
          "off"
        ],
        "type": "string",
        "values": [
          {
            "descriptions": {
              "en": "Humidifier function ON",
              "ja": "加湿ON"
            },
            "edt": "0x41",
            "value": "on"
          },
          {
            "descriptions": {
              "en": "Humidifier function OFF",
              "ja": "加湿OFF"
            },
            "edt": "0x42",
            "value": "off"
          }
        ]
      },
      "writable": true
    },
    "humidity": {
      "descriptions": {
        "en": "Measured value of room relative humidity",
        "ja": "室内相対湿度計測値"
      },
      "epc": "0xBA",
      "observable": false,
      "schema": {
        "oneOf": [
          {
            "maximum": 100,
            "minimum": 0,
            "type": "number",
            "unit": "%"
          },
          {
            "enum": [
              "unmeasurable"
            ],
            "type": "string",
            "values": [
              {
                "descriptions": {
                  "en": "Unmeasurable",
                  "ja": "計測不能"
                },
                "edt": "0xFD",
                "value": "unmeasurable"
              }
            ]
          }
        ]
      },
      "writable": false
    },
    "nonPriorityState": {
      "descriptions": {
        "en": "Non-priority state",
        "ja": "非優先状態"
      },
      "epc": "0xAB",
      "observable": false,
      "schema": {
        "type": "boolean",
        "values": [
          {
            "descriptions": {
              "en": "Normal",
              "ja": "通常状態"
            },
            "edt": "0x40",
            "value": false
          },
          {
            "descriptions": {
              "en": "Non-priority",
              "ja": "非優先状態"
            },
            "edt": "0x41",
            "value": true
          }
        ]
      },
      "writable": false
    },
    "offTimerReservation": {
      "descriptions": {
        "en": "OFF timer-based reservation setting",
        "ja": "OFFタイマ予約設定"
      },
      "epc": "0x94",
      "observable": false,
      "schema": {
        "properties": {
          "relatimeTimeBased": {
            "type": "boolean"
          },
          "timeBased": {
            "type": "boolean"
          }
        },
        "type": "object"
      },
      "writable": true
    },
    "onTimerReservation": {
      "descriptions": {
        "en": "ON timer-based reservation setting",
        "ja": "ONタイマ予約設定"
      },
      "epc": "0x90",
      "observable": false,
      "schema": {
        "properties": {
          "relatimeTimeBased": {
            "type": "boolean"
          },
          "timeBased": {
            "type": "boolean"
          }
        },
        "type": "object"
      },
      "writable": true
    },
    "operationMode": {
      "descriptions": {
        "en": "Operation mode setting",
        "ja": "運転モード設定"
      },
      "epc": "0xB0",
      "observable": true,
      "schema": {
        "enum": [
          "auto",
          "cooling",
          "heating",
          "dehumidification",
          "circulation",
          "other"
        ],
        "type": "string",
        "values": [
          {
            "descriptions": {
              "en": "Automatic",
              "ja": "自動"
            },
            "edt": "0x41",
            "value": "auto"
          },
          {
            "descriptions": {
              "en": "Cooling",
              "ja": "冷房"
            },
            "edt": "0x42",
            "value": "cooling"
          },
          {
            "descriptions": {
              "en": "Heating",
              "ja": "暖房"
            },
            "edt": "0x43",
            "value": "heating"
          },
          {
            "descriptions": {
              "en": "Dehumidification",
              "ja": "除湿"
            },
            "edt": "0x44",
            "value": "dehumidification"
          },
          {
            "descriptions": {
              "en": "Air circulation",
              "ja": "送風"
            },
            "edt": "0x45",
            "value": "circulation"
          },
          {
            "descriptions": {
              "en": "Other",
              "ja": "その他"
            },
            "edt": "0x40",
            "value": "other"
          }
        ]
      },
      "writable": true
    },
    "outdoorTemperature": {
      "descriptions": {
        "en": "Measured outdoor air temperature",
        "ja": "外気温度計測値"
      },
      "epc": "0xBE",
      "observable": false,
      "schema": {
        "oneOf": [
          {
            "maximum": 125,
            "minimum": -127,
            "type": "number",
            "unit": "Celsius"
          },
          {
            "enum": [
              "unmeasurable"
            ],
            "type": "string",
            "values": [
              {
                "descriptions": {
                  "en": "Unmeasurable",
                  "ja": "計測不能"
                },
                "edt": "0x7E",
                "value": "unmeasurable"
              }
            ]
          }
        ]
      },
      "writable": false
    },
    "ratedPowerConsumption": {
      "descriptions": {
        "en": "Rated power consumption",
        "ja": "定格消費電力値"
      },
      "epc": "0xB8",
      "observable": false,
      "schema": {
        "properties": {
          "circulation": {
            "descriptions": {
              "en": "Circulation",
              "ja": "送風"
            },
            "oneOf": [
              {
                "maximum": 65533,
                "minimum": 0,
                "type": "number",
                "unit": "W"
              },
              {
                "enum": [
                  "unsupported"
                ],
                "type": "string",
                "values": [
                  {
                    "descriptions": {
                      "en": "Unsupported",
                      "ja": "未サポート"
                    },
                    "edt": "0xFFFE",
                    "value": "unsupported"
                  }
                ]
              }
            ]
          },
          "cooling": {
            "descriptions": {
              "en": "Cooling",
              "ja": "冷房"
            },
            "oneOf": [
              {
                "maximum": 65533,
                "minimum": 0,
                "type": "number",
                "unit": "W"
              },
              {
                "enum": [
                  "unsupported"
                ],
                "type": "string",
                "values": [
                  {
                    "descriptions": {
                      "en": "Unsupported",
                      "ja": "未サポート"
                    },
                    "edt": "0xFFFE",
                    "value": "unsupported"
                  }
                ]
              }
            ]
          },
          "dehumidifying": {
            "descriptions": {
              "en": "Dehumidifying",
              "ja": "除湿"
            },
            "oneOf": [
              {
                "maximum": 65533,
                "minimum": 0,
                "type": "number",
                "unit": "W"
              },
              {
                "enum": [
                  "unsupported"
                ],
                "type": "string",
                "values": [
                  {
                    "descriptions": {
                      "en": "Unsupported",
                      "ja": "未サポート"
                    },
                    "edt": "0xFFFE",
                    "value": "unsupported"
                  }
                ]
              }
            ]
          },
          "heating": {
            "descriptions": {
              "en": "Heating",
              "ja": "暖房"
            },
            "oneOf": [
              {
                "maximum": 65533,
                "minimum": 0,
                "type": "number",
                "unit": "W"
              },
              {
                "enum": [
                  "unsupported"
                ],
                "type": "string",
                "values": [
                  {
                    "descriptions": {
                      "en": "Unsupported",
                      "ja": "未サポート"
                    },
                    "edt": "0xFFFE",
                    "value": "unsupported"
                  }
                ]
              }
            ]
          }
        },
        "type": "object"
      },
      "writable": false
    },
    "relativeHumidityDehumidifying": {
      "descriptions": {
        "en": "Set value of relative humidity in dehumidifying mode",
        "ja": "除湿モード時相対湿度設定値"
      },
      "epc": "0xB4",
      "observable": false,
      "schema": {
        "maximum": 100,
        "minimum": 0,
        "type": "number",
        "unit": "%"
      },
      "writable": true
    },
    "relativeTemperature": {
      "descriptions": {
        "en": "Relative temperature setting",
        "ja": "相対温度設定値"
      },
      "epc": "0xBF",
      "observable": false,
      "schema": {
        "oneOf": [
          {
            "maximum": 12.5,
            "minimum": -12.7,
            "multipleOf": 0.1,
            "type": "number",
            "unit": "Celsius"
          },
          {
            "enum": [
              "unmeasurable"
            ],
            "type": "string",
            "values": [
              {
                "descriptions": {
                  "en": "Unmeasurable",
                  "ja": "計測不能"
                },
                "edt": "0x7E",
                "value": "unmeasurable"
              }
            ]
          }
        ]
      },
      "writable": true
    },
    "relativeTimeOfOffTimer": {
      "descriptions": {
        "en": "OFF timer setting (relative time)",
        "ja": "OFFタイマ相対時間設定値"
      },
      "epc": "0x96",
      "observable": false,
      "schema": {
        "maximum": 15359,
        "minimum": 0,
        "multipleOf": 1,
        "type": "number",
        "unit": "minute"
      },
      "writable": true
    },
    "relativeTimeOfOnTimer": {
      "descriptions": {
        "en": "ON timer setting (relative time)",
        "ja": "ONタイマ相対時間設定値"
      },
      "epc": "0x92",
      "observable": false,
      "schema": {
        "maximum": 15359,
        "minimum": 0,
        "multipleOf": 1,
        "type": "number",
        "unit": "minute"
      },
      "writable": true
    },
    "roomTemperature": {
      "descriptions": {
        "en": "Measured value of room temperature",
        "ja": "室内温度計測値"
      },
      "epc": "0xBB",
      "observable": false,
      "schema": {
        "oneOf": [
          {
            "maximum": 125,
            "minimum": -127,
            "type": "number",
            "unit": "Celsius"
          },
          {
            "enum": [
              "unmeasurable"
            ],
            "type": "string",
            "values": [
              {
                "descriptions": {
                  "en": "Unmeasurable",
                  "ja": "計測不能"
                },
                "edt": "0x7E",
                "value": "unmeasurable"
              }
            ]
          }
        ]
      },
      "writable": false
    },
    "selfCleaningFunction": {
      "descriptions": {
        "en": "Self-cleaning function setting",
        "ja": "自己洗浄機能モード設定"
      },
      "epc": "0xCB",
      "observable": false,
      "schema": {
        "properties": {
          "autoOfDrying": {
            "descriptions": {
              "en": "Drying:Auto function",
              "ja": "乾燥方式：制御状態"
            },
            "type": "boolean",
            "values": [
              {
                "descriptions": {
                  "en": "Non-automatic",
                  "ja": "非AUTO"
                },
                "edt": "0x00",
                "value": false
              },
              {
                "descriptions": {
                  "en": "Automatic",
                  "ja": "AUTO"
                },
                "edt": "0x01",
                "value": true
              }
            ]
          },
          "autoOfOzone": {
            "descriptions": {
              "en": "Ozone cleaning:Auto function",
              "ja": "オゾン洗浄方式：制御状態"
            },
            "type": "boolean",
            "values": [
              {
                "descriptions": {
                  "en": "Non-automatic",
                  "ja": "非AUTO"
                },
                "edt": "0x00",
                "value": false
              },
              {
                "descriptions": {
                  "en": "Automatic",
                  "ja": "AUTO"
                },
                "edt": "0x01",
                "value": true
              }
            ]
          },
          "levelOfDrying": {
            "descriptions": {
              "en": "Drying:Level",
              "ja": "乾燥方式：制御レベル"
            },
            "maximum": 8,
            "minimum": 1,
            "multipleOf": 1,
            "type": "number"
          },
          "levelOfOzone": {
            "descriptions": {
              "en": "Ozone cleaning:Level",
              "ja": "オゾン洗浄方式：制御レベル"
            },
            "maximum": 8,
            "minimum": 1,
            "multipleOf": 1,
            "type": "number"
          },
          "modeOfDrying": {
            "descriptions": {
              "en": "Drying:Mode",
              "ja": "乾燥方式：動作モード"
            },
            "enum": [
              "off",
              "on"
            ],
            "type": "string",
            "values": [
              {
                "descriptions": {
                  "en": "OFF",
                  "ja": "OFF"
                },
                "edt": "0x00",
                "value": "off"
              },
              {
                "descriptions": {
                  "en": "ON",
                  "ja": "ON"
                },
                "edt": "0x01",
                "value": "on"
              }
            ]
          },
          "modeOfOzone": {
            "descriptions": {
              "en": "Ozone cleaning:Mode",
              "ja": "オゾン洗浄方式：動作モード"
            },
            "enum": [
              "off",
              "on"
            ],
            "type": "string",
            "values": [
              {
                "descriptions": {
                  "en": "OFF",
                  "ja": "OFF"
                },
                "edt": "0x00",
                "value": "off"
              },
              {
                "descriptions": {
                  "en": "ON",
                  "ja": "ON"
                },
                "edt": "0x01",
                "value": "on"
              }
            ]
          }
        },
        "type": "object"
      },
      "writable": true
    },
    "selfCleaningMethod": {
      "descriptions": {
        "en": "Mounted self-cleaning method",
        "ja": "搭載自己洗浄方法"
      },
      "epc": "0xCA",
      "observable": false,
      "schema": {
        "properties": {
          "equippedDrying": {
            "descriptions": {
              "en": "Information about drying method mounting",
              "ja": "乾燥方式搭載情報"
            },
            "type": "boolean",
            "values": [
              {
                "descriptions": {
                  "en": "Not equipped",
                  "ja": "非搭載"
                },
                "edt": "0x00",
                "value": false
              },
              {
                "descriptions": {
                  "en": "Equipped",
                  "ja": "搭載"
                },
                "edt": "0x01",
                "value": true
              }
            ]
          },
          "equippedOzone": {
            "descriptions": {
              "en": "Information about ozone cleaning method mounting",
              "ja": "オゾン洗浄方式搭載情報"
            },
            "type": "boolean",
            "values": [
              {
                "descriptions": {
                  "en": "Not equipped",
                  "ja": "非搭載"
                },
                "edt": "0x00",
                "value": false
              },
              {
                "descriptions": {
                  "en": "Equipped",
                  "ja": "搭載"
                },
                "edt": "0x01",
                "value": true
              }
            ]
          }
        },
        "type": "object"
      },
      "writable": false
    },
    "specialFunction": {
      "descriptions": {
        "en": "Special function setting",
        "ja": "特別運転モード設定"
      },
      "epc": "0xCC",
      "observable": false,
      "schema": {
        "enum": [
          "noSetting",
          "clothesDryer",
          "condensationSuppressor",
          "miteAndMoldControl",
          "activeDefrosting"
        ],
        "type": "string",
        "values": [
          {
            "descriptions": {
              "en": "No setting",
              "ja": "設定なし"
            },
            "edt": "0x40",
            "value": "noSetting"
          },
          {
            "descriptions": {
              "en": "Clothes dryer function",
              "ja": "衣類乾燥"
            },
            "edt": "0x41",
            "value": "clothesDryer"
          },
          {
            "descriptions": {
              "en": "Condensation suppressor function",
              "ja": "結露抑制"
            },
            "edt": "0x42",
            "value": "condensationSuppressor"
          },
          {
            "descriptions": {
              "en": "Mite and mold control function",
              "ja": "ダニカビ抑制"
            },
            "edt": "0x43",
            "value": "miteAndMoldControl"
          },
          {
            "descriptions": {
              "en": "Active defrosting function",
              "ja": "強制除霜"
            },
            "edt": "0x44",
            "value": "activeDefrosting"
          }
        ]
      },
      "writable": true
    },
    "specialState": {
      "descriptions": {
        "en": "Special state",
        "ja": "特殊状態"
      },
      "epc": "0xAA",
      "observable": false,
      "schema": {
        "enum": [
          "normal",
          "defrosting",
          "preheating",
          "heatRemoval"
        ],
        "type": "string",
        "values": [
          {
            "descriptions": {
              "en": "Normal operation",
              "ja": "通常状態"
            },
            "edt": "0x40",
            "value": "normal"
          },
          {
            "descriptions": {
              "en": "Defrosting",
              "ja": "除霜状態"
            },
            "edt": "0x41",
            "value": "defrosting"
          },
          {
            "descriptions": {
              "en": "Preheating",
              "ja": "予熱状態"
            },
            "edt": "0x42",
            "value": "preheating"
          },
          {
            "descriptions": {
              "en": "Heat removal",
              "ja": "排熱状態"
            },
            "edt": "0x43",
            "value": "heatRemoval"
          }
        ]
      },
      "writable": false
    },
    "targetTemperature": {
      "descriptions": {
        "en": "Set temperature value",
        "ja": "温度設定値"
      },
      "epc": "0xB3",
      "observable": false,
      "schema": {
        "oneOf": [
          {
            "maximum": 50,
            "minimum": 0,
            "type": "number",
            "unit": "Celsius"
          },
          {
            "enum": [
              "undefined"
            ],
            "type": "string",
            "values": [
              {
                "descriptions": {
                  "en": "Undefined",
                  "ja": "不明"
                },
                "edt": "0xFD",
                "value": "undefined"
              }
            ]
          }
        ]
      },
      "writable": true
    },
    "targetTemperatureCooling": {
      "descriptions": {
        "en": "Set temperature value in cooling mode",
        "ja": "冷房モード時温度設定値"
      },
      "epc": "0xB5",
      "observable": false,
      "schema": {
        "oneOf": [
          {
            "maximum": 50,
            "minimum": 0,
            "type": "number",
            "unit": "Celsius"
          },
          {
            "enum": [
              "undefined"
            ],
            "type": "string",
            "values": [
              {
                "descriptions": {
                  "en": "Undefined",
                  "ja": "不明"
                },
                "edt": "0xFD",
                "value": "undefined"
              }
            ]
          }
        ]
      },
      "writable": true
    },
    "targetTemperatureDehumidifying": {
      "descriptions": {
        "en": "Set temperature value in dehumidifying mode",
        "ja": "除湿モード時温度設定値"
      },
      "epc": "0xB7",
      "observable": false,
      "schema": {
        "oneOf": [
          {
            "maximum": 50,
            "minimum": 0,
            "type": "number",
            "unit": "Celsius"
          },
          {
            "enum": [
              "undefined"
            ],
            "type": "string",
            "values": [
              {
                "descriptions": {
                  "en": "Undefined",
                  "ja": "不明"
                },
                "edt": "0xFD",
                "value": "undefined"
              }
            ]
          }
        ]
      },
      "writable": true
    },
    "targetTemperatureHeating": {
      "descriptions": {
        "en": "Set temperature value in heating mode",
        "ja": "暖房モード時温度設定値"
      },
      "epc": "0xB6",
      "observable": false,
      "schema": {
        "oneOf": [
          {
            "maximum": 50,
            "minimum": 0,
            "type": "number",
            "unit": "Celsius"
          },
          {
            "enum": [
              "undefined"
            ],
            "type": "string",
            "values": [
              {
                "descriptions": {
                  "en": "Undefined",
                  "ja": "不明"
                },
                "edt": "0xFD",
                "value": "undefined"
              }
            ]
          }
        ]
      },
      "writable": true
    },
    "temperatureUserRemoteControl": {
      "descriptions": {
        "en": "Set temperature value of user remote control",
        "ja": "ユーザリモコン温度設定値"
      },
      "epc": "0xBC",
      "observable": false,
      "schema": {
        "maximum": 50,
        "minimum": 0,
        "type": "number",
        "unit": "Celsius"
      },
      "writable": false
    },
    "thermostatOverride": {
      "descriptions": {
        "en": "Thermostat setting override function",
        "ja": "強制サーモモード設定"
      },
      "epc": "0xCE",
      "observable": false,
      "schema": {
        "enum": [
          "normal",
          "on",
          "off"
        ],
        "type": "string",
        "values": [
          {
            "descriptions": {
              "en": "Normal setting",
              "ja": "通常設定"
            },
            "edt": "0x40",
            "value": "normal"
          },
          {
            "descriptions": {
              "en": "Thermostat setting override function ON",
              "ja": "強制サーモON"
            },
            "edt": "0x41",
            "value": "on"
          },
          {
            "descriptions": {
              "en": "Thermostat setting override function OFF",
              "ja": "強制サーモOFF"
            },
            "edt": "0x42",
            "value": "off"
          }
        ]
      },
      "writable": true
    },
    "timeOfOffTimer": {
      "descriptions": {
        "en": "OFF timer setting (time)",
        "ja": "OFFタイマ時刻設定値"
      },
      "epc": "0x95",
      "note": {
        "en": "Number of seconds is ignored.",
        "ja": "秒の指定は無視される"
      },
      "observable": false,
      "schema": {
        "format": "time",
        "type": "string"
      },
      "writable": true
    },
    "timeOfOnTimer": {
      "descriptions": {
        "en": "ON timer setting (time)",
        "ja": "ONタイマ時刻設定値"
      },
      "epc": "0x91",
      "note": {
        "en": "Number of seconds is ignored.",
        "ja": "秒の指定は無視される"
      },
      "observable": false,
      "schema": {
        "format": "time",
        "type": "string"
      },
      "writable": true
    },
    "ventilationAirFlowLevel": {
      "descriptions": {
        "en": "Ventilation air flow rate setting",
        "ja": "換気風量設定"
      },
      "epc": "0xC2",
      "observable": false,
      "schema": {
        "oneOf": [
          {
            "maximum": 8,
            "minimum": 1,
            "multipleOf": 1,
            "type": "number"
          },
          {
            "enum": [
              "auto"
            ],
            "type": "string",
            "values": [
              {
                "descriptions": {
                  "en": "Automatic control of ventilation air flow rate",
                  "ja": "換気風量自動"
                },
                "edt": "0x41",
                "value": "auto"
              }
            ]
          }
        ]
      },
      "writable": true
    },
    "ventilationFunction": {
      "descriptions": {
        "en": "Ventilation function setting",
        "ja": "換気モード設定"
      },
      "epc": "0xC0",
      "observable": false,
      "schema": {
        "enum": [
          "onOutlet",
          "off",
          "onIntake",
          "onOutletAndIntake"
        ],
        "type": "string",
        "values": [
          {
            "descriptions": {
              "en": "Ventilation function ON (outlet direction)",
              "ja": "換気ON (排気方向)"
            },
            "edt": "0x41",
            "value": "onOutlet"
          },
          {
            "descriptions": {
              "en": "Ventilation function OFF",
              "ja": "換気OFF"
            },
            "edt": "0x42",
            "value": "off"
          },
          {
            "descriptions": {
              "en": "Ventilation function ON (intake direction)",
              "ja": "換気ON (吸気方向)"
            },
            "edt": "0x43",
            "value": "onIntake"
          },
          {
            "descriptions": {
              "en": "Ventilation function ON (outlet and intake direction)",
              "ja": "換気ON (吸排気方向)"
            },
            "edt": "0x44",
            "value": "onOutletAndIntake"
          }
        ]
      },
      "writable": true
    }
  }
}
const LOCK_DESC = {
  "descriptions": {
    "en": "Electric lock",
    "ja": "電気錠"
  },
  "deviceType": "electricLock",
  "eoj": "0x026F",
  "properties": {
    "alarmStatus": {
      "descriptions": {
        "en": "Alarm status",
        "ja": "警報状態"
      },
      "epc": "0xE5",
      "observable": true,
      "schema": {
        "enum": [
          "normal",
          "breakOpen",
          "doorOpen",
          "manualUnlocked",
          "tampered"
        ],
        "type": "string",
        "values": [
          {
            "descriptions": {
              "en": "Normal (no alarm)",
              "ja": "通常状態(警報なし)"
            },
            "edt": "0x40",
            "value": "normal"
          },
          {
            "descriptions": {
              "en": "Break open",
              "ja": "こじ開け"
            },
            "edt": "0x41",
            "value": "breakOpen"
          },
          {
            "descriptions": {
              "en": "Door open",
              "ja": "扉開放"
            },
            "edt": "0x42",
            "value": "doorOpen"
          },
          {
            "descriptions": {
              "en": "Manual unlocked",
              "ja": "手動解錠"
            },
            "edt": "0x43",
            "value": "manualUnlocked"
          },
          {
            "descriptions": {
              "en": "Tampered",
              "ja": "タンパ"
            },
            "edt": "0x44",
            "value": "tampered"
          }
        ]
      },
      "writable": false
    },
    "autoLockMode": {
      "descriptions": {
        "en": "Auto lock mode setting",
        "ja": "自動施錠モード設定"
      },
      "epc": "0xE6",
      "observable": false,
      "schema": {
        "type": "boolean",
        "values": [
          {
            "descriptions": {
              "en": "ON",
              "ja": "入"
            },
            "edt": "0x41",
            "value": true
          },
          {
            "descriptions": {
              "en": "OFF",
              "ja": "切"
            },
            "edt": "0x42",
            "value": false
          }
        ]
      },
      "writable": true
    },
    "doorGuardLocked": {
      "descriptions": {
        "en": "Lock status of door guard",
        "ja": "ドアガード施錠状態"
      },
      "epc": "0xE2",
      "observable": false,
      "schema": {
        "type": "boolean",
        "values": [
          {
            "descriptions": {
              "en": "Lock",
              "ja": "施錠"
            },
            "edt": "0x41",
            "value": true
          },
          {
            "descriptions": {
              "en": "Unlock",
              "ja": "解錠"
            },
            "edt": "0x42",
            "value": false
          }
        ]
      },
      "writable": false
    },
    "doorOpened": {
      "descriptions": {
        "en": "Door open/close status",
        "ja": "扉開閉状態"
      },
      "epc": "0xE3",
      "observable": false,
      "schema": {
        "type": "boolean",
        "values": [
          {
            "descriptions": {
              "en": "Open",
              "ja": "開"
            },
            "edt": "0x41",
            "value": true
          },
          {
            "descriptions": {
              "en": "Close",
              "ja": "閉"
            },
            "edt": "0x42",
            "value": false
          }
        ]
      },
      "writable": false
    },
    "mainElectricLock": {
      "descriptions": {
        "en": "Lock setting1",
        "ja": "施錠設定1"
      },
      "epc": "0xE0",
      "observable": true,
      "schema": {
        "type": "boolean",
        "values": [
          {
            "descriptions": {
              "en": "Lock",
              "ja": "施錠"
            },
            "edt": "0x41",
            "value": true
          },
          {
            "descriptions": {
              "en": "Unlock",
              "ja": "解錠"
            },
            "edt": "0x42",
            "value": false
          }
        ]
      },
      "writable": true
    },
    "occupant": {
      "descriptions": {
        "en": "Occupant/ non-occupant status",
        "ja": "在室・不在状態"
      },
      "epc": "0xE4",
      "observable": false,
      "schema": {
        "type": "boolean",
        "values": [
          {
            "descriptions": {
              "en": "Occupant",
              "ja": "在室"
            },
            "edt": "0x41",
            "value": true
          },
          {
            "descriptions": {
              "en": "Non-occupant",
              "ja": "不在"
            },
            "edt": "0x42",
            "value": false
          }
        ]
      },
      "writable": false
    },
    "replaceBatteryLevel": {
      "descriptions": {
        "en": "Battery level",
        "ja": "電池残量状態"
      },
      "epc": "0xE7",
      "observable": true,
      "schema": {
        "type": "boolean",
        "values": [
          {
            "descriptions": {
              "en": "Notification of battery replacement",
              "ja": "交換通知有"
            },
            "edt": "0x41",
            "value": true
          },
          {
            "descriptions": {
              "en": "Ordinary level",
              "ja": "通常"
            },
            "edt": "0x40",
            "value": false
          }
        ]
      },
      "writable": true
    },
    "subElectricLock": {
      "descriptions": {
        "en": "Lock setting 2",
        "ja": "施錠設定2"
      },
      "epc": "0xE1",
      "observable": false,
      "schema": {
        "type": "boolean",
        "values": [
          {
            "descriptions": {
              "en": "Lock",
              "ja": "施錠"
            },
            "edt": "0x41",
            "value": true
          },
          {
            "descriptions": {
              "en": "Unlock",
              "ja": "解錠"
            },
            "edt": "0x42",
            "value": false
          }
        ]
      },
      "writable": true
    }
  }
}
const SHUTTER_DESC = {
  "descriptions": {
    "en": "Electrically operated rain sliding door/shutter",
    "ja": "電動雨戸・シャッター"
  },
  "deviceType": "electricRainDoor",
  "eoj": "0x0263",
  "properties": {
    "blindAngle": {
      "descriptions": {
        "en": "Blind angle setting",
        "ja": "ブラインド角度設定値"
      },
      "epc": "0xE2",
      "observable": false,
      "schema": {
        "maximum": 180,
        "minimum": 0,
        "type": "number",
        "unit": "degree"
      },
      "writable": true
    },
    "closingSpeed": {
      "descriptions": {
        "en": "Closing speed setting",
        "ja": "閉速度設定"
      },
      "epc": "0xD1",
      "observable": false,
      "schema": {
        "enum": [
          "low",
          "medium",
          "high"
        ],
        "type": "string",
        "values": [
          {
            "descriptions": {
              "en": "Low",
              "ja": "低"
            },
            "edt": "0x41",
            "value": "low"
          },
          {
            "descriptions": {
              "en": "Medium",
              "ja": "中"
            },
            "edt": "0x42",
            "value": "medium"
          },
          {
            "descriptions": {
              "en": "High",
              "ja": "高"
            },
            "edt": "0x43",
            "value": "high"
          }
        ]
      },
      "writable": true
    },
    "degreeOfOpening": {
      "descriptions": {
        "en": "Degree-of-opening setting",
        "ja": "開度レベル設定"
      },
      "epc": "0xE1",
      "observable": false,
      "schema": {
        "maximum": 100,
        "minimum": 0,
        "type": "number",
        "unit": "%"
      },
      "writable": true
    },
    "electricLock": {
      "descriptions": {
        "en": "Electric lock setting",
        "ja": "電気錠設定"
      },
      "epc": "0xE5",
      "observable": false,
      "schema": {
        "type": "boolean",
        "values": [
          {
            "descriptions": {
              "en": "Lock",
              "ja": "施錠"
            },
            "edt": "0x41",
            "value": true
          },
          {
            "descriptions": {
              "en": "Unlock",
              "ja": "解錠"
            },
            "edt": "0x42",
            "value": false
          }
        ]
      },
      "writable": true
    },
    "faultDescription": {
      "descriptions": {
        "en": "Fault description (Recoverable faults)",
        "ja": "異常内容(復帰可能な異常)"
      },
      "epc": "0x89",
      "note": {
        "en": "Lower-order one byte: Restarting the device by performing a reset operation = 0x02. Higher-order one byte: The detailed fault classification. 0x45 to 0xFF are defined by user.",
        "ja": "下位1バイトは、スーパークラスのリセットボタンを押し再操作(0x02)固定。上位1バイトは、復帰可能な異常内容を小分類まで定義。0x45～0xFFはユーザ定義"
      },
      "observable": true,
      "schema": {
        "enum": [
          "obstacleCaught",
          "outageRecovery",
          "timeOut",
          "batteryLow"
        ],
        "type": "string",
        "values": [
          {
            "descriptions": {
              "en": "Obstacle caught",
              "ja": "障害物挟込み"
            },
            "edt": "0x0402",
            "value": "obstacleCaught"
          },
          {
            "descriptions": {
              "en": "Recovery from outage",
              "ja": "停電復帰"
            },
            "edt": "0x0502",
            "value": "outageRecovery"
          },
          {
            "descriptions": {
              "en": "Time out",
              "ja": "タイムアウト"
            },
            "edt": "0x0602",
            "value": "timeOut"
          },
          {
            "descriptions": {
              "en": "Battery low",
              "ja": "電池残量低下"
            },
            "edt": "0x0702",
            "value": "batteryLow"
          }
        ]
      },
      "writable": false
    },
    "oneTimeClosingSpeed": {
      "descriptions": {
        "en": "One-time closing speed setting",
        "ja": "ワンタイム閉速度設定"
      },
      "epc": "0xEF",
      "observable": false,
      "schema": {
        "enum": [
          "low",
          "medium",
          "high",
          "none"
        ],
        "type": "string",
        "values": [
          {
            "descriptions": {
              "en": "Low",
              "ja": "低"
            },
            "edt": "0x41",
            "value": "low"
          },
          {
            "descriptions": {
              "en": "Medium",
              "ja": "中"
            },
            "edt": "0x42",
            "value": "medium"
          },
          {
            "descriptions": {
              "en": "High",
              "ja": "高"
            },
            "edt": "0x43",
            "value": "high"
          },
          {
            "descriptions": {
              "en": "None",
              "ja": "無し"
            },
            "edt": "0x44",
            "value": "none"
          }
        ]
      },
      "writable": true
    },
    "oneTimeOpeningSpeed": {
      "descriptions": {
        "en": "One-time opening speed setting",
        "ja": "ワンタイム開速度設定"
      },
      "epc": "0xEE",
      "observable": false,
      "schema": {
        "enum": [
          "low",
          "medium",
          "high",
          "none"
        ],
        "type": "string",
        "values": [
          {
            "descriptions": {
              "en": "Low",
              "ja": "低"
            },
            "edt": "0x41",
            "value": "low"
          },
          {
            "descriptions": {
              "en": "Medium",
              "ja": "中"
            },
            "edt": "0x42",
            "value": "medium"
          },
          {
            "descriptions": {
              "en": "High",
              "ja": "高"
            },
            "edt": "0x43",
            "value": "high"
          },
          {
            "descriptions": {
              "en": "None",
              "ja": "無し"
            },
            "edt": "0x44",
            "value": "none"
          }
        ]
      },
      "writable": true
    },
    "openCloseOperation": {
      "descriptions": {
        "en": "Open/close operation setting",
        "ja": "開閉動作設定"
      },
      "epc": "0xE0",
      "observable": true,
      "schema": {
        "enum": [
          "open",
          "close",
          "stop"
        ],
        "type": "string",
        "values": [
          {
            "descriptions": {
              "en": "Open",
              "ja": "開"
            },
            "edt": "0x41",
            "value": "open"
          },
          {
            "descriptions": {
              "en": "Close",
              "ja": "閉"
            },
            "edt": "0x42",
            "value": "close"
          },
          {
            "descriptions": {
              "en": "Stop",
              "ja": "停止"
            },
            "edt": "0x43",
            "value": "stop"
          }
        ]
      },
      "writable": true
    },
    "openCloseSpeed": {
      "descriptions": {
        "en": "Opening/closing speed setting",
        "ja": "開閉速度設定"
      },
      "epc": "0xE3",
      "observable": false,
      "schema": {
        "enum": [
          "low",
          "medium",
          "high"
        ],
        "type": "string",
        "values": [
          {
            "descriptions": {
              "en": "Low",
              "ja": "低"
            },
            "edt": "0x41",
            "value": "low"
          },
          {
            "descriptions": {
              "en": "Medium",
              "ja": "中"
            },
            "edt": "0x42",
            "value": "medium"
          },
          {
            "descriptions": {
              "en": "High",
              "ja": "高"
            },
            "edt": "0x43",
            "value": "high"
          }
        ]
      },
      "writable": true
    },
    "openCloseStatus": {
      "descriptions": {
        "en": "Open/closed status",
        "ja": "開閉状態"
      },
      "epc": "0xEA",
      "observable": true,
      "schema": {
        "enum": [
          "fullyOpen",
          "fullyClosed",
          "opening",
          "closing",
          "stoppedHalfway"
        ],
        "type": "string",
        "values": [
          {
            "descriptions": {
              "en": "Fully open",
              "ja": "全開"
            },
            "edt": "0x41",
            "value": "fullyOpen"
          },
          {
            "descriptions": {
              "en": "Fully closed",
              "ja": "全閉"
            },
            "edt": "0x42",
            "value": "fullyClosed"
          },
          {
            "descriptions": {
              "en": "Opening",
              "ja": "開動作中"
            },
            "edt": "0x43",
            "value": "opening"
          },
          {
            "descriptions": {
              "en": "Closing",
              "ja": "閉動作中"
            },
            "edt": "0x44",
            "value": "closing"
          },
          {
            "descriptions": {
              "en": "Stopped halfway",
              "ja": "途中停止"
            },
            "edt": "0x45",
            "value": "stoppedHalfway"
          }
        ]
      },
      "writable": false
    },
    "openingSpeed": {
      "descriptions": {
        "en": "Opening speed setting",
        "ja": "開速度設定"
      },
      "epc": "0xD0",
      "observable": false,
      "schema": {
        "enum": [
          "low",
          "medium",
          "high"
        ],
        "type": "string",
        "values": [
          {
            "descriptions": {
              "en": "Low",
              "ja": "低"
            },
            "edt": "0x41",
            "value": "low"
          },
          {
            "descriptions": {
              "en": "Medium",
              "ja": "中"
            },
            "edt": "0x42",
            "value": "medium"
          },
          {
            "descriptions": {
              "en": "High",
              "ja": "高"
            },
            "edt": "0x43",
            "value": "high"
          }
        ]
      },
      "writable": true
    },
    "operationTime": {
      "descriptions": {
        "en": "Operation time",
        "ja": "動作時間設定値"
      },
      "epc": "0xD2",
      "observable": false,
      "schema": {
        "maximum": 253,
        "minimum": 0,
        "type": "number",
        "unit": "second"
      },
      "writable": true
    },
    "remoteOperation": {
      "descriptions": {
        "en": "Remote operation setting status",
        "ja": "遠隔操作設定状態"
      },
      "epc": "0xE8",
      "observable": true,
      "schema": {
        "type": "boolean",
        "values": [
          {
            "descriptions": {
              "en": "ON (permitted)",
              "ja": "ON (許可)"
            },
            "edt": "0x41",
            "value": true
          },
          {
            "descriptions": {
              "en": "OFF (prohibited)",
              "ja": "OFF (禁止)"
            },
            "edt": "0x42",
            "value": false
          }
        ]
      },
      "writable": false
    },
    "selectiveDegreeOfOpening": {
      "descriptions": {
        "en": "Selective degree-of-opening setting",
        "ja": "選択開度動作設定"
      },
      "epc": "0xE9",
      "note": {
        "en": "0x46 to 0xFF are defined by user. (Shortcut to degree-of-opening setting, etc.)",
        "ja": "0x46以降はユーザ定義(開度レベル設定のショートカットなど)"
      },
      "observable": true,
      "schema": {
        "enum": [
          "degreeOfOpening",
          "operationTimeOfOpening",
          "operationTimeOfClosing",
          "localSetting",
          "slitDegreeOfOpening"
        ],
        "type": "string",
        "values": [
          {
            "descriptions": {
              "en": "Degree-of-opening setting position: Open",
              "ja": "開度レベル設定位置開"
            },
            "edt": "0x41",
            "value": "degreeOfOpening"
          },
          {
            "descriptions": {
              "en": "Operation time setting value: Open",
              "ja": "動作時間設定値開"
            },
            "edt": "0x42",
            "value": "operationTimeOfOpening"
          },
          {
            "descriptions": {
              "en": "Operation time setting value: Close",
              "ja": "動作時間設定値閉"
            },
            "edt": "0x43",
            "value": "operationTimeOfClosing"
          },
          {
            "descriptions": {
              "en": "Local setting position",
              "ja": "ローカル設定位置"
            },
            "edt": "0x44",
            "value": "localSetting"
          },
          {
            "descriptions": {
              "en": "Slit degree-of-opening setting",
              "ja": "スリット開度設定"
            },
            "edt": "0x45",
            "value": "slitDegreeOfOpening"
          }
        ]
      },
      "writable": true
    },
    "slitDegreeOfOpening": {
      "descriptions": {
        "en": "Slit degree-of-opening",
        "ja": "スリット開度設定"
      },
      "epc": "0xED",
      "note": {
        "en": "Used to specify the degree-of-opening by 8 levels. The property value is 1 for the most open status and 8 for the most closed status (not fully closed).",
        "ja": "開度レベルを8段階で指定。1が最も開状態、8が最も閉状態(全閉ではない)"
      },
      "observable": false,
      "schema": {
        "maximum": 8,
        "minimum": 1,
        "multipleOf": 1,
        "type": "number"
      },
      "writable": true
    },
    "timerOperationMode": {
      "descriptions": {
        "en": "Timer operation setting",
        "ja": "タイマ動作設定"
      },
      "epc": "0x90",
      "observable": true,
      "schema": {
        "type": "boolean",
        "values": [
          {
            "descriptions": {
              "en": "ON",
              "ja": "ON"
            },
            "edt": "0x41",
            "value": true
          },
          {
            "descriptions": {
              "en": "OFF",
              "ja": "OFF"
            },
            "edt": "0x42",
            "value": false
          }
        ]
      },
      "writable": true
    }
  }
}
