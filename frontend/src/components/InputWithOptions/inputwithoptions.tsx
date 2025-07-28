
import {
	useRef,
	useState
} from 'react';

type InputWithOptionsProps = {
	id?: string,
	onChange?    : (e: any) => void,
	onKeyPress?  : (e: any) => void,
	onSelect?    : (e: any) => void,
	inputClass?  : string,
	blockClass?  : string,
	readonly?    : boolean,
	disabled?    : boolean,
	value        : string,
	placeholder? : string,
	options?     : Array<{
		label: string,
		value: string,
		description?: string,
		badge?: string,
	}>,
	allowType?: boolean,
	showArrow?: boolean
}

export default function InputWithOptions(props: InputWithOptionsProps) {

	const listBlockRef = useRef(null);

	const [ listOpened, setListOpened ] = useState(false);

	const getOptions = () => {
		if ( !props.options || !props.onSelect || !props.options.length ) { return null; }
		if ( !listOpened ) { return null; }

		return (
			<ul className="options-list">
				{
					props.options.map((item) => {
						return (
							<li
								key={ item.value }
								className="option"
								onClick={() => {
									if ( props.onSelect ) {
										props.onSelect(item);
										setListOpened(false);
									}
								}}
							>
								<div className="option-token">
									<span>{ item.label }</span>
									{
										item.description ? (
											<span className="description">{ item.description }</span>
										) : null
									}
									{
										item.badge ? (
											<span className="badge badge-green mr-0 ml-auto">{ item.badge }</span>
										) : null
									}
								</div>
							</li>
						)
					})
				}
			</ul>
		)
	}

	const getInputClazz = () => { return `input-control ${ !props.showArrow ? 'no-arrow' : '' } ${ props.inputClass || ''} ${ listOpened ? 'active' : '' } ${ props.disabled ? 'disabled' : '' }` }
	const getBlockClazz = () => { return `select-custom select-token` }

	const getLabel = () => {
		let label = props.value;
		const foundOption = props.options?.find((item) => { return item.value === props.value });
		if ( foundOption ) {
			label = foundOption.label;
		}

		return label;
	}

	return (
		<div
			className={ getBlockClazz() }
			ref={ listBlockRef }
			id={ props.id }
			key={ props.id }
		>
			<input
				style={{ caretColor: `${ props.onChange ? '' : 'transparent' }` }}
				className   = { getInputClazz() }
				type        = "text"
				placeholder = { props.placeholder || '' }
				value       = { getLabel() }
				readOnly    = { props.readonly    || false }
				disabled    = { props.disabled    || false }
				onChange    = { (e) => {
					e.preventDefault();
					if ( !props.onChange ) { return; }
					props.onChange(e);
				}}
				onKeyPress  = { props.onKeyPress }
				onFocus     = { () => {
					if ( !props.options || !props.onSelect || !props.options.length ) { return; }
					setListOpened(true);
				}}
				onBlur      = { () => {
					setTimeout(() => { setListOpened(false); }, 150);
				}}
			/>
			{ getOptions() }
		</div>
	)

}