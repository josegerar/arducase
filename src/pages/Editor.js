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
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + this.context.token
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
  }

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
            confirmText="Save Project">

          </Modal>
        )}
        {this.state.moreInfo && (
          <Modal
            title={onMoreInfo.title}
            canCancel
            onCancel={this.modalCancelHandler}>

            <b>Overview</b><br />
            {onMoreInfo.overview.join("")}
            <br /><br />
            <b>Characteristics</b><br />
            {onMoreInfo.characteristics.join("")}
            <br /><br />
            <b>Links</b><br />
          </Modal>
        )}
        <div className="editor-content">
          <div id="divDiagram" className="div-drawPanel"></div>
          <div id="divDiagramCode" className="div-drawPanelCode">
            <BlocklyComponent ref={e => this.simpleWorkspace = e} readOnly={false} move={{
              scrollbars: true,
              drag: true,
              wheel: true,
              collapse: true,
              comments: true,
              trashcan: true,
              zoom: {
                controls: true,
                wheel: true,
                startScale: 1.0,
                maxScale: 3,
                minScale: 0.3,
                scaleSpeed: 1.2
              }
            }} initialXml={`
                    <xml xmlns="http://www.w3.org/1999/xhtml">
                    <block type="arduino_setup"></block>
                    </xml>
                    `}>
              <Category name="IN/OUT">
                <Category name="Digital">
                  <Block type="inout_highlow" />
                  <Block type="inout_buildin_led" />
                  <Block type="inout_digital_write" />
                  <Block type="inout_digital_read" />
                </Category>
                <Category name="Analog">
                  <Block type="inout_analog_read" />
                  <Block type="inout_analog_write" />
                </Category>
              </Category>
              <Category name="Serial">
                <Block type="serial_printfor" />
              </Category>
              <Category name="Advanced">
                <Block type="arduino_setup" />
              </Category>
            </BlocklyComponent>
            <textarea id="content_arduino" className="txta-contentCode" readOnly={true}></textarea>
          </div>
          <div id="toolP" className="div-toolPanel">
            <div className="div-componentPanel">
              <div className="div-title"> Components </div>
              <div id="listComponents" className="div-list"></div>
            </div>
            <div className="div-infoPanel">
              <div className="div-title">
                Overview
                        </div>
              <div id="div-overview"></div>
            </div>
          </div>
          <div className="div-footPanel">
            <div className="div-messagePanel">

            </div>
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
