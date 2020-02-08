import React, { Component } from 'react';
import { Accordion, Card } from 'react-bootstrap';

import Modal from '../components/Modal/Modal';
import Backdrop from '../components/Backdrop/Backdrop';
import AuthContext from '../context/auth-context';

import './Editor.css';
import 'bootstrap/dist/css/bootstrap.min.css'
import { initDiagram, getModelJson, getImage_B64, onMoreInfo, makeBlob, saveDiagram } from '../scripts/went';

class EditorPage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            projectId: null,
            projectTitle: null,
            projectCanvasJSON: null,
            menuOptions: false,
            moreInfo: false
        }
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
            projectCanvasJSON: this.props.location.state.canvasJSON
        });
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
        const lastAccessDate = new Date().toISOString();
        const lastUpdateDate = new Date().toISOString();
        const image = getImage_B64();

        const requestBody = {
            query: `
                mutation {
                    saveProject(projectSave:{ projectId: "${this.state.projectId}", canvasJSON: ${JSON.stringify(newCanvasJSON)}, lastAccessDate: "${lastAccessDate}", lastUpdateDate: "${lastUpdateDate}", image: "${image}"}) {
                        _id
                        title
                    }
                }
            `
        };

        fetch('http://localhost:8000/graphql', {
            method: 'POST',
            body: JSON.stringify(requestBody),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + this.context.token
            }
        }).then(res => {
            if (res.status !== 200 && res.status !== 201) {
                throw new Error('Failed!');
            }
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
                        onCancel={this.modalCancelHandler}
                        onConfirm={this.modalConfirmHandler}
                        onExit={this.modalExitHandler}
                        onDownload={this.modalDownloadHandler}
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
                    <div id="divDiagramCode" className="div-drawPanel"></div>
                    <div className="div-toolPanel">
                        <div className="div-componentPanel">
                            <div id="divTitle" className="div-title">
                                Components
                            </div>
                            <div id="divSearchC" className="div-searchPanel">
                                <img width="27" height="27" alt="" />
                                <input id="txtSearchC" type="text" placeholder="Search" />
                            </div>
                            <div id="listComponents" className="div-list"></div>
                            <div id="listSentences" className="div-list">
                                <Accordion defaultActiveKey="0">
                                    <Card>
                                        <Accordion.Toggle as={Card.Header} eventKey="0">
                                            <b>IN/OUT</b>
                                        </Accordion.Toggle>
                                        <Accordion.Collapse eventKey="0">
                                            <Card.Body>
                                                <div id="pIO"></div>
                                                Hola
                                            </Card.Body>
                                        </Accordion.Collapse>
                                    </Card>
                                    <Card>
                                        <Accordion.Toggle as={Card.Header} eventKey="1">
                                            <b>Serial</b>
                                        </Accordion.Toggle>
                                        <Accordion.Collapse eventKey="1">
                                            <Card.Body>
                                                <div id="pSRL"></div>
                                                Adiós
                                            </Card.Body>
                                        </Accordion.Collapse>
                                    </Card>
                                </Accordion>
                            </div>
                        </div>
                        <div className="div-infoPanel">
                            <div className="div-title">
                                Overview
                            </div>
                            <div id="div-overview"></div>
                            <div id="div-overviewCode"></div>
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