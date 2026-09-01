import * as React from 'react';
import { render } from 'react-dom';
import { Analytics } from '@vercel/analytics/react';

require('focus-visible');

import App from './views/app';

const props = (window as any).initialState || {};

render(
    <>
        <App {...props}/>
        <Analytics />
    </>,
    document.getElementById('webhint-root')
);
