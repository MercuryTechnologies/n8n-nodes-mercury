import type {
	IDataObject,
	IHookFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	IWebhookFunctions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

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

	try {
		return await this.helpers.httpRequestWithAuthentication.call(this, 'mercuryApi', options);
	} catch (error) {
		const e = error as { message?: string; description?: string; cause?: object; body?: object };
		throw new NodeApiError(this.getNode(), error as JsonObject, {
			message: e.message ?? 'Mercury API request failed',
			description: e.description ?? JSON.stringify(e.cause ?? e.body ?? error),
		});
	}
}
