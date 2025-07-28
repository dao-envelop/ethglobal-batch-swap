
export const getCurrentEnvironment = () => {

	const envs = [
		'stage',
		'alpha',
		'beta',
		'prod',
	];

	const domain = window.location.hostname.toLowerCase();

	const foundEnv = envs.find((item) => { return domain.includes( item.toLowerCase()) });
	if ( foundEnv ) { return foundEnv; }

	return 'prod';

}