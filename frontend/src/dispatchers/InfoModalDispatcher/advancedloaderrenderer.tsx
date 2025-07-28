
import {
	AdvancedLoaderStageType,
	AdvancedLoaderType,
	_AdvancedLoadingStatus
} from './infomodaldispatcher';

import i_loader_orange from '../../static/pics/loader-orange.svg';
import TippyWrapper from '../../components/TippyWrapper';

export default function AdvancedLoaderRenderer(props: { loader: AdvancedLoaderType | undefined }) {

	const { loader } = props;

	if ( !loader ) { return null; }

	const getStageRow = (item: AdvancedLoaderStageType) => {
		if ( item.status === _AdvancedLoadingStatus.queued ) {
			return (
				<div
					key={item.id}
					className="c-approve__step in-queue"
				>
					<div className="row">
						<div className="col-12 col-sm-auto order-2 order-sm-1">
							{
								item.current && item.total ?
								(
									<>
										<span className="current">{ item.current }</span>
										{ ' ' }
										/
										{ ' ' }
										{ item.total }
										{ ' ' }
									</>
								)
								: null
							}
							<span className="ml-2">
								{
									item.text.length < 40 ? item.text : (
										<TippyWrapper msg={ item.text } >
											<span>{ item.text.slice(0, 40) }</span>
										</TippyWrapper>
									)
								}
								<span className="dots">...</span>
							</span>
						</div>
						<div className="col-12 col-sm-auto order-1 order-sm-1"> </div>
					</div>
				</div>
			)
		}

		if ( item.status === _AdvancedLoadingStatus.loading ) {
			return (
				<div
					key={item.id}
					className="c-approve__step active"
				>
					<div className="row">
						<div className="col-12 col-sm-auto order-2 order-sm-1">
							{
								item.current && item.total ?
								(
									<>
										<span className="current">{ item.current }</span>
										{ ' ' }
										/
										{ ' ' }
										{ item.total }
										{ ' ' }
									</>
								)
								: null
							}
							<span className="ml-2">
							{
									item.text.length < 40 ? item.text : (
										<TippyWrapper msg={ item.text } >
											<span>{ item.text.slice(0, 40) }</span>
										</TippyWrapper>
									)
								}
								<span className="dots">...</span>
							</span>
						</div>
						<div className="col-12 col-sm-auto order-1 order-sm-1">
							<div className="status">
								<img className="loader" src={ i_loader_orange } alt="" />
							</div>
						</div>
					</div>
				</div>
			)
		}
		if ( item.status === _AdvancedLoadingStatus.complete ) {
			return (
				<div
					key={item.id}
					className="c-approve__step completed"
				>
					<div className="row">
						<div className="col-12 col-sm-auto order-2 order-sm-1">
							{
								item.current && item.total ?
								(
									<>
										<span className="current">{ item.current }</span>
										{ ' ' }
										/
										{ ' ' }
										{ item.total }
										{ ' ' }
									</>
								)
								: null
							}
							{
								item.text.length < 40 ? item.text : (
									<TippyWrapper msg={ item.text } >
										<span>{ item.text.slice(0, 40) }</span>
									</TippyWrapper>
								)
							}
						</div>
						<div className="col-12 col-sm-auto order-1 order-sm-1">
							<div className="status">
								<b className="text-green">Completed</b>
							</div>
						</div>
					</div>
				</div>
			)
		}
	}

	return (
		<div className="modal">
			<div className="modal__inner">
				<div className="modal__bg"></div>
				<div className="container">
				<div className="modal__content">

					<div className="modal__header">
						<div className="h2">{ loader.title }</div>
					</div>

					<div className="c-approve">
						{
							loader.stages
								.sort((item, prev) => { return (item.sortOrder || 1) - (prev.sortOrder || 1) })
								.map((item) => { return getStageRow(item) })
						}
					</div>

				</div>
				</div>
			</div>
		</div>
	)
}