
import {
	useState,
	isValidElement,
	useContext,
} from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import SecretInput     from '../../components/SecretInput';
import {
	getStrHash,
} from '@envelop/envelop-client-core';
import {
	InfoModalContext,
	InfoModalType,
	_ModalTypes
} from './infomodaldispatcher';

import i_external_green_sm from '../../static/pics/icons/i-external-green-sm.svg';
import i_copy              from '../../static/pics/icons/i-copy.svg';
import TippyWrapper from '../../components/TippyWrapper';

export default function InfoModalRenderer(props: { modal: InfoModalType | undefined }) {

	const BTN_SIZE_CLAZZ = (size: string) => {
		if ( size === 'xs' ) { return 'col-12 col-sm-1' }
		if ( size === 's'  ) { return 'col-12 col-sm-2' }
		if ( size === 'm'  ) { return 'col-12 col-sm-3' }
		if ( size === 'l'  ) { return 'col-12 col-sm-4' }
		if ( size === 'xl' ) { return 'col-12 col-sm-5' }

		return 'col-12 col-sm-4'
	}

	const [ detailsOpened, setDetailsOpened ] = useState(false);
	const [ copiedLabels,  setCopiedLabels  ] = useState<Array<string>>([]);

	const {
		unsetModal,
	} = useContext(InfoModalContext);

	const { modal } = props;

	if ( !modal ) { return null; }

	const getTitle = () => {
		if ( !modal.title ) { return null; }

		return (
			<div className="h2">
				{ modal.title }
				{
					modal.type === _ModalTypes.loading ? (
						<span className="loading-dots"><span>.</span><span>.</span><span>.</span></span>
					) : null
				}
			</div>
		)
	}
	const getText = () => {
		if ( !modal.text ) { return null; }

		if ( Array.isArray(modal.text) ) {
			return modal.text.map((item: any) => {
				return (
					<p className={ `${item.clazz}` } key={ item.text }>{ item.text }</p>
				)
			})
		}

		if ( isValidElement(modal.text) ) {
			return modal.text
		}

		return null;
	}
	const getCopyables = () => {
		if ( !modal.copyables ) { return null; }

		return modal.copyables.map((item) => {
			return (
				<div
					className="row mb-4"
					key={ getStrHash(item.content) }
				>
					{
						item.title ? (
							<div className="col-12">
								<label className="input-label">{ item.title }</label>
							</div>
						 ) : null
					}
					<div className="col-sm-10 pr-sm-0">
						{
							item.secret ? (
								<SecretInput
									inputClass="input-control control-gray"
									readOnly={ true }
									value={ item.content }
								/>
							) : (
								<input
									className="input-control control-gray"
									type="text"
									readOnly={ true }
									value={ item.content }
								/>
							)
						}
					</div>
					<div className="col-sm-2 mt-3 mt-sm-0">
						<CopyToClipboard
							text={ item.content }
							onCopy={() => {
								setCopiedLabels([
									...copiedLabels,
									item.content
								])
								setTimeout(() => {
									setCopiedLabels(copiedLabels.filter((iitem) => { return iitem !== item.content }))
								}, 5*1000);
							}}
						>
							<button className="btn btn-gray w-100">
								<img src={ i_copy } alt="" />
								{
									!!copiedLabels.find((iitem) => { return iitem === item.content }) ? (
										<span className="btn-action-info">Copied</span>
									) : null
								}
							</button>
						</CopyToClipboard>
					</div>
				</div>
			)
		})
	}
	const getLinks = () => {
		if ( !modal.links ) { return null; }

		if ( Array.isArray(modal.links) ) {
			return modal.links.map((item: any) => {
				return (
					<a
						className="ex-link ml-2"
						href={ item.url }
						target="_blank" rel="noopener noreferrer"
						key={ item.url }
					>
						{ item.text }
						<img className="i-ex" src={ i_external_green_sm } alt="" />
					</a>
				)
			})
		}

		if ( isValidElement(modal.links) ) {
			return modal.links
		}

		return null;
	}
	const getLinkGroups = () => {
		if ( modal.linkGroups ) {
			return modal.linkGroups.map((item, idx) => {
				return (
					<div className={`row row-sm ml-2 ${idx === 0 ? 'mt-3' : 'mt-2'}`}>
					{
						item.map((iitem, iidx) => {
								return (
									<a
										className={`ex-link ${ iidx !== 0 ? 'ml-2' : '' }`}
										href={ iitem.url }
										target="_blank" rel="noopener noreferrer"
										key={ iitem.url }
									>
										{ iitem.text }
										<img className="i-ex" src={ i_external_green_sm } alt="" />
									</a>
								)
							}
						)
					}
					</div>
				)
			})
		}

		return null;
	}

	const getDetails = () => {
		if ( !modal.details ) { return null; }

		return (
			<div className="details-c-wrap p-0 mt-3">
				<div
					className={ `c-wrap__toggle ${ detailsOpened ? 'active' : '' }` }
					onClick={() => {
						setDetailsOpened(!detailsOpened);
					}}
				>
					<div>More details</div>
				</div>
				<div className="c-wrap__dropdown">
					{ getDetailsContents() }
				</div>
			</div>
		)
	}
	const getDetailsContents = () => {
		if ( Array.isArray(modal.details) ) {
			return modal.details.map((item: any) => {
				return (
					<p key={ getStrHash(item) }>{ item }</p>
				)
			})
		}

		if ( isValidElement(modal.details) ) {
			return modal.details
		}

		return null;
	}

	const getButtons = () => {

		if ( modal.type === _ModalTypes.loading ) { return null; }

		if (
			!modal.buttons ||
			( Array.isArray(modal.buttons) && !modal.buttons.length )
		) {
			return (
				<div className="col-12 col-sm-5 mb-3">
					<button
						className={ `btn w-100 btn-outline`}
						onClick={() => { unsetModal() }}
					>
						{ modal.type === _ModalTypes.error ? 'Accept this fact' : 'OK' }
					</button>
				</div>
			)
		}

		if ( Array.isArray(modal.buttons) ) {
			return modal.buttons.map((item: any, idx: number) => {
				if ( isValidElement(item) ) {
					return item;
				}

				let size = 'm'
				if ( item.size ) {
					size = item.size.toLowerCase()
				} else {
					if ( idx === 0 ) { size = 'l' }
				}

				const btnBody = (
					<div
						className={ `${BTN_SIZE_CLAZZ(size)} mb-3` }
						key={ item.text }
					>
						<button
							className={ `btn w-100 ${ item.clazz || 'btn-outline' }`}
							onClick={ item.clickFunc }
						>
							{ item.text }
						</button>
					</div>
				)
				if ( item.hint ) {
					return (
						<TippyWrapper msg={ item.hint }>
							{ btnBody }
						</TippyWrapper>
					)
				} else {
					return btnBody
				}
			})
		}

		if ( isValidElement(modal.buttons) ) {
			return modal.buttons
		}

		return null;
	}

	const onlyTitle = modal.type === _ModalTypes.loading && !modal.text && !modal.copyables && !modal.links && !modal.details;

	return (
		<div className="modal">
		<div className="modal__inner">
			<div className="modal__bg"></div>

			<div className="container">
			<div className="modal__content">
			<div className={`c-info ${ onlyTitle ? 'only-title' : '' }`}>

				<div className="c-info__text">

					{ getTitle() }
					{ getText() }
					{ getCopyables() }
					{ getLinks() }
					{ getLinkGroups() }

					{ getDetails() }

					<div className="row row-sm mt-6">
						{ getButtons() }
					</div>

				</div>

			</div>
			</div>
			</div>

		</div>
		</div>
	)
}