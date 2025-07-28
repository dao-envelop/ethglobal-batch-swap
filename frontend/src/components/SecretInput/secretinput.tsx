
import { useState } from "react";

type SecretInputProps = {
	onChange?   : (e: any) => void,
	inputClass? : string,
	readOnly?   : boolean,
	disabled?   : boolean,
	value       : string,
	placeholder?: string,
}

export default function SecretInput(props: SecretInputProps) {

	const [ showPassword, setShowPassword ] = useState(false);

	let clazz = `input-control ${props.inputClass || ''}`;

	return (
		<div
			className={`pin-group ${showPassword ? 'is-visible' : ''}`}
		>
			<input
				className={ clazz }
				type={ showPassword ? 'text' : 'password' }
				placeholder={ props.placeholder || '' }
				value={ props.value }
				readOnly={ props.readOnly || false }
				disabled={ props.disabled || false }
				onChange={ props.onChange }
			/>
			<button
				className="btn"
				onClick={() => {
					if ( props.disabled ) { return; }
					setShowPassword(!showPassword);
				}}
			></button>
		</div>
	)
}