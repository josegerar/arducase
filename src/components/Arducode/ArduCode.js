import * as Blockly from "blockly/core";
import { saveAs } from "../Blockly/FileSaver.js";

Blockly.Arduino = new Blockly.Generator("Arduino");
Blockly.Arduino.saveTextFileAs = function(fileName, content) {
  let blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  saveAs(blob, fileName);
};

Blockly.Arduino.load = function(xml_text) {
  if (xml_text && xml_text !== "{}") {
    let xml = Blockly.Xml.textToDom(xml_text);
    Blockly.Xml.domToWorkspace(xml, Blockly.mainWorkspace);
  }
};

Blockly.Arduino.changeBloking = function() {
  let codeTextarea = document.getElementById("content_arduino");
  let code = Blockly.Arduino.workspaceToCode(Blockly.mainWorkspace);
  codeTextarea.value = code || "";
};

Blockly.Arduino.generateArduino = function() {
  return Blockly.Arduino.workspaceToCode(Blockly.mainWorkspace);
};

Blockly.Arduino.generateXml = function() {
  let xml = Blockly.Xml.workspaceToDom(Blockly.mainWorkspace);
  return Blockly.Xml.domToText(xml);
};

Blockly.Arduino.addReservedWords(
  "setup,loop,if,else,for,switch,case,while,do,break,continue,return,goto,define,include,HIGH,LOW,INPUT,OUTPUT,INPUT_PULLUP,true,false,interger, constants,floating,point,void,bookean,char,unsigned,byte,int,word,long,float,double,string,String,array,static, volatile,const,sizeof,pinMode,digitalWrite,digitalRead,analogReference,analogRead,analogWrite,tone,noTone,shiftOut,shitIn,pulseIn,millis,micros,delay,delayMicroseconds,min,max,abs,constrain,map,pow,sqrt,sin,cos,tan,randomSeed,random,lowByte,highByte,bitRead,bitWrite,bitSet,bitClear,bit,attachInterrupt,detachInterrupt,interrupts,noInterrupts"
);

Blockly.Variables.allVariables = function(root) {
  var blocks;
  if (root.getDescendants) {
    blocks = root.getDescendants();
  } else if (root.getAllBlocks) {
    blocks = root.getAllBlocks();
  } else {
    throw new Error("Not Block or Workspace: " + root);
  }
  var variableHash = Object.create(null);
  for (var x = 0; x < blocks.length; x++) {
    if (blocks[x].getVars) {
      var blockVariables = blocks[x].getVars();
      for (var y = 0; y < blockVariables.length; y++) {
        var varName = blockVariables[y];
        if (varName) {
          variableHash[varName.toLowerCase()] = varName;
        }
      }
    }
  }
  var variableList = [];
  for (var name in variableHash) {
    variableList.push(variableHash[name]);
  }
  return variableList;
};

Blockly.Arduino.init = function(workspace) {
  Blockly.Arduino.definitions_ = Object.create(null);
  Blockly.Arduino.setups_ = Object.create(null);
  Blockly.Arduino.setupsfin_ = Object.create(null);
  Blockly.Arduino.declarehttp_ = Object.create(null);
  Blockly.Arduino.functionNames_ = Object.create(null);

  if (Blockly.Variables) {
    if (!Blockly.Arduino.variableDB_) {
      Blockly.Arduino.variableDB_ = new Blockly.Names(
        Blockly.Arduino.RESERVED_WORDS_
      );
      console.log("Hola estoy aquí");
    } else {
      Blockly.Arduino.variableDB_.reset();
    }
    var variables = Blockly.Variables.allVariables(workspace);
    for (var x = 0; x < variables.length; x++) {}
  }
};

Blockly.Arduino.finish = function(code) {
  let gener_arduino = "/////////////////////////////////\n";
  gener_arduino += "// ArduCase (Beta)            //\n";
  gener_arduino += "/////////////////////////////////\n";

  let declarehttp = [];
  for (let name in Blockly.Arduino.declarehttp_) {
    declarehttp.push(Blockly.Arduino.declarehttp_[name]);
  }

  code = "  " + code.replace(/\n/g, "\n  ");
  code = code.replace(/\n\s+$/, "\n");
  code = "void loop() \n{\n" + declarehttp.join("\n") + "\n" + code + "\n}";

  let imports = [];
  let definitions = [];
  for (let name in Blockly.Arduino.definitions_) {
    let def = Blockly.Arduino.definitions_[name];
    if (def.match(/^#include/)) {
      imports.push(def);
    } else {
      definitions.push(def);
    }
  }

  let setups = [];
  for (let name in Blockly.Arduino.setups_) {
    setups.push(Blockly.Arduino.setups_[name]);
  }
  let setupsfin = [];
  for (let name in Blockly.Arduino.setupsfin_) {
    setups.push(Blockly.Arduino.setupsfin_[name]);
  }

  let allDefs =
    imports.join("\n") +
    "\n\n" +
    definitions.join("\n") +
    "\nvoid setup() \n{\n" +
    setups.join("\n  ") +
    setupsfin.join("\n  ") +
    "\n}\n\n";
  return (
    gener_arduino +
    allDefs.replace(/\n\n+/g, "\n\n").replace(/\n*$/, "\n\n\n") +
    code
  );
};

Blockly.Arduino.scrubNakedValue = function(line) {
  return line + ";\n";
};

Blockly.Arduino.quote_ = function(string) {
  string = string
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\\n")
    .replace(/\$/g, "\\$")
    .replace(/'/g, "\\'");
  return '"' + string + '"';
};

Blockly.Arduino.simplequote_ = function(string) {
  string = string
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\\n")
    .replace(/\$/g, "\\$")
    .replace(/'/g, "\\'");
  return "'" + string + "'";
};

Blockly.Arduino.scrub_ = function(block, code) {
  if (code === null) {
    return "";
  }
  let commentCode = "";
  if (!block.outputConnection || !block.outputConnection.targetConnection) {
    let comment = block.getCommentText();
    if (comment) {
      commentCode += this.prefixLines(comment, "// ") + "\n";
    }
    for (let x = 0; x < block.inputList.length; x++) {
      if (block.inputList[x].type === Blockly.INPUT_VALUE) {
        let childBlock = block.inputList[x].connection.targetBlock();
        if (childBlock) {
          let comment = this.allNestedComments(childBlock);
          if (comment) {
            commentCode += this.prefixLines(comment, "# ");
          }
        }
      }
    }
  }
  let nextBlock = block.nextConnection && block.nextConnection.targetBlock();
  let nextCode = this.blockToCode(nextBlock);
  return commentCode + code + nextCode;
};

///////////////////////////////////////
//                                   //
//  PARTE DEL CÓDIGO DE CADA BLOQUE  //
//                                   //
///////////////////////////////////////

///////////////////////////////////////
// ARDUINO                           //
///////////////////////////////////////
// IN/OUT
// Digital

Blockly.Arduino["inout_buildin_led"] = function(block) {
  let dropdown_stat = this.getFieldValue("STAT");
  Blockly.Arduino.setups_["setup_output_13"] = "pinMode(13, OUTPUT);";
  let code = "digitalWrite(13, " + dropdown_stat + ");\n";
  return code;
};

Blockly.Arduino["inout_digital_write"] = function(block) {
  let dropdown_pin = this.getFieldValue("PIN");
  let dropdown_stat = this.getFieldValue("STAT");
  Blockly.Arduino.setups_["setup_output_" + dropdown_pin] =
    "pinMode(" + dropdown_pin + ", OUTPUT);";
  let code = "digitalWrite(" + dropdown_pin + ", " + dropdown_stat + ");\n";
  return code;
};

Blockly.Arduino["inout_digital_read"] = function(block) {
  let dropdown_pin = this.getFieldValue("PIN");
  Blockly.Arduino.setups_["setup_input_" + dropdown_pin] =
    "pinMode(" + dropdown_pin + ", INPUT);";
  let code = "digitalRead(" + dropdown_pin + ")";
  return [code, 0];
};

// Analog

Blockly.Arduino["inout_analog_read"] = function(block) {
  let dropdown_pin = this.getFieldValue("PIN");
  Blockly.Arduino.setups_["setup_input_" + dropdown_pin] =
    "pinMode(" + dropdown_pin + ", INPUT);";
  let code = "analogRead(" + dropdown_pin + ")";
  return [code, 0];
};

Blockly.Arduino["inout_analog_write"] = function(block) {
  let dropdown_pin = block.getFieldValue("PIN");
  let value = Blockly.Arduino.valueToCode(this, "Value", 0);
  Blockly.Arduino.setups_["setup_output_" + dropdown_pin] =
    "pinMode(" + dropdown_pin + ", OUTPUT);";
  let code = "analogWrite(" + dropdown_pin + ", " + value + ");\n";
  return code;
};

///////////////////////////////////////
// NODEMCU                           //
///////////////////////////////////////
// IN/OUT
// Digital

Blockly.Arduino["inout_buildin_led2"] = function(block) {
  let dropdown_stat = this.getFieldValue("STAT");
  Blockly.Arduino.setups_["setup_output_2"] = "pinMode(2, OUTPUT);";
  let code = "digitalWrite(2, " + dropdown_stat + ");\n";
  return code;
};

Blockly.Arduino["inout_digital_write2"] = function(block) {
  let dropdown_pin = this.getFieldValue("PIN");
  let dropdown_stat = this.getFieldValue("STAT");
  Blockly.Arduino.setups_["setup_output_" + dropdown_pin] =
    "pinMode(" + dropdown_pin + ", OUTPUT);";
  let code = "digitalWrite(" + dropdown_pin + ", " + dropdown_stat + ");\n";
  return code;
};

Blockly.Arduino["inout_digital_read2"] = function(block) {
  let dropdown_pin = this.getFieldValue("PIN");
  Blockly.Arduino.setups_["setup_input_" + dropdown_pin] =
    "pinMode(" + dropdown_pin + ", INPUT);";
  let code = "digitalRead(" + dropdown_pin + ")";
  return [code, 0];
};

// Analog

Blockly.Arduino["inout_analog_read2"] = function(block) {
  let dropdown_pin = this.getFieldValue("PIN");
  Blockly.Arduino.setups_["setup_input_" + dropdown_pin] =
    "pinMode(" + dropdown_pin + ", INPUT);";
  let code = "analogRead(" + dropdown_pin + ")";
  return [code, 0];
};

Blockly.Arduino["inout_analog_write2"] = function(block) {
  let dropdown_pin = block.getFieldValue("PIN");
  let value = Blockly.Arduino.valueToCode(this, "Value", 0);
  Blockly.Arduino.setups_["setup_output_" + dropdown_pin] =
    "pinMode(" + dropdown_pin + ", OUTPUT);";
  let code = "analogWrite(" + dropdown_pin + ", " + value + ");\n";
  return code;
};

//IOT

Blockly.Arduino["ipt_pingip"] = function(block) {
  var value_ip_a = Blockly.Arduino.valueToCode(block, "ip_a", 0);
  var value_ip_b = Blockly.Arduino.valueToCode(block, "ip_b", 0);
  var value_ip_c = Blockly.Arduino.valueToCode(block, "ip_c", 0);
  var value_ip_d = Blockly.Arduino.valueToCode(block, "ip_d", 0);
  Blockly.Arduino.definitions_["define_Ping"] = "#include <ESP8266Ping.h>\n";
  Blockly.Arduino.definitions_["define_ping_function"] =
    "boolean mypingip(int a, int b, int c, int d)\n{\n";
  Blockly.Arduino.definitions_["define_ping_function"] += "boolean result;\n";
  Blockly.Arduino.definitions_["define_ping_function"] +=
    "IPAddress remote_ip(a,b,c,d);\n";
  Blockly.Arduino.definitions_["define_ping_function"] +=
    "result = Ping.ping(remote_ip);\n";
  Blockly.Arduino.definitions_["define_ping_function"] += "return result;\n}\n";

  var code =
    "mypingip(" +
    value_ip_a +
    "," +
    value_ip_b +
    "," +
    value_ip_c +
    "," +
    value_ip_d +
    ")";
  return [code, 99];
};

// IOT Station

Blockly.Arduino["iots_connectnetwork_pass"] = function(block) {
  var value_ssid = Blockly.Arduino.valueToCode(block, "ssid", 0);
  var value_password = Blockly.Arduino.valueToCode(block, "password", 0);
  Blockly.Arduino.definitions_["define_ESP"] = "#include <ESP8266WiFi.h>\n";
  var code = " WiFi.begin(" + value_ssid + "," + value_password + ");\n";
  return code;
};

Blockly.Arduino["iots_isconnected"] = function(block) {
  var code = "WiFi.status() == WL_CONNECTED";
  return [code, 99];
};

// IOT Server

Blockly.Arduino["iot_startserver"] = function(block) {
  var value_port = Blockly.Arduino.valueToCode(block, "port", 0);
  Blockly.Arduino.definitions_["define_WebServer"] =
    "#include <ESP8266WebServer.h>\n";
  Blockly.Arduino.definitions_["define_portws"] =
    "ESP8266WebServer server(" + value_port + ");\n";
  var code = "server.begin();\n";
  return code;
};

// IOT WebSockets

Blockly.Arduino["iot_startserver2"] = function(block) {
  var value_port = Blockly.Arduino.valueToCode(block, "port", 0);
  Blockly.Arduino.definitions_["define_WebSocket"] =
    "#include <WebSocketsServer.h>\n";
  Blockly.Arduino.definitions_["define_portwst"] =
    "WebSocketsServer webSocket(" + value_port + ");\n";
  var code = "webSocket.begin();\n";
  return code;
};

// Sensors

Blockly.Arduino["infrared_read"] = function(block) {
  let value_port = block.getFieldValue("PIN");
  let value_name = "infrared_" + value_port;
  Blockly.Arduino.definitions_["define_Infrared"] = "#include <infrarrojo.h>\n";
  Blockly.Arduino.definitions_["defineI_" + value_port] =
    "infrarrojo " + value_name + "(" + value_port + ");\n";
  let code = value_name + ".lectura()";
  return [code, 0];
};

///////////////////////////////////////
// OTHER                             //
///////////////////////////////////////
//IN/OUT

Blockly.Arduino["inout_highlow"] = function(block) {
  let code = this.getFieldValue("BOOL") === "HIGH" ? "HIGH" : "LOW";
  return [code, 0];
};

//Serial

Blockly.Arduino["serial_printfor"] = function(block) {
  let content = Blockly.Arduino.valueToCode(this, "CONTENT", 99);
  let type = this.getFieldValue("TYPE");
  Blockly.Arduino.setups_["setup_serial"] = "Serial.begin(9600);";
  let code = "Serial.println(" + content + ", " + type + ");\n"; //ORGINAL \nSerial.print(\'\\t\');
  return code;
};

Blockly.Arduino["serial_read"] = function(block) {
  let code = "Serial.read()";
  return [code, 0];
};

Blockly.Arduino["serial_available"] = function(block) {
  let code = "Serial.available()";
  Blockly.Arduino.setups_["setup_serial"] = "Serial.begin(9600);";
  return [code, 0];
};

Blockly.Arduino["serial_print"] = function(block) {
  let content = Blockly.Arduino.valueToCode(this, "CONTENT", 0) || "0";
  Blockly.Arduino.setups_["setup_serial"] = "Serial.begin(9600);";
  let code = "Serial.println(" + content + ");\n";
  return code;
};

Blockly.Arduino["serial_printL"] = function(block) {
  let content = Blockly.Arduino.valueToCode(this, "CONTENT", 0) || "0";
  Blockly.Arduino.setups_["setup_serial"] = "Serial.begin(9600);";
  let code = "Serial.print(" + content + ");\n";
  return code;
};

Blockly.Arduino["serial_write"] = function(block) {
  let content = Blockly.Arduino.valueToCode(this, "CONTENT", 0) || "0";
  Blockly.Arduino.setups_["setup_serial"] = "Serial.begin(9600);";
  let code = "Serial.write(" + content + ");\n";
  return code;
};

Blockly.Arduino["serial_write_out"] = function(block) {
  let value_num = Blockly.Arduino.valueToCode(this, "CONTENT", 99);
  Blockly.Arduino.setups_["setup_serial"] = "Serial.begin(9600);";
  let code = "Serial.write(" + value_num + ")";
  return [code, 0];
};

Blockly.Arduino["serial_flush"] = function(block) {
  Blockly.Arduino.setups_["setup_serial"] = "Serial.begin(9600);";
  let code = "Serial.flush();\n";
  return code;
};

//Text

Blockly.Arduino["text"] = function() {
  let code = Blockly.Arduino.quote_(this.getFieldValue("TEXT"));
  return [code, 0];
};

//Math

Blockly.Arduino["math_number"] = function() {
  let code = window.parseFloat(this.getFieldValue("NUM"));
  let order = code < 0 ? 2 : 0;
  return [code, order];
};

//Logic

Blockly.Arduino["controls_if"] = function() {
  let argument = Blockly.Arduino.valueToCode(this, "IF", 99) || "false";
  let branch1 = Blockly.Arduino.statementToCode(this, "DO");
  let code = "if (" + argument + ") {\n" + branch1 + "\n}";
  let branch2 = Blockly.Arduino.statementToCode(this, "ELSE");
  code += " else {\n" + branch2 + "\n}";
  return code + "\n";
};

Blockly.Arduino.logic_compare = function() {
  var mode = this.getFieldValue("OP");
  var operator = Blockly.Arduino.logic_compare.OPERATORS[mode];
  var order = operator === "==" || operator === "!=" ? 7 : 6;
  var argument0 = Blockly.Arduino.valueToCode(this, "A", order) || "0";
  var argument1 = Blockly.Arduino.valueToCode(this, "B", order) || "0";
  var code = argument0 + " " + operator + " " + argument1;
  return [code, order];
};
Blockly.Arduino.logic_compare.OPERATORS = {
  EQ: "==",
  NEQ: "!=",
  LT: "<",
  LTE: "<=",
  GT: ">",
  GTE: ">="
};

Blockly.Arduino["logic_operation"] = function() {
  var operator = this.getFieldValue("OP") === "AND" ? "&&" : "||";
  var order = operator === "&&" ? 11 : 12;
  var argument0 = Blockly.Arduino.valueToCode(this, "A", order) || "false";
  var argument1 = Blockly.Arduino.valueToCode(this, "B", order) || "false";
  var code = argument0 + " " + operator + " " + argument1;
  return [code, order];
};

Blockly.Arduino["logic_boolean"] = function() {
  var code = this.getFieldValue("BOOL") === "TRUE" ? "true" : "false";
  return [code, 0];
};

Blockly.Arduino["logic_null"] = function() {
  var code = "NULL";
  return [code, 0];
};

Blockly.Arduino["logic_negate"] = function() {
  var order = 2;
  var argument0 = Blockly.Arduino.valueToCode(this, "BOOL", order) || "false";
  var code = "!" + argument0;
  return [code, order];
};

//Loops

Blockly.Arduino["while_do"] = function() {
  var statements_name = Blockly.Arduino.statementToCode(this, "STATNAME");
  var value_name = Blockly.Arduino.valueToCode(this, "CONDI", 0) || "false";
  var code = "do {\n" + statements_name + "} while (" + value_name + ");";
  return code;
};

Blockly.Arduino["do_while"] = function() {
  var statements_name = Blockly.Arduino.statementToCode(this, "STATNAME");
  var value_name = Blockly.Arduino.valueToCode(this, "CONDI", 0) || "false";
  var code = "while (" + value_name + "){\n" + statements_name + "\n}\n";
  return code;
};

//Variables

Blockly.Arduino["variables_declare"] = function() {
  var dropdown_type = this.getFieldValue("PROPERTY");
  var argument0 = Blockly.Arduino.valueToCode(this, "VALUE", 14) || "0";
  var argumenttab = Blockly.Arduino.valueToCode(this, "DIVISOR", 14) || "0";

  var varName = Blockly.mainWorkspace.variableMap_.getVariableById(
    this.getFieldValue("VAR")
  ).name;
  //console.log(Blockly.mainWorkspace.variableMap_.getVariableById(this.getFieldValue('VAR')).name);

  if (dropdown_type === "stringa") {
    Blockly.Arduino.definitions_["variables" + varName] =
      "char " + varName + "[" + argumenttab + "]=" + argument0 + ";";
  } else {
    Blockly.Arduino.definitions_["variables" + varName] =
      dropdown_type + "  " + varName + ";";
    Blockly.Arduino.setups_["setup_var" + varName] =
      varName + " = " + argument0 + ";";
  }
  return "";
};

Blockly.Arduino["variables_get"] = function() {
  var code = Blockly.mainWorkspace.variableMap_.getVariableById(
    this.getFieldValue("VAR")
  ).name;
  return [code, 0];
};

Blockly.Arduino["variables_set"] = function() {
  var argument0 = Blockly.Arduino.valueToCode(this, "VALUE", 14) || "0";
  var varName = Blockly.mainWorkspace.variableMap_.getVariableById(
    this.getFieldValue("VAR")
  ).name;
  return varName + " = " + argument0 + ";\n";
};

//Functions
Blockly.Arduino["function_void"] = function(block) {
  let name_function = block.getFieldValue("NAME");
  //let statements_fv = Blockly.Arduino.statementToCode(block, "myFunctionVoid");
  let text = "void " + name_function + "(){";
  this.childBlocks_.forEach((element, index) => {});
  text += "\n}\n";
  Blockly.Arduino.definitions_["fv_" + name_function] = text;
  //let code = statements_fv;
  return "";
};

//Display
//Serial LCD I2C

Blockly.Arduino["lcdi2c_setup"] = function(block) {
  var text_name = block.getFieldValue("NAME");
  Blockly.Arduino.definitions_["define_lcd"] =
    "#include <Wire.h>\n#include <LiquidCrystal_I2C.h>\n";
  var value_columns = Blockly.Arduino.valueToCode(block, "COLUMNS", 0);
  var value_rows = Blockly.Arduino.valueToCode(block, "ROWS", 0);
  Blockly.Arduino.definitions_["define_lcdpins"] =
    "LiquidCrystal_I2C lcd(" +
    text_name +
    "," +
    value_columns +
    "," +
    value_rows +
    ");\n";
  Blockly.Arduino.setups_["setup_lcdi2c"] = "lcd.begin();\n";
  var code = "";
  return code;
};

Blockly.Arduino["lcdi2c_print"] = function(block) {
  var value_texttoprint = Blockly.Arduino.valueToCode(block, "texttoprint", 0);
  var code = "lcd.print(" + value_texttoprint + ");\n";
  return code;
};

Blockly.Arduino["lcdi2c_clear"] = function(block) {
  var code = "lcd.clear();\n";
  return code;
};

Blockly.Arduino["lcdi2c_setcursor"] = function(block) {
  var value_column = Blockly.Arduino.valueToCode(block, "column", 0);
  var value_row = Blockly.Arduino.valueToCode(block, "row", 0);
  var code = "lcd.setCursor(" + value_column + ", " + value_row + ");\n";
  return code;
};

Blockly.Arduino["lcdi2c_display"] = function(block) {
  var code = "lcd.display();\n";
  return code;
};

Blockly.Arduino["lcdi2c_nodisplay"] = function(block) {
  var code = "lcd.noDisplay();\n";
  return code;
};

//Advanced

Blockly.Arduino["arduino_setup"] = function(block) {
  let statements_setup = Blockly.Arduino.statementToCode(block, "MySetup");
  let statements_loop = Blockly.Arduino.statementToCode(block, "MyLoop");

  Blockly.Arduino.setups_["setup"] = statements_setup;

  let code = statements_loop;
  return code;
};

Blockly.Arduino["base_delayms"] = function() {
  return (
    "delay(" +
    (Blockly.Arduino.valueToCode(this, "DELAY_TIME", 0) || "1000") +
    ");\n"
  );
};

Blockly.Arduino["iots_localip"] = function(block) {
  var code = "WiFi.localIP().toString()";
  return [code, 99];
};

Blockly.Arduino["mqtt_loop"] = function(block) {
  var code = "webSocket.loop(); \n";
  return code;
};

Blockly.Arduino["wsocket_bctxt"] = function(block) {
  var txt = Blockly.Arduino.valueToCode(block, "TXT", 0);
  var code = "webSocket.broadcastTXT(" + txt + "); \n";
  return code;
};
