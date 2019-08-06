import React from 'react';
import ReactDOM from 'react-dom';
import {productName, version, scratchVersion} from '../../package.json';

import logo from '../icon/ScratchDesktop.svg';

// TODO: localization?
const AboutElement = () => (
    <div
        style={{
            color: 'white',
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
            textAlign: 'center',
            fontWeight: 'bolder',
            margin: 0,
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
        }}
    >
        <div><img
            alt={`${productName} icon`}
            src={logo}
            style={{
                maxWidth: '10rem',
                maxHeight: '10rem'
            }}
        /></div>
        <h2>{productName} {version}</h2>
        <div>Scratch Desktop {scratchVersion}</div>
        <table style={{fontSize: 'x-small'}}>
            {
                ['Electron', 'Chrome'].map(component => {
                    const componentVersion = process.versions[component.toLowerCase()];
                    return <tr key={component}><td>{component}</td><td>{componentVersion}</td></tr>;
                })
            }
        </table>
    </div>
);

const appTarget = document.getElementById('app');
ReactDOM.render(<AboutElement />, appTarget);
