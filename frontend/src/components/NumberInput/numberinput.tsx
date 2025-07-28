
import BigNumber from 'bignumber.js';
BigNumber.config({ DECIMAL_PLACES: 50, EXPONENTIAL_AT: 100});

type NumberInputProps = {
	value        : number | undefined,
	min?         : number,
	max?         : number,
	increment?   : number,
	onChange     : (e: number | undefined) => void,
	inputClass?  : string,
	blockClass?  : string,
	disabled?    : boolean,
	placeholder? : string,
}

export default function NumberInput(props: NumberInputProps) {

	return (
		<div className={`number-group ${props.blockClass || ''}`}>
			<input
				className={`input-control ${ props.inputClass || '' }`}
				type="text"
				value={ props.value !== undefined ? props.value : '' }
				onChange={(e) => {
					const rawValue = e.target.value.toLowerCase().replace(/[^0-9x]/g, "");
					if ( rawValue === '' ) { props.onChange(undefined); return; }

					const value = parseInt(rawValue);

					if ( isNaN(value) ) {
						props.onChange(0);
						return;
					}

					props.onChange(value);
				}}
				placeholder={ props.placeholder || '' }
			/>
			<button
				className="qty-plus"
				disabled={ props.value === props.max }
				onClick={() => {
					if ( props.value === undefined ) { props.onChange(props.min || 1); return; }

					const inc = props.increment || 1;

					if ( !props.max ) { props.onChange(props.value + inc); return; }

					const newValue = props.value + inc;
					if ( newValue > props.max ) { props.onChange(props.value); return; }
					props.onChange(newValue);
				}}
			>
				<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M14.6666 10.7287L7.99992 3.66992L1.33325 10.7287" stroke="white"></path>
				</svg>
			</button>
			<button
				className="qty-minus"
				disabled={ props.value === props.min }
				onClick={() => {
					if ( props.value === undefined ) { props.onChange(props.max || 1); return; }

					const inc = props.increment || 1;
					if ( !props.min ) { props.onChange(props.value - inc); return; }

					const newValue = props.value - inc;
					if ( newValue < props.min ) { props.onChange(props.value); return; }
					props.onChange(newValue);
				}}
			>
				<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M1.33325 5.3335L7.99992 12.3923L14.6666 5.3335" stroke="white"></path>
				</svg>
			</button>
		</div>
	)
}