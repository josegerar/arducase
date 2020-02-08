import React from 'react';

import './Modal.css';

const modal = props => (
    <div className="modall">
        <header className="modal__header">
            <h1>{props.title}</h1>
        </header>
        <section className="modal__content">
            {props.children}
        </section>
        {
            props.title === "Options" && (
                <section className="modal__actionsVertical">
                    {
                        props.canConfirm && <button onClick={props.onConfirm}>{props.confirmText}</button>
                    }
                    {
                        props.canDownload && <button onClick={props.onDownload}>Download Image</button>
                    }
                    {
                        props.canExit && <button className="btn-exit" onClick={props.onExit}>Exit</button>
                    }
                    {
                        props.canCancel && (
                            <div className="div-goBack">
                                <button onClick={props.onCancel}>Go Back</button>
                            </div>
                        )
                    }
                </section>
            )
        }
        {
            props.title !== "Options" && (
                <section className="modal__actions">
                    {props.canCancel && <button className="btn-cancel" onClick={props.onCancel}>Cancel</button>}
                    {props.canConfirm && <button onClick={props.onConfirm}>{props.confirmText}</button>}
                </section>
            )
        }
    </div>
);

export default modal;