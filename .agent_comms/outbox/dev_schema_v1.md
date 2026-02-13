# PocketBase Schema Deliverable

Here are the generated files for the PocketBase backend initialization.

## 1. backend/pb_schema_v1.json

This file can be imported into PocketBase via the Admin UI -> Settings -> Import Collections.

```json
[
  {
    "id": "pbc_3141592654",
    "created": "2023-10-12 00:00:00.000Z",
    "updated": "2023-10-12 00:00:00.000Z",
    "name": "users",
    "type": "auth",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "users_name",
        "name": "name",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "users_avatar",
        "name": "avatar",
        "type": "file",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "maxSize": 5242880,
          "mimeTypes": [
            "image/jpeg",
            "image/png",
            "image/svg+xml",
            "image/gif",
            "image/webp"
          ],
          "thumbs": null,
          "protected": false
        }
      },
      {
        "system": false,
        "id": "users_role",
        "name": "role",
        "type": "select",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": [
            "admin",
            "partner",
            "child"
          ]
        }
      }
    ],
    "indexes": [],
    "listRule": "id = @request.auth.id || @request.auth.role = 'admin'",
    "viewRule": "id = @request.auth.id || @request.auth.role = 'admin'",
    "createRule": "@request.auth.role = 'admin'",
    "updateRule": "@request.auth.id = id || @request.auth.role = 'admin'",
    "deleteRule": "@request.auth.role = 'admin'",
    "options": {
      "allowEmailAuth": true,
      "allowOAuth2Auth": true,
      "allowUsernameAuth": true,
      "exceptEmailDomains": null,
      "manageRule": null,
      "minPasswordLength": 8,
      "onlyEmailDomains": null,
      "requireEmail": false
    }
  },
  {
    "id": "pbc_1111111111",
    "created": "2023-10-12 00:00:00.000Z",
    "updated": "2023-10-12 00:00:00.000Z",
    "name": "accounts",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "accounts_name",
        "name": "name",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "accounts_type",
        "name": "type",
        "type": "select",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": [
            "checking",
            "savings",
            "credit",
            "cash"
          ]
        }
      },
      {
        "system": false,
        "id": "accounts_balance",
        "name": "balance",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "noDecimal": false
        }
      },
      {
        "system": false,
        "id": "accounts_owner",
        "name": "owner",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "pbc_3141592654",
          "cascadeDelete": false,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "accounts_is_joint",
        "name": "is_joint",
        "type": "bool",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {}
      }
    ],
    "indexes": [],
    "listRule": "@request.auth.role = 'admin' || owner = @request.auth.id || (@request.auth.role = 'partner' && is_joint = true)",
    "viewRule": "@request.auth.role = 'admin' || owner = @request.auth.id || (@request.auth.role = 'partner' && is_joint = true)",
    "createRule": "@request.auth.role = 'admin'",
    "updateRule": "@request.auth.role = 'admin'",
    "deleteRule": "@request.auth.role = 'admin'",
    "options": {}
  },
  {
    "id": "pbc_2222222222",
    "created": "2023-10-12 00:00:00.000Z",
    "updated": "2023-10-12 00:00:00.000Z",
    "name": "envelopes",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "envelopes_name",
        "name": "name",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "envelopes_budget_limit",
        "name": "budget_limit",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "noDecimal": false
        }
      },
      {
        "system": false,
        "id": "envelopes_current_balance",
        "name": "current_balance",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "noDecimal": false
        }
      },
      {
        "system": false,
        "id": "envelopes_owner",
        "name": "owner",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "pbc_3141592654",
          "cascadeDelete": false,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "envelopes_visibility",
        "name": "visibility",
        "type": "select",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": [
            "public",
            "private",
            "hidden"
          ]
        }
      },
      {
        "system": false,
        "id": "envelopes_icon",
        "name": "icon",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      }
    ],
    "indexes": [],
    "listRule": "@request.auth.role = 'admin' || owner = @request.auth.id || (@request.auth.role = 'partner' && visibility = 'public')",
    "viewRule": "@request.auth.role = 'admin' || owner = @request.auth.id || (@request.auth.role = 'partner' && visibility = 'public')",
    "createRule": "@request.auth.role = 'admin'",
    "updateRule": "@request.auth.role = 'admin' || owner = @request.auth.id",
    "deleteRule": "@request.auth.role = 'admin'",
    "options": {}
  },
  {
    "id": "pbc_3333333333",
    "created": "2023-10-12 00:00:00.000Z",
    "updated": "2023-10-12 00:00:00.000Z",
    "name": "transactions",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "transactions_payee",
        "name": "payee",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "transactions_amount",
        "name": "amount",
        "type": "number",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "noDecimal": false
        }
      },
      {
        "system": false,
        "id": "transactions_date",
        "name": "date",
        "type": "date",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": "",
          "max": ""
        }
      },
      {
        "system": false,
        "id": "transactions_envelope",
        "name": "envelope",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "pbc_2222222222",
          "cascadeDelete": false,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "transactions_account",
        "name": "account",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "pbc_1111111111",
          "cascadeDelete": false,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "transactions_notes",
        "name": "notes",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "transactions_status",
        "name": "status",
        "type": "select",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": [
            "cleared",
            "pending"
          ]
        }
      }
    ],
    "indexes": [],
    "listRule": "@request.auth.role = 'admin' || envelope.owner = @request.auth.id || (@request.auth.role = 'partner' && envelope.visibility = 'public')",
    "viewRule": "@request.auth.role = 'admin' || envelope.owner = @request.auth.id || (@request.auth.role = 'partner' && envelope.visibility = 'public')",
    "createRule": "@request.auth.id != ''",
    "updateRule": "@request.auth.role = 'admin' || envelope.owner = @request.auth.id",
    "deleteRule": "@request.auth.role = 'admin' || envelope.owner = @request.auth.id",
    "options": {}
  }
]
```

## 2. src/types/pocketbase.ts

This file contains the TypeScript definitions for the PocketBase collections.

```typescript
/**
* This file was @generated using pocketbase-typegen
*/

export enum Collections {
	Users = "users",
	Accounts = "accounts",
	Envelopes = "envelopes",
	Transactions = "transactions",
}

// Universal records
export interface BaseRecord {
    id: string;
    created: string;
    updated: string;
    collectionId: string;
    collectionName: string;
}

// User Record
export enum UserRoleOptions {
	"admin" = "admin",
	"partner" = "partner",
	"child" = "child",
}
export interface UserRecord extends BaseRecord {
    name?: string;
    avatar?: string;
    role: UserRoleOptions;
}

// Account Record
export enum AccountTypeOptions {
	"checking" = "checking",
	"savings" = "savings",
	"credit" = "credit",
	"cash" = "cash",
}
export interface AccountRecord extends BaseRecord {
    name: string;
    type: AccountTypeOptions;
    balance?: number;
    owner: string; // Relation to users
    is_joint?: boolean;
}

// Envelope Record
export enum EnvelopeVisibilityOptions {
	"public" = "public",
	"private" = "private",
	"hidden" = "hidden",
}
export interface EnvelopeRecord extends BaseRecord {
    name: string;
    budget_limit?: number;
    current_balance?: number;
    owner: string; // Relation to users
    visibility: EnvelopeVisibilityOptions;
    icon?: string;
}

// Transaction Record
export enum TransactionStatusOptions {
	"cleared" = "cleared",
	"pending" = "pending",
}
export interface TransactionRecord extends BaseRecord {
    payee: string;
    amount: number;
    date: string;
    envelope: string; // Relation to envelopes
    account: string; // Relation to accounts
    notes?: string;
    status: TransactionStatusOptions;
}

// Response Types (for use in API calls)
export type UsersResponse = UserRecord
export type AccountsResponse = AccountRecord
export type EnvelopesResponse = EnvelopeRecord
export type TransactionsResponse = TransactionRecord
```
