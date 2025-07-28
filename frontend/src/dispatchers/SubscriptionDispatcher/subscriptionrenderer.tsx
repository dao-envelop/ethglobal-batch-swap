
import React, {
	useContext,
	useState
} from 'react';

import {
	BigNumber,
	unixtimeDiffToDays,
} from '@envelop/envelop-client-core';
import { SubscriptionContext } from './subscriptiondispatcher';
import SubscriptionPopup from './subscriptionpopup';

type SubscriptionRendererProps = {
	className?: string,
	btnClassName?: string,
}

export default function SubscriptionRenderer(props: SubscriptionRendererProps) {

	const {
		className,
		btnClassName,
	} = props;

	const [ subscriptionPopupOpened, setSubscriptionPopupOpened ] = useState(false);

	const {
		subscriptionRemainings,
		TX_names,
		subscriptionServiceExist,
	} = useContext(SubscriptionContext);

	const getSubscriptionBlock = () => {

		if ( !subscriptionServiceExist ) { return null; }

		if ( subscriptionRemainings === undefined ) {
			return (
				<div className={`bw-subscib ${ className || '' }`}>
					<div className="d-inline-block mr-2 my-3">To use service you need to </div>
					<button
						className={`btn btn-outline ${ btnClassName || '' }`}
						onClick={() => {
							setSubscriptionPopupOpened(true);
						}}
					>Subscribe</button>
				</div>
			)
		}

		if ( parseInt(`${subscriptionRemainings.countsLeft}`) !== 0 ) {
			return (
				<div className={`bw-subscib ${ className || '' }`}>
					You have <span className="days">{ subscriptionRemainings.countsLeft.toString() } { subscriptionRemainings.countsLeft.eq(1) ? TX_names.singular : TX_names.plural }</span> left
					<button
						className="btn btn-outline ml-3"
						onClick={() => {
							setSubscriptionPopupOpened(true);
						}}
					>+ Subscription</button>
				</div>
			)
		}

		const now = new BigNumber(new Date().getTime()).dividedBy(1000);
		const diff = subscriptionRemainings.validUntil.minus(now);

		return (
			<div className={`bw-subscib  ${ className || '' }`}>
				Your subscription expires in <span className="days">{ unixtimeDiffToDays(diff) }</span>
				<button
					className="btn btn-outline ml-3"
					onClick={() => {
						setSubscriptionPopupOpened(true);
					}}
				>+ Subscription</button>
			</div>
		)
	}

	return (
		<React.Fragment>
		{ getSubscriptionBlock() }
		{
			subscriptionPopupOpened ? (
				<SubscriptionPopup
					closePopup={() => { setSubscriptionPopupOpened(false); }}
				/>
			) : null
		}
		</React.Fragment>
	)
}