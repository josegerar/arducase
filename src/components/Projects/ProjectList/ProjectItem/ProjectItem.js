import React from 'react';

import './ProjectItem.css';


const projectItem = props => (
    <div>{props.userId === props.creatorId ? (<li key={props.projectId} className="projects__list-item">
        <div className="div-cardContent">
            <div className="div-imgContainer">
                {props.image !== " " ?
                    (<img alt="" className="imgParameter" src={`${props.getImgSrc(props.image)}`} />) :
                    (<img alt="" className="imgParameter" />)
                }
            </div>
            <button className="btn-titleProject" onClick={props.onDetail.bind(this, props.projectId)}>{props.title}</button>
            <div className="div-listDates">
                <ul>
                    <li>Created Date: <br />
                        {new Date(props.createdDate).toLocaleString()}</li>
                    <li>Last Access Date: <br />
                        {new Date(props.lastAccessDate).toLocaleString()}</li>
                    <li>Last Update Date: <br />
                        {new Date(props.lastUpdateDate).toLocaleString()}</li>
                </ul>
            </div>
            <div className="div-actionsProject">
                <button className="btn-openProject" title="Open Project" onClick={props.onOpen.bind(this, props.projectId)}></button>
                <button className="btn-properties" title="Properties" onClick={props.onUpdate.bind(this, props.projectId)}></button>
                <button className="btn-download" title="Download"></button>
                <button className="btn-delete" title="Delete Project" onClick={props.onDelete.bind(this, props.projectId)}></button>
            </div>
        </div>
    </li>) : (<div></div>)}</div>
);

export default projectItem;