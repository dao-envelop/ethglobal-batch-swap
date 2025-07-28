
import React, {
	useContext,
	useEffect,
	useState
}  from 'react';

import {
	compactString,
} from '@envelop/envelop-client-core';

import { CopyToClipboard } from 'react-copy-to-clipboard';
import Blockies            from 'react-blockies';

import {
	InfoModalContext,
	Web3Context,
	_ModalTypes,
} from '../../dispatchers';

import TippyWrapper        from '../TippyWrapper';

import config from '../../app.config.json';

import default_icon         from '@envelop/envelop-client-core/static/pics/networks/_default.png';
import icon_logo            from '../../static/pics/logo.svg';
import icon_logo_mob        from '../../static/pics/logo-mob.svg';
import icon_i_copy          from '../../static/pics/icons/i-copy.svg';
import icon_i_del           from '../../static/pics/i-del.svg';
import icon_i_attention     from '../../static/pics/icons/i-warning.svg';

export default function Header() {

	const CHAIN_SORT_ORDER = [
		42161,
		56,
		81457,
		1,
		10,
		137,
		1313161554,
		66,
		534352,
		324
	];

	const chainMenuBlockRef      = React.createRef<HTMLDivElement>();
	const userMenuBlockRef       = React.createRef<HTMLDivElement>();

	const [ copiedHint          , setCopiedHint           ] = useState(false);
	const [ chainMenuOpened     , setChainMenuOpened      ] = useState(false);
	const [ userMenuOpened      , setUserMenuOpened       ] = useState(false);
	const [ cursorOnUserMenuBtn , setCursorOnUserMenuBtn  ] = useState(false);
	const [ cursorOnUserMenuList, setCursorOnUserMenuList ] = useState(false);

	const {
		getWeb3Force,
		currentChainId,
		walletChainId,
		userAddress,
		availableChains,
		switchChain,
		disconnect,
	} = useContext(Web3Context);
	const {
		setModal,
	} = useContext(InfoModalContext);

	const getLogo = () =>  {
		return (
			<React.Fragment>
				<a
					href="/"
					className="s-header__logo d-none d-sm-block"
				>
					Batch Swap
				</a>
				<a
					href="/"
					className="s-header__logo mob d-sm-none"
				>
					Batch Swap
				</a>
			</React.Fragment>
		)
	}

	const closeChainMenu = () => {
		const body = document.querySelector('body');
		if ( !body ) { return; }
		body.onclick = null;
		setChainMenuOpened(false);
	}
	const openChainMenu = () => {
		setTimeout(() => {
			const body = document.querySelector('body');
			if ( !body ) { return; }
			body.onclick = (e: any) => {
				if ( !chainMenuBlockRef.current ) { return; }
				const _path = e.composedPath() || e.path;
				if ( _path && _path.includes(chainMenuBlockRef.current) ) { return; }
				closeChainMenu();
			};
		}, 100);
		setChainMenuOpened(true);
	}
	const getChainSelectorDropdown = () =>  {
		if ( !chainMenuOpened ) { return null; }

		const mainnets = availableChains.filter((item) => { return !item.isTestNetwork });
		const testnets = availableChains.filter((item) => { return  item.isTestNetwork });

		return (
			<div className="btn-dropdown s-header__network-dropdown">
				<div className="dropdown-wrap">
					<div className="dropdown-header">
						<b>Select network</b>
						<div
							className="close"
							onClick={() => { setChainMenuOpened(false); }}
						>
							<img src={ icon_i_del } alt="" />
						</div>
					</div>
					<div className="scroll">
						<ul>
							{
								mainnets
									.sort((item, prev) => {
										if (
											CHAIN_SORT_ORDER.includes(item.chainId) &&
											CHAIN_SORT_ORDER.includes(prev.chainId)
										) {
											return CHAIN_SORT_ORDER.indexOf(item.chainId) - CHAIN_SORT_ORDER.indexOf(prev.chainId)
										}
										if (
											CHAIN_SORT_ORDER.includes(item.chainId)
										) {
											return -1
										}
										if (
											CHAIN_SORT_ORDER.includes(prev.chainId)
										) {
											return 1;
										}

										return item.chainId - prev.chainId
									})
									.map((item) => {
										return (
											<li
												key={item.chainId}
												onClick={() => {
													switchChain(item.chainId).catch((e: any) => {
														setModal({
															type: _ModalTypes.error,
															title: 'Cannot change network',
															details: [
																e.message || e
															]
														})
													});
													closeChainMenu();
												}}
											>
												<button className="item">
													<span className="logo">
														<img src={ item.networkIcon } alt="" />
													</span>
													<span className="name">{ item.name }</span>
												</button>
											</li>
										)
									})
							}
						</ul>
						<ul>
							{
								testnets
									.sort((item, prev) => {
										if (
											CHAIN_SORT_ORDER.includes(item.chainId) &&
											CHAIN_SORT_ORDER.includes(prev.chainId)
										) {
											return CHAIN_SORT_ORDER.indexOf(item.chainId) - CHAIN_SORT_ORDER.indexOf(prev.chainId)
										}
										if (
											CHAIN_SORT_ORDER.includes(item.chainId)
										) {
											return -1
										}
										if (
											CHAIN_SORT_ORDER.includes(prev.chainId)
										) {
											return 1;
										}

										return item.chainId - prev.chainId
									})
									.map((item) => {
										return (
											<li
												key={item.chainId}
												onClick={() => {
													switchChain(item.chainId).catch((e: any) => {
														setModal({
															type: _ModalTypes.error,
															title: 'Cannot change network',
															details: [
																e.message || e
															]
														})
													});
													closeChainMenu();
												}}
											>
												<button className="item">
													<span className="logo">
														<img src={ item.networkIcon } alt="" />
													</span>
													<span className="name">{ item.name } Testnet</span>
												</button>
											</li>
										)
									})
							}
						</ul>
					</div>
				</div>
			</div>
		)
	}
	const getChainSelector = () =>  {

		if ( !walletChainId ) { return null; }
		const chainData = availableChains.find((item) => { return item.chainId === walletChainId });
		if ( !chainData ) { return null; }

		return (
			<>
			{
				currentChainId !== walletChainId ? (
					<TippyWrapper msg='Chain in wallet does not match the one is using on page'>
						<div style={{ marginRight: '30px' }}><img src={ icon_i_attention } alt="" /></div>
					</TippyWrapper>
				) : null
			}
			<div
				className={`s-header__network`}
				ref={ chainMenuBlockRef }
				onMouseLeave={ closeChainMenu }
			>
				<button
					className={ `btn btn-sm btn-gray s-header__network-btn ${ chainMenuOpened ? 'active' : '' }`}
					onClick={ openChainMenu }
					onMouseEnter={ openChainMenu }
				>
					<span className="logo">
						<img src={ chainData.networkIcon || default_icon } alt="" />
					</span>
					<span className="name">{ `${chainData.name} ${chainData.isTestNetwork ? 'Testnet' : ''}` }</span>
					<svg className="arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M4.94 5.72667L8 8.78L11.06 5.72667L12 6.66667L8 10.6667L4 6.66667L4.94 5.72667Z" fill="white"></path>
					</svg>
				</button>

				{ getChainSelectorDropdown() }
			</div>
			</>
		)
	}
	const getConnectBtn = () => {
		return (
			<button
				className="btn btn-connect"
				onClick={async (e) => {
					try { await getWeb3Force(); } catch(e: any) { console.log('Cannot connect', e); }
				}}
			>
				Connect
				<span className="d-none d-md-inline">&nbsp;Wallet</span>
			</button>
		)
	}

	useEffect(() => {
		if ( !userMenuOpened && ( cursorOnUserMenuBtn || cursorOnUserMenuList)  ) { openUserMenu();  }
		if ( userMenuOpened && ( !cursorOnUserMenuBtn && !cursorOnUserMenuList) ) { closeUserMenu(); }
	}, [ cursorOnUserMenuBtn, cursorOnUserMenuList ])
	const closeUserMenu = () => {
		const body = document.querySelector('body');
		if ( !body ) { return; }
		body.onclick = null;
		setUserMenuOpened(false);
	}
	const openUserMenu = () => {
		const body = document.querySelector('body');
		if ( !body ) { return; }
		body.onclick = (e: any) => {
			if ( !userMenuBlockRef.current ) { return; }
			const _path = e.composedPath() || e.path;
			if ( _path && _path.includes(userMenuBlockRef.current) ) { return; }
			closeUserMenu();
		};
		setUserMenuOpened(true);
	}
	const getUserMenu = () =>  {
		if ( !userMenuOpened ) { return; }

		return (
			<div
				className="s-user__menu"
				onMouseEnter={ () => { setCursorOnUserMenuList(true);  }}
				onMouseLeave={ () => { setCursorOnUserMenuList(false); }}
			>
				<ul className="inner">
					<li className="d-md-none">
						<div className="item address">
							<button className="btn-copy">
								<span>{ userAddress ? compactString(userAddress) : '' }</span>
								<img src={ icon_i_copy } alt="" />
								<span className="btn-action-info" style={{ display: copiedHint ? 'block' : 'none' }}>Copied</span>
							</button>
						</div>
					</li>
					<li><a href="/dashboard" className="item">Dashboard</a></li>
					<li className="mt-md-2">
						<button
							onClick={(e) => {
								disconnect();
							}}
							className="item disconnect"
						>Disconnect</button>
					</li>
				</ul>
			</div>
		)
	}
	const getAvatarBlock = () => {
		if ( !userAddress ) { return null; }
		return (
			<div className="s-user__avatar">
				<div className="img">
					<Blockies
						seed      = { userAddress }
						size      = {5}
						scale     = {8}
						color     = "#141616"
						bgColor   = "#7FC7FF"
						spotColor = "#ffffff"
					/>
				</div>
			</div>
		)
	}
	const getUserData = () =>  {
		if ( !userAddress ) { return null; }
		return (
			<React.Fragment>

				<div
					className="s-user"
					ref={ userMenuBlockRef }
					onClick={() => {
						if ( userMenuOpened ) {
							closeUserMenu();
						} else {
							openUserMenu();
						}
					}}
					onMouseEnter={ () => { setCursorOnUserMenuBtn(true);  }}
					onMouseLeave={ () => { setTimeout(() => { setCursorOnUserMenuBtn(false); }, 100) }}
				>
					<div className="s-user__toggle">
						{ getAvatarBlock() }
						<div className="s-user__data">
							<span className="mr-2">{ compactString(userAddress) }</span>
							<svg className="arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M4.94 5.72667L8 8.78L11.06 5.72667L12 6.66667L8 10.6667L4 6.66667L4.94 5.72667Z" fill="white" fillOpacity="0.6"></path>
							</svg>
						</div>
					</div>
					<CopyToClipboard
						text={ userAddress }
						onCopy={() => {
							setCopiedHint(true);
							setTimeout(() => { setCopiedHint(false); }, 5*1000);
						}}
					>
						<button className="btn-copy">
							<img src={ icon_i_copy } alt="" />
							<span className="btn-action-info" style={{ display: copiedHint ? 'block' : 'none' }}>Copied</span>
						</button>
					</CopyToClipboard>
				</div>
				{ getUserMenu() }
			</React.Fragment>
		)
	}
	const getBtnOrData = () =>  {
		if ( userAddress === undefined ) {
			return getConnectBtn()
		} else {
			return getUserData()
		}
	}

	return (
		<header className="s-header">
			<div className="container-fluid">
				<div className="d-flex align-items-center h-100">
					{ getLogo() }
				</div>

				<div className="d-flex align-items-center">
					{ getChainSelector() }
					{ getBtnOrData() }
				</div>
			</div>
		</header>
	)
}