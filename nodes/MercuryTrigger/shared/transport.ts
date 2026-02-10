import type {
	IDataObject,
	IHookFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	IWebhookFunctions,
} from 'n8n-workflow';

import { MERCURY_API_BASE_URL } from './constants';

export async function mercuryApiRequest(
	this: IHookFunctions | IWebhookFunctions,
	method: IHttpRequestMethods,
	resource: string,
	body: IDataObject | undefined = undefined,
	qs: IDataObject = {},
) {
	const options: IHttpRequestOptions = {
		method,
		url: `${MERCURY_API_BASE_URL}${resource}`,
		json: true,
		qs,
	};

	if (body !== undefined) {
		options.body = body;
	}

	const authenticationMethod = this.getNodeParameter('authentication', 0) as string;
	const credentialType =
		authenticationMethod === 'apiToken' ? 'mercuryApi' : 'mercuryOAuth2Api';

	return this.helpers.httpRequestWithAuthentication.call(this, credentialType, options);
}
