import React from 'react';

import './EmailItem.css';


const emailItem = props => (
    <li key={props.pos} className="projects__list-item">
        <div>
            <label >{props.email}</label>
            <button title="Delete Email" onClick={props.onDelete.bind(this, props.email, props.pos)}>Delete</button>
        </div>
    </li>
);

export default emailItem;