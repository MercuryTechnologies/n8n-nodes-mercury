import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class MercuryApi implements ICredentialType {
	name = 'mercuryApi';

	displayName = 'Mercury API';

	icon: Icon = 'file:../icons/mercury.svg';

	documentationUrl = 'https://docs.mercury.com/reference/authentication';

	properties: INodeProperties[] = [
		{
			displayName: 'API Token',
			name: 'apiToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials?.apiToken}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.mercury.com/api/v1',
			url: '/accounts',
			method: 'GET',
		},
	};
}
