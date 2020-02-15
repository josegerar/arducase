import React from 'react';
import BlocklyComponent from './BlocklyComponent';
import Blockly from 'blockly/core';
import GenArduino from "./AutogenerateCode/GenArduino";

export default BlocklyComponent;

const Block = (p) => {
    const { children, ...props } = p;
    props.is = "blockly";
    return React.createElement("block", props, children);
};

const Category = (p) => {
    const { children, ...props } = p;
    props.is = "blockly";
    return React.createElement("category", props, children);
};

const Value = (p) => {
    const { children, ...props } = p;
    props.is = "blockly";
    return React.createElement("value", props, children);
};

const Field = (p) => {
    const { children, ...props } = p;
    props.is = "blockly";
    return React.createElement("field", props, children);
};

const Shadow = (p) => {
    const { children, ...props } = p;
    props.is = "blockly";
    return React.createElement("shadow", props, children);
};

const downloadCode = () => {
    Blockly.Arduino.saveTextFileAs(
        "Code.ino",
        Blockly.Arduino.generateArduino()
    );
}

const generateCode = (nodeDataArray, linkDataArray) => {
    nodeDataArray.forEach((comp, Icomp) => {
        if (comp.category === "c1") {
            new GenArduino(comp,linkDataArray).execute();
        }
    });
};


export { Block, Category, Value, Field, Shadow, downloadCode, generateCode }