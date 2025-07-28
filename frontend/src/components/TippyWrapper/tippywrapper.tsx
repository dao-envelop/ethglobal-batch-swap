import Tippy from "@tippyjs/react";
import { ReactElement } from "react";

type TippyWrapperProps = {
	msg: string,
	elClass?: string,
	children?: ReactElement
}

export default function TippyWrapper(props: TippyWrapperProps) {

	const { msg, elClass, children } = props;

	if ( !children ) {
		return (
			<Tippy
				content={ msg }
				appendTo={ document.getElementsByClassName("wrapper")[0] }
				trigger='mouseenter'
				interactive={ false }
				arrow={ false }
				maxWidth={ 512 }
			>
				<span className={`i-tip ${ elClass || '' }`}></span>
			</Tippy>
		)
	}

	return (
		<Tippy
			content={ msg }
			appendTo={ document.getElementsByClassName("wrapper")[0] }
			trigger='mouseenter'
			interactive={ false }
			arrow={ false }
			maxWidth={ 512 }
		>
			{ children }
		</Tippy>
	)
}