import React, { Component } from 'react';
import * as go from 'gojs';

import Modal from '../components/Modal/Modal';
import Backdrop from '../components/Backdrop/Backdrop';
import ProjectList from '../components/Projects/ProjectList/ProjectList';
import Spinner from '../components/Spinner/Spinner';
import AuthContext from '../context/auth-context';
import './Projects.css';

class ProjectsPage extends Component {
    state = {
        creating: false,
        projects: [],
        isLoading: false,
        selectedProject: null,
        updating: false
    };

    static contextType = AuthContext;

    constructor(props) {
        super(props);
        this.titleElRef = React.createRef();
        this.descriptionElRef = React.createRef();
    }

    componentDidMount() {
        this.fetchEvents();
    }

    startCreateEventHandler = () => {
        this.setState({ creating: true });
    }

    modalConfirmHandler = () => {
        this.setState({ creating: false });
        const $ = go.GraphObject.make;
        const diagram = $(go.Diagram);
        diagram.model = $(go.GraphLinksModel, {
            linkFromPortIdProperty: "fromPort",
            linkToPortIdProperty: "toPort"
        });
        const title = this.titleElRef.current.value;
        const description = this.descriptionElRef.current.value;
        const createdDate = new Date().toISOString();
        const lastAccessDate = new Date().toISOString();
        const lastUpdateDate = new Date().toISOString();
        const image = " ";
        const canvasJSON = diagram.model.toJson();
        const especJSON = "{}";

        if (title.trim().length === 0 || description.trim().length === 0) {
            return;
        }

        const requestBody = {
            query: `
                mutation CreateProject($title: String!, $description: String!, $createdDate: String!, $lastAccessDate: String!, $lastUpdateDate: String!, $image: String!, $canvasJSON: String!, $especJSON: String!) {
                    createProject(projectInput:{ title: $title, description: $description, createdDate: $createdDate, lastAccessDate: $lastAccessDate, lastUpdateDate: $lastUpdateDate, image: $image, canvasJSON: $canvasJSON, especJSON: $especJSON }) {
                        _id
                        title
                        description
                        createdDate
                        lastAccessDate
                        lastUpdateDate
                        image
                        canvasJSON
                        especJSON
                    }
                }
            `,
            variables: {
                title: title,
                description: description,
                createdDate: createdDate,
                lastAccessDate: lastAccessDate,
                lastUpdateDate: lastUpdateDate,
                image: image,
                canvasJSON: canvasJSON,
                especJSON: especJSON
            }
        };

        const token = this.context.token;

        fetch(`${this.context.webservice}graphql`, {
            method: 'POST',
            body: JSON.stringify(requestBody),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            }
        }).then(res => {
            if (res.status !== 200 && res.status !== 201) {
                throw new Error('Failed!');
            }
            return res.json();
        }).then(resData => {
            console.log(resData);
            this.setState(prevState => {
                const updatedProjects = [...prevState.projects];
                updatedProjects.push({
                    _id: resData.data.createProject._id,
                    title: resData.data.createProject.title,
                    description: resData.data.createProject.description,
                    createdDate: resData.data.createProject.createdDate,
                    lastAccessDate: resData.data.createProject.lastAccessDate,
                    lastUpdateDate: resData.data.createProject.lastUpdateDate,
                    image: resData.data.createProject.image,
                    canvasJSON: resData.data.createProject.canvasJSON,
                    especJSON: resData.data.createProject.especJSON,
                    creator: {
                        _id: this.context.userId
                    }
                });
                return { projects: updatedProjects };
            });
            this.props.history.replace({
                pathname: '/editor',
                state: {
                    projectId: resData.data.createProject._id,
                    title: resData.data.createProject.title,
                    canvasJSON: resData.data.createProject.canvasJSON
                }
            });
            this.props.history.replace('/editor');
        }).catch(err => {
            console.log(err);
        });
    };

    modalCancelHandler = () => {
        this.setState({ creating: false, updating: false, selectedProject: null });
    };

    fetchEvents() {
        this.setState({ isLoading: true });
        const requestBody = {
            query: `
                query {
                    projects {
                        _id
                        title
                        description
                        createdDate
                        lastAccessDate
                        lastUpdateDate
                        image
                        canvasJSON
                        especJSON
                        creator {
                            _id
                            username
                        }
                    }
                }
            `
        };

        fetch(`${this.context.webservice}graphql`, {
            method: 'POST',
            body: JSON.stringify(requestBody),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(res => {
            if (res.status !== 200 && res.status !== 201) {
                throw new Error('Failed!');
            }
            return res.json();
        }).then(resData => {
            if(resData && resData.data && resData.data.projects){
                const projects = resData.data.projects;
                this.setState({ projects: projects, isLoading: false });
            }
        }).catch(err => {
            console.log(err);
            this.setState({ isLoading: false });
        });
    }

    getImageSrc = (imageData) => {
        const b64toBlob = (b64Data, contentType = '', sliceSize = 512) => {
            const byteCharacters = atob(b64Data);
            const byteArrays = [];

            for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
                const slice = byteCharacters.slice(offset, offset + sliceSize);

                const byteNumbers = new Array(slice.length);
                for (let i = 0; i < slice.length; i++) {
                    byteNumbers[i] = slice.charCodeAt(i);
                }

                const byteArray = new Uint8Array(byteNumbers);
                byteArrays.push(byteArray);
            }

            const blob = new Blob(byteArrays, { type: contentType });
            return blob;
        }

        const contentType = 'image/png';
        const b64Data = imageData;


        const blob = b64toBlob(b64Data, contentType);
        const blobUrl = URL.createObjectURL(blob);
        return blobUrl;
    }

    showDetailHandler = projectId => {
        this.setState(prevState => {
            const selectedProject = prevState.projects.find(e => e._id === projectId);
            return { selectedProject: selectedProject };
        });
    }

    openProjectHandler = projectId => {
        let id;
        if (this.state.selectedProject) {
            id = this.state.selectedProject._id;
        }
        else {
            id = projectId;
        }
        const pa = this.state.projects.find(e => e._id === id);
        this.setState({ selectedProject: null });

        this.props.history.replace({
            pathname: '/editor',
            state: {
                projectId: pa._id,
                title: pa.title,
                canvasJSON: pa.canvasJSON,
                xmlJSON: pa.especJSON
            }
        });
    };

    updateProjectHandler = projectId => {
        this.setState({ updating: true });
        this.setState(prevState => {
            const selectedProject = prevState.projects.find(e => e._id === projectId);
            return { selectedProject: selectedProject };
        });
    };

    updateConfirmHandler = () => {
        this.setState({ isLoading: true, updating: false, selectedProject: null });
        const title = this.titleElRef.current.value;
        const description = this.descriptionElRef.current.value;
        const lastUpdateDate = new Date().toISOString();
        const projectId = this.state.selectedProject._id;

        if (title.trim().length === 0 || description.trim().length === 0) {
            return;
        }
        const requestBody = {
            query: `
                mutation {
                    updateProject(projectUpdate:{ projectId: "${projectId}", title: "${title}", description: "${description}", lastUpdateDate: "${lastUpdateDate}"}) {
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
                Authorization: 'Bearer ' + this.context.token
            }
        }).then(res => {
            if (res.status !== 200 && res.status !== 201) {
                throw new Error('Failed!');
            }
            return res.json();
        }).then(resData => {
            this.fetchEvents();
        }).catch(err => {
            console.log(err);
            this.setState({ isLoading: false });
        });
    }

    deleteProjectHandler = projectId => {
        this.setState({ isLoading: true });
        const requestBody = {
            query: `
                mutation DeleteProject($id: ID!) {
                    deleteProject(projectId: $id) {
                        username
                    }
                }
            `,
            variables: {
                id: projectId
            }
        };

        fetch(`${this.context.webservice}graphql`, {
            method: 'POST',
            body: JSON.stringify(requestBody),
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + this.context.token
            }
        }).then(res => {
            if (res.status !== 200 && res.status !== 201) {
                throw new Error('Failed!');
            }
            return res.json();
        }).then(resData => {
            this.setState(prevState => {
                const updatedProjects = prevState.projects.filter(project => {
                    return project._id !== projectId;
                });
                return { projects: updatedProjects, isLoading: false };
            });
        }).catch(err => {
            console.log(err);
            this.setState({ isLoading: false });
        });
    };

    render() {
        return (
            <React.Fragment>
                {(this.state.creating || this.state.updating || this.state.selectedProject) && <Backdrop />}
                {this.state.creating && (
                    <Modal
                        title="Create New Project"
                        canCancel
                        canConfirm
                        onCancel={this.modalCancelHandler}
                        onConfirm={this.modalConfirmHandler}
                        confirmText="Create">

                        <form>
                            <div className="div-control">
                                <label htmlFor="title">Title</label>
                                <input type="text" id="title" ref={this.titleElRef} required />
                            </div>
                            <div className="div-control">
                                <label htmlFor="description">Description</label>
                                <textarea id="description" rows="4" ref={this.descriptionElRef} />
                            </div>
                        </form>
                    </Modal>
                )}
                {this.state.selectedProject && !this.state.updating && (
                    <Modal
                        title={this.state.selectedProject.title}
                        canCancel
                        canConfirm
                        onCancel={this.modalCancelHandler}
                        onConfirm={this.openProjectHandler}
                        confirmText="Open in Editor">

                        <div className="div-imgContainer">
                            {this.state.selectedProject.image !== " " ?
                                (<img alt="" className="imgDetailProject" src={`${this.getImageSrc(this.state.selectedProject.image)}`} />) :
                                (<img alt="" className="imgDetailProject" />)
                            }
                        </div>
                        <br />
                        <b>Created Date:</b> {new Date(this.state.selectedProject.createdDate).toLocaleString()}
                        <br />
                        <p>{this.state.selectedProject.description}</p>

                    </Modal>
                )}
                {this.state.updating && this.state.selectedProject && (
                    <Modal
                        title="Project Properties"
                        canCancel
                        canConfirm
                        onCancel={this.modalCancelHandler}
                        onConfirm={this.updateConfirmHandler}
                        confirmText="Update">

                        <form>
                            <div className="div-control">
                                <label htmlFor="title">Title</label>
                                <input type="text" id="title" ref={this.titleElRef} defaultValue={this.state.selectedProject.title} required />
                            </div>
                            <div className="div-control">
                                <label htmlFor="description">Description</label>
                                <textarea id="description" rows="4" ref={this.descriptionElRef} defaultValue={this.state.selectedProject.description} />
                            </div>
                        </form>
                    </Modal>
                )}
                <div className="projects-content">
                    {this.context.token && (
                        <div className="div-createProject">
                            <button onClick={this.startCreateEventHandler}>Create New Project</button>
                        </div>
                    )}
                    <div className="div-listProjects">
                        <div className="div-chartPanel">
                            <div className="div-chartContainer">
                                <div className="div-tableFix">
                                    <div className="div-visualizationCards">
                                        {this.state.isLoading ? <Spinner /> : (
                                            <ProjectList
                                                projects={this.state.projects}
                                                authUserId={this.context.userId}
                                                onGetImgSrc={this.getImageSrc}
                                                onViewDetail={this.showDetailHandler}
                                                onOpenProject={this.openProjectHandler}
                                                onUpdateProject={this.updateProjectHandler}
                                                onDeleteProject={this.deleteProjectHandler}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </React.Fragment>
        );
    }
}

export default ProjectsPage;