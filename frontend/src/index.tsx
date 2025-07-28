import React from 'react';
import App from './components/App';
import 'tippy.js/dist/tippy.css';
import './static/css/styles.min.css';

import { BrowserRouter } from 'react-router-dom';

import { createRoot } from 'react-dom/client';
import {
	ERC20Dispatcher,
	InfoModalDispatcher,
	Web3Dispatcher
} from './dispatchers';
import { CurrencyRateDispatcher } from './dispatchers/CurrencyRateDispatcher';

console.log(`Envelop SDK v${require("@envelop/envelop-client-core/package.json").version}`);

const container = document.getElementById('root');
const root = createRoot(container!); // createRoot(container!) if you use TypeScript
root.render(
	<React.StrictMode>
		<BrowserRouter basename={process.env.PUBLIC_URL}>
			<InfoModalDispatcher>
			<Web3Dispatcher>
			<ERC20Dispatcher>
			<CurrencyRateDispatcher>
				<App />
			</CurrencyRateDispatcher>
			</ERC20Dispatcher>
			</Web3Dispatcher>
			</InfoModalDispatcher>
		</BrowserRouter>
	</React.StrictMode>,
);