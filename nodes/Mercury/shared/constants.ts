export const MERCURY_API_BASE_URL = 'https://api.mercury.com/api/v1';

export type TriggerType =
	| 'transactionCreated'
	| 'transactionSettled'
	| 'transactionUpdated'
	| 'transactionFailed'
	| 'transactionCancelled'
	| 'accountBalanceUpdated';

export type MercuryWebhookEvent =
	| 'transaction.created'
	| 'transaction.updated'
	| 'checkingAccount.balance.updated'
	| 'savingsAccount.balance.updated';

export const TRIGGER_TO_EVENTS: Record<TriggerType, MercuryWebhookEvent[]> = {
	transactionCreated: ['transaction.created'],
	transactionSettled: ['transaction.updated'],
	transactionUpdated: ['transaction.updated'],
	transactionFailed: ['transaction.updated'],
	transactionCancelled: ['transaction.updated'],
	accountBalanceUpdated: [
		'checkingAccount.balance.updated',
		'savingsAccount.balance.updated',
	],
};

export const TRIGGER_STATUS_FILTER: Partial<Record<TriggerType, string>> = {
	transactionSettled: 'settled',
	transactionFailed: 'failed',
	transactionCancelled: 'cancelled',
};

export const TRIGGER_FILTER_PATHS: Partial<Record<TriggerType, string[]>> = {
	transactionSettled: ['transaction.status'],
	transactionFailed: ['transaction.status'],
	transactionCancelled: ['transaction.status'],
};

export const TRIGGER_RESOURCE_ENDPOINT: Record<TriggerType, string> = {
	transactionCreated: '/transaction/{resourceId}',
	transactionSettled: '/transaction/{resourceId}',
	transactionUpdated: '/transaction/{resourceId}',
	transactionFailed: '/transaction/{resourceId}',
	transactionCancelled: '/transaction/{resourceId}',
	accountBalanceUpdated: '/account/{resourceId}',
};
