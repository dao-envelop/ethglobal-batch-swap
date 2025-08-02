
import React, {
	useState
} from 'react';

import icon_i_arrow_down from '../../static/pics/icons/i-arrow-down.svg';
import default_icon from '../../static/pics/coins/default.svg';
import { ERC20Type } from '../../utils/_types';

type CoinSelectorProps = {
	tokens       : Array<ERC20Type>,
	selectedToken: string,
	onChange?    : (address: string) => void,
}

export default function CoinSelector(props: CoinSelectorProps) {

	const {
		tokens,
		selectedToken,
		onChange,
	} = props;

	const [ listOpened, setListOpened ] = useState(false);

	const selectorBlockRef = React.createRef<HTMLDivElement>();

	const   setZIndex = () => { if ( selectorBlockRef.current ) { selectorBlockRef.current.style.zIndex = '2'; } }
	const resetZIndex = () => { if ( selectorBlockRef.current ) { selectorBlockRef.current.style.zIndex = ''; } }

	const closeList = () => {
		setTimeout(() => {
			resetZIndex();
			const body = document.querySelector('body');
			if ( !body ) { return; }
			body.onclick = null;
			setListOpened(false);
		}, 100);
	}
	const openList = () => {

		if ( !onChange ) { return; }

		setTimeout(() => {
			const body = document.querySelector('body');
			if ( !body ) { return; }
			body.onclick = (e: any) => {
				if ( !selectorBlockRef.current ) { return; }
				const _path = e.composedPath() || e.path;
				if ( _path && _path.includes(selectorBlockRef.current) ) { return; }
				closeList();
			};
		}, 100);
		setListOpened(true);
	}

	let selectedTokenObj;
	if ( selectedToken === '' ) {
		selectedTokenObj = {
			address: '',
			icon: default_icon,
			symbol: '',
		}
	}

	const foundToken = tokens.filter((item) => {
		if ( !item.contractAddress ) { return false; }
		return item.contractAddress.toLowerCase() === selectedToken.toLowerCase()
	});
	if ( foundToken.length ) {
		selectedTokenObj = foundToken[0];
	} else {
		selectedTokenObj = {
			address: '',
			icon: default_icon,
			symbol: '',
		}
	}

	return (
		<div
			className="select-coin"
			ref={ selectorBlockRef }
			onMouseEnter={ setZIndex }
			onMouseLeave={ closeList }
		>

			<div
				className="select-coin__value"
				onMouseEnter={ openList }
				onClick={ openList }
			>

				<span className="field-unit">
					<span className="i-coin"><img src={ selectedTokenObj.icon } alt="" /></span>
					{ selectedTokenObj.symbol }
				</span>
				{ onChange ? ( <img className="arrow" src={ icon_i_arrow_down } alt="" /> ) : null }
			</div>

			{
				listOpened ?
				(
					<ul className="select-coin__list">
					{
						tokens
						.sort((item, prev) => {
							return item.contractAddress.toLowerCase().localeCompare(prev.contractAddress.toLowerCase())
						})
						.map((item) => {
							return (
								<li
									key={ item.contractAddress }
									onClick={() => { if (onChange ) { onChange(item.contractAddress) } }}
								>
									<span className="field-unit">
										<span className="i-coin"><img src={ item.icon } alt="" />
									</span>
									{ item.symbol }
									</span>
								</li>
							)
						})
					}
				</ul> ) : null
			}

		</div>
	)
}