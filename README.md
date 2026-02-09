# n8n-nodes-mercury

This is an n8n community node that provides webhook-based triggers for [Mercury](https://mercury.com) banking events. It lets you automatically start n8n workflows when transactions or account balances change.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

[Installation](#installation) |
[Credentials](#credentials) |
[Trigger Events](#trigger-events) |
[Usage](#usage) |
[Architecture](#architecture) |
[Compatibility](#compatibility) |
[Resources](#resources)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Credentials

1. In Mercury, go to [Settings > API Tokens](https://app.mercury.com/settings/tokens).
2. Click **Create token** and give it a name (e.g., "n8n").
3. Copy the token — it's only shown once.
4. In n8n, go to **Credentials > Add Credential** and search for **Mercury API**.
5. Paste the token into the **API Token** field and save.

## Trigger Events

The **Mercury** node starts your workflow when one of the following events occurs:

| Trigger Type | Description |
|---|---|
| **Transaction Created** | A new transaction is created on any account |
| **Transaction Settled** | A transaction status changes to `settled` |
| **Transaction Failed** | A transaction status changes to `failed` |
| **Transaction Cancelled** | A transaction status changes to `cancelled` |
| **Transaction Updated** | Any update to a transaction (all status and metadata changes) |
| **Account Balance Updated** | A checking or savings account balance changes |

## Usage

1. In n8n, create a new workflow.
2. Add the **Mercury** node (search for "Mercury" in the nodes panel).
3. Select your **Mercury API** credential.
4. Choose a **Trigger Type** from the dropdown (e.g., "Transaction Created").
5. Connect any downstream nodes to process the data (e.g., send a Slack message, update a spreadsheet).
6. **Activate** the workflow.

Once active, the workflow runs automatically whenever the selected event occurs in Mercury. The trigger outputs the full resource — for transaction events, this is the complete [transaction object](https://docs.mercury.com/reference/get-transaction); for balance events, the complete [account object](https://docs.mercury.com/reference/get-account).

To stop receiving events, deactivate the workflow. The webhook is cleaned up automatically.

## Architecture

This node uses Mercury's [webhook API](https://docs.mercury.com/reference/create-webhook) with automatic lifecycle management:

- **Activate workflow** — n8n registers a webhook with Mercury for the selected event type.
- **Receive event** — Mercury sends a webhook notification. The node verifies the HMAC-SHA256 signature, then fetches the full resource (transaction or account) from the Mercury API.
- **Deactivate workflow** — n8n deregisters the webhook from Mercury.

You don't need to create or manage webhooks manually. The node handles registration and cleanup.

All incoming webhooks are verified using HMAC-SHA256 signatures (`Mercury-Signature` header). Webhooks with missing, invalid, or expired (>5 minutes) signatures are rejected.

## Compatibility

Requires **n8n >= 1.60.0**.

## Resources

- [Mercury API Documentation](https://docs.mercury.com/reference/)
- [n8n Community Nodes Documentation](https://docs.n8n.io/integrations/community-nodes/)
- [n8n Community Nodes Installation Guide](https://docs.n8n.io/integrations/community-nodes/installation/)
