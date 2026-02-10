export const MERCURY_API_BASE_URL = 'https://api.mercury.com/api/v1';

export type TriggerType =
	| 'newTransaction'
	| 'settledTransaction'
	| 'transactionUpdate'
	| 'failedTransaction'
	| 'cancelledTransaction'
	| 'accountBalanceUpdate';

export type MercuryWebhookEvent =
	| 'transaction.created'
	| 'transaction.updated'
	| 'checkingAccount.balance.updated'
	| 'savingsAccount.balance.updated';

export const TRIGGER_TO_EVENTS: Record<TriggerType, MercuryWebhookEvent[]> = {
	newTransaction: ['transaction.created'],
	settledTransaction: ['transaction.updated'],
	transactionUpdate: ['transaction.updated'],
	failedTransaction: ['transaction.updated'],
	cancelledTransaction: ['transaction.updated'],
	accountBalanceUpdate: [
		'checkingAccount.balance.updated',
		'savingsAccount.balance.updated',
	],
};

export const TRIGGER_STATUS_FILTER: Partial<Record<TriggerType, string>> = {
	settledTransaction: 'settled',
	failedTransaction: 'failed',
	cancelledTransaction: 'cancelled',
};

export const TRIGGER_FILTER_PATHS: Partial<Record<TriggerType, string[]>> = {
	settledTransaction: ['transaction.status'],
	failedTransaction: ['transaction.status'],
	cancelledTransaction: ['transaction.status'],
};

export const TRIGGER_RESOURCE_ENDPOINT: Record<TriggerType, string> = {
	newTransaction: '/transaction/{resourceId}',
	settledTransaction: '/transaction/{resourceId}',
	transactionUpdate: '/transaction/{resourceId}',
	failedTransaction: '/transaction/{resourceId}',
	cancelledTransaction: '/transaction/{resourceId}',
	accountBalanceUpdate: '/account/{resourceId}',
};
