import Blockly from 'blockly/core';

export default class GenArduino{
    constructor(arduino, linkDataArray){
        this.arduino = arduino;
        this.linkDataArray = linkDataArray;
    }
    execute(){
        this.linkDataArray.forEach((rel, Irel) => {
            if ([rel.from, rel.to].indexOf(this.arduino.key) > -1) {
                for (let i = 0; i < this.arduino.items.length; i++) {
                    const port = this.arduino.items[i];
                    if ([rel.fromPort, rel.toPort].indexOf(port.name) > -1) {
                        const arduino_setup = this.getArduinoSetup();
                        console.log(arduino_setup);
                        
                        //const parentBlock = Blockly.Block.obtain(Blockly.getMainWorkspace(), 'text_print');

                        //parentBlock.initSvg();
                        //parentBlock.render();

                        break;
                    }
                }
            }
        });
    }
    getArduinoSetup(){
        const array = Blockly.mainWorkspace.getBlocksByType("arduino_setup", true);
        if (array.length === 0) {
            let arduinoSetup = Blockly.mainWorkspace.newBlock('arduino_setup');
            arduinoSetup.initSvg();
            arduinoSetup.render();
            return arduinoSetup;
        }
        return array[0];
    }
}