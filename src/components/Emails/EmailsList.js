import React from 'react';

import EmailItem from './EmailItem/EmailItem';
import "./EmailList.css";

const emailList = props => {
    const emails = props.emails.map((em, index) => {
        return (
            <EmailItem
                key={index}
                pos={index}
                email={em}
                onDelete={props.onDeleteEmail}
            />
        );
    });
    return (<ul className="emails__list"> {emails} </ul>)
};

export default emailList;