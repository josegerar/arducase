import React, { Component } from "react";
import BlocklyComponent, { Block, Category, downloadCode } from "../components/Blockly";
import Blockly from "blockly/core";

import Modal from "../components/Modal/Modal";
import Backdrop from "../components/Backdrop/Backdrop";
import AuthContext from "../context/auth-context";

import "./Editor.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "../components/blocks/customblocks";
import { initDiagram, getModelJson, getImage_B64, onMoreInfo, makeBlob, saveDiagram } from "../scripts/went";

class EditorPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      projectId: null,
      projectTitle: null,
      projectCanvasJSON: null,
      proyectEspecJSON: null,
      menuOptions: false,
      moreInfo: false
    };
    window.editorPage = this;
  }

  static contextType = AuthContext;

  componentDidMount() {
    this.fetchEvents();
  }

  updateState(moreInfo) {
    this.setState({ moreInfo: moreInfo });
  }

  // inicia el diagrama y el generador de codigo
  fetchEvents() {
    this.setState({
      projectId: this.props.location.state.projectId,
      projectTitle: this.props.location.state.title,
      projectCanvasJSON: this.props.location.state.canvasJSON,
      proyectEspecJSON: this.props.location.state.xmlJSON
    });
    Blockly.Arduino.load(this.props.location.state.xmlJSON);
    initDiagram(this.props.location.state.canvasJSON);
  }

  optionsEventHandler = () => {
    this.setState({ menuOptions: true });
  };

  //MODALES EVENTOS

  modalCancelHandler = () => {
    this.setState({ menuOptions: false, moreInfo: false });
  };

  //actualiza el proyecto
  modalConfirmHandler = () => {
    this.setState({ menuOptions: false });
    const newCanvasJSON = getModelJson();
    const newEspecJSON = Blockly.Arduino.generateXml();
    const lastAccessDate = new Date().toISOString();
    const lastUpdateDate = new Date().toISOString();
    const image = getImage_B64();
    const requestBody = {
      query: `
                mutation {
                    saveProject(projectSave:{ projectId: "${this.state.projectId}", canvasJSON: ${JSON.stringify(newCanvasJSON)}, especJSON:${JSON.stringify(newEspecJSON)}, lastAccessDate: "${lastAccessDate}", lastUpdateDate: "${lastUpdateDate}", image: "${image}"}) {
                        _id
                        title
                    }
                }
            `
    };

    fetch(`${this.context.webservice}graphql`, {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + this.context.token
      }
    }).then(res => {
      return res.json();
    }).then(resData => {
      saveDiagram();
      alert("Project saved.");
    }).catch(err => {
      console.log(err);
    });
  };

  modalExitHandler = () => {
    //this.setState({ menuOptions: false });
  };

  modalDownloadHandler = () => {
    this.setState({ menuOptions: false });
    makeBlob();
  };

  modalDownloadCodeHandler = () => {
    downloadCode();
  };

  render() {
    return (
      <React.Fragment>
        {(this.state.menuOptions || this.state.moreInfo) && <Backdrop />}
        {this.state.menuOptions && (
          <Modal
            title="Options"
            canCancel
            canConfirm
            canExit
            canDownload
            canDownloadC
            onCancel={this.modalCancelHandler}
            onConfirm={this.modalConfirmHandler}
            onExit={this.modalExitHandler}
            onDownload={this.modalDownloadHandler}
            onDownloadC={this.modalDownloadCodeHandler}
            confirmText="Save Project"
          ></Modal>
        )}
        {this.state.moreInfo && (
          <Modal
            title={onMoreInfo.title}
            canCancel
            onCancel={this.modalCancelHandler}
          >
            <b>Overview</b>
            <br />
            {onMoreInfo.overview.join("")}
            <br />
            <br />
            <b>Characteristics</b>
            <br />
            {onMoreInfo.characteristics.join("")}
            <br />
            <br />
            <b>Links</b>
            <br />
          </Modal>
        )}
        <div className="editor-content">
          <div className="div-drawPanel">
            <div id="divDiagram" className="div-canvasPanel"></div>
            <div id="toolP" className="div-toolPanel">
              <div className="div-componentPanel">
                <div className="div-title"> Components </div>
                <div id="listComponents" className="div-list"></div>
              </div>
              <div className="div-infoPanel">
                <div className="div-title">Overview</div>
                <div id="div-overview"></div>
              </div>
            </div>
          </div>
          <div id="divDiagramCode" className="div-drawPanelCode">
            <BlocklyComponent
              ref={e => (this.simpleWorkspace = e)}
              readOnly={false}
              initialXml={`
                    <xml xmlns="http://www.w3.org/1999/xhtml">
                    </xml>
                    `}
            >
              <Category name="Arduino">
                <Category name="IN/OUT">
                  <Category name="Digital">
                    <Block type="inout_buildin_led" />
                    <Block type="inout_digital_write" />
                    <Block type="inout_digital_read" />
                  </Category>
                  <Category name="Analog">
                    <Block type="inout_analog_read" />
                    <Block type="inout_analog_write" />
                  </Category>
                </Category>
                <Category name="Sensors"></Category>
              </Category>

              <Category name="NodeMCU ESP8266">
                <Category name="IN/OUT">
                  <Category name="Digital">
                    <Block type="inout_buildin_led2" />
                    <Block type="inout_digital_write2" />
                    <Block type="inout_digital_read2" />
                  </Category>
                  <Category name="Analog">
                    <Block type="inout_analog_read2" />
                    <Block type="inout_analog_write2" />
                  </Category>
                </Category>
                <Category name="IOT">
                  <Block type="ipt_pingip" />
                  <Category name="IOT Station">
                    <Block type="iots_connectnetwork_pass" />
                    <Block type="iots_isconnected" />
                    <Block type="iots_localip" />
                    <Block type="mqtt_loop" />
                    <Block type="wsocket_bctxt" />
                  </Category>
                  <Category name="IOT Server">
                    <Block type="iot_startserver" />
                  </Category>
                  <Category name="IOT WebSockets">
                    <Block type="iot_startserver2" />
                  </Category>
                </Category>
                <Category name="Sensors">
                  <Block type="infrared_read" />
                </Category>
              </Category>

              <Category name="IN/OUT">
                <Block type="inout_highlow" />
              </Category>
              <Category name="Serial">
                <Block type="serial_printfor" />
                <Block type="serial_read" />
                <Block type="serial_available" />
                <Block type="serial_print" />
                <Block type="serial_printL" />
                <Block type="serial_write" />
                <Block type="serial_write_out" />
                <Block type="serial_flush" />
              </Category>
              <Category name="Text">
                <Block type="text" />
              </Category>
              <Category name="Math">
                <Block type="math_number" />
              </Category>
              <Category name="Logic">
                <Block type="controls_if" />
                <Block type="logic_compare" />
                <Block type="logic_operation" />
                <Block type="logic_boolean" />
                <Block type="logic_null" />
                <Block type="logic_negate" />
              </Category>
              <Category name="Loops">
                <Block type="while_do" />
                <Block type="do_while" />
              </Category>
              <Category name="Variables">
                <Block type="variables_declare" />
                <Block type="variables_get" />
                <Block type="variables_set" />
              </Category>
              <Category name="Functions">
                <Block type="function_void" />
              </Category>

              <Category name="Display">
                <Category name="Serial LCD I2C">
                  <Block type="lcdi2c_setup" />
                  <Block type="lcdi2c_print" />
                  <Block type="lcdi2c_clear" />
                  <Block type="lcdi2c_setcursor" />
                  <Block type="lcdi2c_display" />
                  <Block type="lcdi2c_nodisplay" />
                </Category>
              </Category>

              <Category name="Advanced">
                <Block type="arduino_setup" />
                <Block type="base_delayms" />
              </Category>
            </BlocklyComponent>
            <textarea id="content_arduino" className="txta-contentCode" readOnly={true} ></textarea>
          </div>
          <div className="div-footPanel">
            <div className="div-messagePanel"></div>
            <div className="div-tabPanel">
              <button onClick={this.optionsEventHandler}>Options</button>
              <button id="btnSwitch">Code</button>
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }
}

export default EditorPage;
