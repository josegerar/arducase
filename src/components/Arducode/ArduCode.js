import * as Blockly from 'blockly/core';

Blockly.Arduino = new Blockly.Generator('Arduino');
Blockly.Arduino.definitions_ = Object.create(Array);
Blockly.Arduino.setups_ = Object.create(Array);
Blockly.Arduino.setupsfin_ = Object.create(Array);

Blockly.Arduino.finish = function (code) {
    let declarehttp = [];
    for (let name in Blockly.Arduino.declarehttp_) {
        declarehttp.push(Blockly.Arduino.declarehttp_[name]);
    }
//console.log(code);
//console.log(Blockly.Arduino.setups_);
//console.log(Blockly.Arduino.setupsfin_);


    code = '  ' + code.replace(/\n/g, '\n  ');
    code = code.replace(/\n\s+$/, '\n');
    code = 'void loop() \n{\n' + declarehttp.join('\n') + '\n' + code + '\n}';

    let imports = [];
    let definitions = [];
    for (let name in Blockly.Arduino.definitions_) {
        let def = Blockly.Arduino.definitions_[name];
        def.match(/^#include/) ? imports.push(def) : definitions.push(def);
    }

    let setups = [];
    for (let name in Blockly.Arduino.setups_) {
        setups.push(Blockly.Arduino.setups_[name]);
    }
    let setupsfin = [];
    for (let name in Blockly.Arduino.setupsfin_) {
        setups.push(Blockly.Arduino.setupsfin_[name]);
    }

    let allDefs = imports.join('\n') + '\n\n' + definitions.join('\n') + '\nvoid setup() \n{\n' + setups.join('\n  ') + setupsfin.join('\n  ') + '\n}\n\n';
    return allDefs.replace(/\n\n+/g, '\n\n').replace(/\n*$/, '\n\n\n') + code;
}


Blockly.Arduino.scrubNakedValue = function (line) {
    return line + ';\n';
};

Blockly.Arduino.quote_ = function (string) {
    string = string.replace(/\\/g, '\\\\')
        .replace(/\n/g, '\\\n')
        .replace(/\$/g, '\\$')
        .replace(/'/g, '\\\'');
    return '"' + string + '"';
};

Blockly.Arduino.simplequote_ = function (string) {
    string = string.replace(/\\/g, '\\\\')
        .replace(/\n/g, '\\\n')
        .replace(/\$/g, '\\$')
        .replace(/'/g, '\\\'');
    return '\'' + string + '\'';
};


Blockly.Arduino.scrub_ = function (block, code) {
    if (code === null) {
        return '';
    }
    let commentCode = '';
    if (!block.outputConnection || !block.outputConnection.targetConnection) {
        let comment = block.getCommentText();
        if (comment) {
            commentCode += this.prefixLines(comment, '// ') + '\n';
        }
        for (let x = 0; x < block.inputList.length; x++) {
            if (block.inputList[x].type === Blockly.INPUT_VALUE) {
                let childBlock = block.inputList[x].connection.targetBlock();
                if (childBlock) {
                    let comment = this.allNestedComments(childBlock);
                    if (comment) {
                        commentCode += this.prefixLines(comment, '# ');
                    }
                }
            }
        }
    }
    let nextBlock = block.nextConnection && block.nextConnection.targetBlock();
    let nextCode = this.blockToCode(nextBlock);
    return commentCode + code + nextCode;
};





//IN/OUT
//Digital

Blockly.Arduino['inout_highlow'] = function (block) {
    let code = (this.getFieldValue('BOOL') === 'HIGH') ? 'HIGH' : 'LOW';
    return [code, 0];
};

Blockly.Arduino['inout_digital_read'] = function (block) {
    if (!this.setup_pos) {
        this.setup_pos = Blockly.Arduino.setups_.length;
    } 
    let dropdown_pin = this.getFieldValue('PIN');
    Blockly.Arduino.setups_['setup_input_' + this.setup_pos] = 'pinMode(' + dropdown_pin + ', INPUT);';
    let code = 'digitalRead(' + dropdown_pin + ')';
    return [code, 0];
};

Blockly.Arduino['inout_digital_write'] = function (block) {
    if (!this.setup_pos) {
        this.setup_pos = Blockly.Arduino.setups_.length;
    } 
    let dropdown_pin = this.getFieldValue('PIN');
    let dropdown_stat = this.getFieldValue('STAT');
    Blockly.Arduino.setups_['setup_output_' + this.setup_pos] = 'pinMode(' + dropdown_pin + ', OUTPUT);';
    let code = 'digitalWrite(' + dropdown_pin + ', ' + dropdown_stat + ');\n';
    return code;
};

Blockly.Arduino['inout_buildin_led'] = function (block) {
    let dropdown_stat = this.getFieldValue('STAT');
    Blockly.Arduino.setups_['setup_output_13'] = 'pinMode(13, OUTPUT);';
    let code = 'digitalWrite(13, ' + dropdown_stat + ');\n'
    return code;
};

//Analog

Blockly.Arduino['inout_analog_read'] = function (block) {
    if (!this.setup_pos) {
        this.setup_pos = Blockly.Arduino.setups_.length;
    } 
    let dropdown_pin = this.getFieldValue('PIN');
    Blockly.Arduino.setups_['setup_input_' + this.setup_pos] = 'pinMode(' + dropdown_pin + ', INPUT);';
    let code = 'analogRead(' + dropdown_pin + ')';
    return [code, 0];
};

Blockly.Arduino['inout_analog_write'] = function (block) {
    if (!this.setup_pos) {
        this.setup_pos = Blockly.Arduino.setups_.length;
    } 
    let dropdown_pin = block.getFieldValue('PIN');
    let value = Blockly.Arduino.valueToCode(this, 'Value', 0);
    Blockly.Arduino.setups_['setup_output_' + this.setup_pos] = 'pinMode(' + dropdown_pin + ', OUTPUT);';
    let code = 'analogWrite(' + dropdown_pin + ', ' + value + ');\n';
    return code;
};

//Serial

Blockly.Arduino['serial_printfor'] = function (block) {
    let content = Blockly.Arduino.valueToCode(this, 'CONTENT', 99);
    //content = content.replace('(','').replace(')','');
    let type = this.getFieldValue('TYPE');
    Blockly.Arduino.setups_['setup_serial'] = 'Serial.begin(9600);';
    //Blockly.Arduino.setups_['setup_serial_'+profile.default.serial] = 'Serial.begin('+profile.default.serial+');\n';
    let code = 'Serial.println(' + content + ', ' + type + ');\n';//ORGINAL \nSerial.print(\'\\t\');
    return code;
};











Blockly.Arduino['arduino_setup'] = function (block) {
    let statements_setup = Blockly.Arduino.statementToCode(block, 'MySetup');
    let statements_loop = Blockly.Arduino.statementToCode(block, 'MyLoop');

    Blockly.Arduino.setups_['setup'] = statements_setup;

    let code = statements_loop;
    return code;
};