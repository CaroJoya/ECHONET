# About SmartHomeSimulator

SmartHomeSimulator is software created for IoT programming training. It consists of an IoT House Simulator that mimics a smart home, and an ECHONET Lite Web API that can control the simulator. The IoT House Simulator runs in a browser, while the ECHONET Lite Web API runs on Node.js. All software is written in JavaScript. Node.js is required to run SmartHomeSimulator.

![Screen Image](https://github.com/foobarbazfred/SmartHomeSimulator/raw/main/images/screen_iamge.png?raw=true)

# Installation

Place all source files (everything under the `src` folder) in a Linux or Windows environment where Node.js is available. If using git:

```
git clone https://github.com/foobarbazfred/SmartHomeSimulator.git
```

Navigate to the source folder (`src`) where `app.js` and `package.json` are located, then run the following command to install the required packages:

```
npm install
```

This command causes npm to read `package.json` and automatically install all necessary packages. If errors occur due to version conflicts, you can install the required packages manually. The required packages are:

- body-parser
- express
- socket.io
- morgan
- ejs
- yargs

To install manually, run npm with each package name as follows:

```
npm install body-parser
npm install express
npm install socket.io
npm install ejs
npm install yargs
```

(It has not been confirmed whether morgan also needs to be installed manually.)

# Starting the Software

Run the following command in the source folder (`src`) where `app.js` is located:

```
node app.js
```

When started successfully, the Listen IP and Port will be displayed as shown below. Access the application from your browser using the displayed IP:Port. The ECHONET Lite Web API description page will appear.

```
ubuntu:~/somepass/SmartHomeSimulator/src$ node app.js
this is IPv4 and IP is detected
172.17.96.137
listen on 172.17.96.137:8010
```

In the example above, access `http://172.17.96.137:8010` from your browser. The IP address detection routine has room for improvement and may fail to identify the correct IP address depending on the runtime environment. Please be aware of this limitation. Detailed specifications and usage instructions are planned to be documented in the Wiki.

# Known Issues and Unimplemented Features

1. The API specification of this software is based on the ECHONET Lite Web API specification, but not all features of the Web API are implemented. In particular, the Device Description (device information definition), which defines the attributes of home appliances, is based on samples from the ECHONET Consortium specification documents and does not accurately reflect the attributes of the appliances provided by the IoT House Simulator. Additionally, the API is intended for use on local networks and does not implement any authentication.

2. The software identifies the IP address of the runtime environment's eth0 interface to determine the Listen IP, but may not always resolve it correctly. If the IP address cannot be determined correctly, start the application with the IP address specified explicitly using the format: `node app.js --ip <ip_address>`.

3. Communication between the ECHONET Lite Web API and the IoT House Simulator is handled via WebSocket. Since communication is asynchronous, it is necessary to match request messages with their corresponding response messages. A unique ID is inserted into each message to enable this matching, but the unique ID generation currently produces a fixed value, and the matching logic has not yet been implemented. As a result, message correlation between sent and received messages is not currently functional. Under heavy traffic, messages may be mismatched. The fix requires implementing unique ID generation and a corresponding matching routine.

4. Log output is not properly managed. It is unclear what the standard approach is for handling execution logs in Node.js applications, and currently all logs are simply printed to the startup console.

# ECHONET Lite Web API Specifications

The ECHONET Lite Web API specification documents can be obtained from the ECHONET Consortium website:

- ECHONET Lite Web API Guideline
- https://echonet.jp/web_api_guideline/

# Questions and Issues

If the software does not work correctly, you encounter errors, or you have questions about the specifications, please submit an Issue. You should find an Issues menu on the left side of the screen. We will do our best to respond to questions. Feature additions will be implemented gradually as time permits.

# Free Illustration Credits

The images used in the IoT Home Simulator were obtained from the following sources:

1. Living room image
   - https://www.irasutoya.com/2016/01/blog-post_133.html
   - Copyright(c) irasutoya. All Rights Reserved.

2. Clock image
   - https://frame-illust.com/?p=9756
   - Copyright(c) Free Illustration Material Collection [Frame illust]
