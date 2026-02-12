import type {
	IDataObject,
	IHookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';

import { verifySignature } from './MercuryTriggerHelpers';
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
			name: 'Mercury',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'mercuryApi',
				required: true,
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
				displayName: 'Trigger Type',
				name: 'triggerType',
				type: 'options',
				required: true,
				default: 'transactionCreated',
				options: [
					{
						name: 'Account Balance Updated',
						value: 'accountBalanceUpdated',
						description:
							'Triggers when a checking or savings account balance changes',
					},
					{
						name: 'Transaction Cancelled',
						value: 'transactionCancelled',
						description: 'Triggers when a transaction status changes to cancelled',
					},
					{
						name: 'Transaction Created',
						value: 'transactionCreated',
						description: 'Triggers when a new transaction is created',
					},
					{
						name: 'Transaction Failed',
						value: 'transactionFailed',
						description: 'Triggers when a transaction status changes to failed',
					},
					{
						name: 'Transaction Settled',
						value: 'transactionSettled',
						description: 'Triggers when a transaction status changes to settled',
					},
					{
						name: 'Transaction Updated',
						value: 'transactionUpdated',
						description: 'Triggers when any transaction field is updated',
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
		const staticData = this.getWorkflowStaticData('node');
		const secret = staticData.secret as string;

		// Verify HMAC-SHA256 signature
		if (!verifySignature(this, secret)) {
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
