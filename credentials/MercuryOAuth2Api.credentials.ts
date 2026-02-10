import type { Icon, ICredentialType, INodeProperties } from 'n8n-workflow';

export class MercuryOAuth2Api implements ICredentialType {
	name = 'mercuryOAuth2Api';

	extends = ['oAuth2Api'];

	displayName = 'Mercury OAuth2 API';

	icon: Icon = 'file:../icons/mercury.svg';

	documentationUrl = 'https://docs.mercury.com/reference/oauth';

	properties: INodeProperties[] = [
		{
			displayName: 'Grant Type',
			name: 'grantType',
			type: 'hidden',
			default: 'authorizationCode',
		},
		{
			displayName: 'Authorization URL',
			name: 'authUrl',
			type: 'hidden',
			default: 'https://oauth2.mercury.com/oauth2/auth',
			required: true,
		},
		{
			displayName: 'Access Token URL',
			name: 'accessTokenUrl',
			type: 'hidden',
			default: 'https://oauth2.mercury.com/oauth2/token',
			required: true,
		},
		{
			displayName: 'Scope',
			name: 'scope',
			type: 'hidden',
			default: 'offline_access read webhooks:create webhooks:edit',
		},
		{
			displayName: 'Auth URI Query Parameters',
			name: 'authQueryParameters',
			type: 'hidden',
			default: '',
		},
		{
			displayName: 'Authentication',
			name: 'authentication',
			type: 'hidden',
			default: 'header',
		},
	];
}
