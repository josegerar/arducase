import React from 'react';

import './EmailItem.css';


const emailItem = props => (
    <li key={props.pos} >
        <div className="email-items">
            <label >{props.email}</label>
            <button title="Delete Email" onClick={props.onDelete.bind(this, props.email, props.pos)}>Delete</button>
        </div>
    </li>
);

export default emailItem;