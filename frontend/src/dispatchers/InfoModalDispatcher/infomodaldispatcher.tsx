
import React, {
	ReactNode,
	useState
} from "react";
import AdvancedLoaderRenderer from "./advancedloaderrenderer";
import InfoModalRenderer from "./infomodalrenderer";

export enum _AdvancedLoadingStatus {
	queued,
	loading,
	complete,
};
export type AdvancedLoaderType = {
	title: string,
	stages: Array<AdvancedLoaderStageType>
};
export type AdvancedLoaderStageType = {
	id: string,
	sortOrder?: number,
	current?: number,
	total?: number,
	text: string,
	status: _AdvancedLoadingStatus
};

export enum _ModalTypes {
	loading,
	info,
	error,
	success,
}

export type InfoModalType = {
	type    : _ModalTypes,
	title?  : ReactNode | string,
	text?   : ReactNode | Array<{
		text: string,
		clazz?: string, // text-bold | text-green | text-orange
	}>,
	icon?   : string,
	buttons?: ReactNode | Array<{
		text: string | ReactNode,
		clickFunc: Function,
		clazz?: string, // btn-grad | btn-outline
		size?: string,
		hint?: string,
	} | ReactNode>,
	links?  : ReactNode | Array<{
		text: string,
		url : string,
	}>,
	linkGroups? : Array<Array<{
		text: string,
		url : string,
	}>>,
	details? : ReactNode | Array<string>,
	copyables? : Array<{
		content: string,
		title?: string,
		secret?: boolean,
	}>,
}

export type InfoModalContextType = {
	setLoading: (title: string, text?: Array<string>) => void,
	setError  : (title: string, text?: Array<string>) => void,
	setInfo   : (title: string, text?: Array<string>) => void,
	setSuccess: (title: string, text?: Array<string>) => void,
	setModal  : (modal: InfoModalType) => void,
	createAdvancedLoader: (loader: AdvancedLoaderType) => void,
	updateStepAdvancedLoader: (stage: Partial<AdvancedLoaderStageType>) => void,
	unsetModal: () => void,
}

export const InfoModalContext = React.createContext<InfoModalContextType>({
	setLoading: () => {},
	setError  : () => {},
	setInfo   : () => {},
	setSuccess: () => {},
	setModal  : () => {},
	createAdvancedLoader: () => {},
	updateStepAdvancedLoader: () => {},
	unsetModal: () => {},
});

export function InfoModalDispatcher(props: { children: ReactNode }) {

	const [ modal, _setModal ] = useState<InfoModalType | undefined>(undefined);
	const [ advancedLoader, _setAdvancedLoader ] = useState<AdvancedLoaderType | undefined>(undefined);

	const setLoading = (title: string, text?: Array<string>) => {
		_setModal({
			type: _ModalTypes.loading,
			title,
			text: text?.map((item) => { return { text: item } }),
		})
	}
	const setError = (title: string, text?: Array<string>) => {
		_setModal({
			type: _ModalTypes.error,
			title,
			text: text?.map((item) => { return { text: item } }),
		})
	}
	const setInfo = (title: string, text?: Array<string>) => {
		setModal({
			type: _ModalTypes.info,
			title,
			text: text?.map((item) => { return { text: item } }),
		})
	}
	const setSuccess = (title: string, text?: Array<string>) => {
		setModal({
			type: _ModalTypes.success,
			title,
			text: text?.map((item) => { return { text: item } }),
		})
	}
	const setModal = (modal: InfoModalType) => {
		_setAdvancedLoader(undefined);
		_setModal(modal);
	}

	const createAdvancedLoader = (loader: AdvancedLoaderType) => {
		_setAdvancedLoader(loader);
	}
	const updateStepAdvancedLoader = (stage: Partial<AdvancedLoaderStageType>) => {
		_setAdvancedLoader((prevState) => {
			if ( !prevState ) { return; }
			if ( !stage.id ) { return; }
			const foundStage = prevState.stages.find((item) => { return item.id === stage.id });

			return {
				...prevState,
				stages: [
					...prevState.stages.filter((item) => { return item.id !== stage.id }),
					{
						id: stage.id,
						sortOrder: stage.sortOrder || foundStage?.sortOrder,
						current: stage.current || foundStage?.current,
						total: stage.total || foundStage?.total,
						text: stage.text || foundStage?.text || `Step: ${stage.id}`,
						status: stage.status || foundStage?.status || _AdvancedLoadingStatus.loading,
					}
				]
			}
		})
	}

	const unsetModal = () => { _setModal(undefined); _setAdvancedLoader(undefined); }

	return (
		<InfoModalContext.Provider value={{
			setLoading,
			setError,
			setInfo,
			setSuccess,
			setModal,
			unsetModal,
			createAdvancedLoader,
			updateStepAdvancedLoader,
		}}>
			{ props.children }
			<AdvancedLoaderRenderer loader={ advancedLoader } />
			<InfoModalRenderer modal={ modal } />
		</InfoModalContext.Provider>
	);
  };