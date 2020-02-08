import React from 'react';

import ProjectItem from './ProjectItem/ProjectItem';
import './ProjectList.css';

const projectList = props => {
    const projects = props.projects.map(project => {
        return (
        <ProjectItem 
        key={project._id} 
        projectId={project._id} 
        title={project.title} 
        createdDate={project.createdDate} 
        lastAccessDate={project.lastAccessDate} 
        lastUpdateDate={project.lastUpdateDate} 
        canvasJSON={project.canvasJSON}
        image={project.image}
        getImgSrc={props.onGetImgSrc}
        userId={props.authUserId} 
        creatorId={project.creator._id} 
        onDetail={props.onViewDetail}
        onOpen={props.onOpenProject}
        onUpdate={props.onUpdateProject}
        onDelete={props.onDeleteProject}
        />
        );
    });
    return (<ul className="projects__list"> {projects} </ul>)
};

export default projectList;