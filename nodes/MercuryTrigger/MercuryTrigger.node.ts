import { createHmac, timingSafeEqual } from 'crypto';
import type {
	IDataObject,
	IHookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';

import { mercuryApiRequest } from './shared/transport';
import {
	TRIGGER_FILTER_PATHS,
	TRIGGER_RESOURCE_ENDPOINT,
	TRIGGER_STATUS_FILTER,
	TRIGGER_TO_EVENTS,
	type TriggerType,
} from './shared/constants';

export class MercuryTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Mercury Trigger',
		name: 'mercuryTrigger',
		icon: 'file:../../icons/mercury.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["triggerType"]}}',
		description: 'Starts the workflow when Mercury events occur',
		defaults: {
			name: 'Mercury Trigger',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'mercuryApi',
				required: true,
				displayOptions: {
					show: {
						authentication: ['apiToken'],
					},
				},
			},
			{
				name: 'mercuryOAuth2Api',
				required: true,
				displayOptions: {
					show: {
						authentication: ['oAuth2'],
					},
				},
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Authentication',
				name: 'authentication',
				type: 'options',
				options: [
					{
						name: 'API Token',
						value: 'apiToken',
					},
					{
						name: 'OAuth2',
						value: 'oAuth2',
					},
				],
				default: 'oAuth2',
			},
			{
				displayName: 'Trigger Type',
				name: 'triggerType',
				type: 'options',
				required: true,
				default: 'newTransaction',
				options: [
					{
						name: 'Account Balance Update',
						value: 'accountBalanceUpdate',
						description:
							'Triggers when a checking or savings account balance changes',
					},
					{
						name: 'Cancelled Transaction',
						value: 'cancelledTransaction',
						description: 'Triggers when a transaction status changes to cancelled',
					},
					{
						name: 'Failed Transaction',
						value: 'failedTransaction',
						description: 'Triggers when a transaction status changes to failed',
					},
					{
						name: 'New Transaction',
						value: 'newTransaction',
						description: 'Triggers when a new transaction is created',
					},
					{
						name: 'Settled Transaction',
						value: 'settledTransaction',
						description: 'Triggers when a transaction status changes to settled',
					},
					{
						name: 'Transaction Update',
						value: 'transactionUpdate',
						description: 'Triggers on any transaction update',
					},
				],
			},
		],
		usableAsTool: true,
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const staticData = this.getWorkflowStaticData('node');
				return staticData.webhookId !== undefined;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default');
				const triggerType = this.getNodeParameter('triggerType') as TriggerType;

				const eventTypes = TRIGGER_TO_EVENTS[triggerType];
				const filterPaths = TRIGGER_FILTER_PATHS[triggerType];

				const body: IDataObject = {
					url: webhookUrl,
					eventTypes,
				};

				if (filterPaths) {
					body.filterPaths = filterPaths;
				}

				const response = await mercuryApiRequest.call(this, 'POST', '/webhooks', body);

				const staticData = this.getWorkflowStaticData('node');
				staticData.webhookId = response.id;
				staticData.secret = response.secret;

				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const staticData = this.getWorkflowStaticData('node');
				const webhookId = staticData.webhookId as string;

				if (webhookId) {
					try {
						await mercuryApiRequest.call(this, 'DELETE', `/webhooks/${webhookId}`);
					} catch {
						return false;
					}
				}

				delete staticData.webhookId;
				delete staticData.secret;

				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const body = this.getBodyData() as IDataObject;
		const headers = this.getHeaderData();
		const staticData = this.getWorkflowStaticData('node');
		const secret = staticData.secret as string;

		// Verify HMAC-SHA256 signature
		const signatureHeader = headers['mercury-signature'] as string | undefined;
		if (!signatureHeader || !secret) {
			return { webhookResponse: 'Signature missing', workflowData: undefined };
		}

		const parts = signatureHeader.split(',');
		const timestamp = parts.find((p) => p.startsWith('t='))?.slice(2);
		const signature = parts.find((p) => p.startsWith('v1='))?.slice(3);

		if (!timestamp || !signature) {
			return { webhookResponse: 'Invalid signature format', workflowData: undefined };
		}

		// Reject webhooks older than 5 minutes to prevent replay attacks
		const age = Math.abs(Date.now() / 1000 - Number(timestamp));
		if (age > 300) {
			return { webhookResponse: 'Timestamp too old', workflowData: undefined };
		}

		const req = this.getRequestObject();
		const rawBody = req.rawBody ?? Buffer.from(JSON.stringify(body));
		const signedPayload = `${timestamp}.${rawBody.toString()}`;
		const expectedSignature = createHmac('sha256', secret)
			.update(signedPayload)
			.digest('hex');

		const sigBuffer = Buffer.from(signature, 'hex');
		const expectedBuffer = Buffer.from(expectedSignature, 'hex');

		if (sigBuffer.length !== expectedBuffer.length || !timingSafeEqual(sigBuffer, expectedBuffer)) {
			return { webhookResponse: 'Invalid signature', workflowData: undefined };
		}

		// For status-filtered triggers, check mergePatch.status
		const triggerType = this.getNodeParameter('triggerType') as TriggerType;
		const expectedStatus = TRIGGER_STATUS_FILTER[triggerType];

		if (expectedStatus) {
			const mergePatch = body.mergePatch as IDataObject | undefined;
			if (!mergePatch || mergePatch.status !== expectedStatus) {
				// Status doesn't match — skip this event
				return { webhookResponse: 'OK', workflowData: undefined };
			}
		}

		// Fetch the full resource
		const resourceId = body.resourceId as string;
		const endpointTemplate = TRIGGER_RESOURCE_ENDPOINT[triggerType];
		const endpoint = endpointTemplate.replace('{resourceId}', resourceId);

		const resource = await mercuryApiRequest.call(this, 'GET', endpoint);

		return {
			workflowData: [this.helpers.returnJsonArray(resource as IDataObject)],
		};
	}
}
