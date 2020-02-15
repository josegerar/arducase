import React from 'react';
import './BlocklyComponent.css';

import Blockly from 'blockly/core';
import locale from 'blockly/msg/en';
import 'blockly/blocks';
import '../Arducode/ArduCode';

Blockly.setLocale(locale);

class BlocklyComponent extends React.Component {

    componentDidMount() {
        const { initialXml, children, ...rest } = this.props;
        this.primaryWorkspace = Blockly.inject(
            this.blocklyDiv, {
            toolbox: this.toolbox,
            ...rest
        },
        );
        if (initialXml) {
            Blockly.Xml.domToWorkspace(Blockly.Xml.textToDom(initialXml), this.primaryWorkspace);
        }
        this.primaryWorkspace.addChangeListener(this.changeBloking);
    }

    changeBloking(evt){
        Blockly.Arduino.changeBloking();
    }

    get workspace() {
        return this.primaryWorkspace;
    }

    setXml(xml) {
        Blockly.Xml.domToWorkspace(Blockly.Xml.textToDom(xml), this.primaryWorkspace);
    }

    render() {
        const { children } = this.props;

        return <React.Fragment>
            <div ref={e => this.blocklyDiv = e} id="blocklyDiv" className="div-contentCode" />
            <xml xmlns="https://developers.google.com/blockly/xml" is="blockly" style={{ display: 'none' }} ref={(toolbox) => { this.toolbox = toolbox; }}>
                {children}
            </xml>
        </React.Fragment>;
    }
}

export default BlocklyComponent;