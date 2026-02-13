# PocketBase Schema & Security Draft

**Date**: 2026-02-12
**Context**: Family Finance Hub - Schema Definition
**Status**: DRAFT

## 1. Collections Draft (JSON Structure Concept)

### `users` (System Collection)
*Extends the default PocketBase users collection.*
- **Fields**:
  - `role`: `select` (options: `admin`, `partner`, `child`) [Required]
  - `avatar`: `file`
  - `name`: `text`

### `accounts`
*Represents physical places where money lives (Bank Accounts, Cash Wallets).*
- **Fields**:
  - `name`: `text` (e.g., "Chase Checking", "Dad's Wallet")
  - `type`: `select` (options: `checking`, `savings`, `credit`, `cash`)
  - `balance`: `number` (Current actual balance)
  - `owner`: `relation` -> `users` (The primary owner)
  - `is_joint`: `bool` (If true, visible to both Admin and Partner)

### `envelopes`
*Virtual buckets for money. The sum of all envelope balances must equal sum of all account balances (Budget Identity).*
- **Fields**:
  - `name`: `text` (e.g., "Groceries", "Armin's Allowance")
  - `budget_limit`: `number` (Monthly target)
  - `current_balance`: `number` (How much is in there right now)
  - `owner`: `relation` -> `users` (Who "owns" this budget category)
  - `visibility`: `select` (options: `public`, `private`, `hidden`)
    - `public`: Visible to Admin and Partner (e.g., Joint Bills).
    - `private`: Visible only to Owner and Admin (e.g., "Her Surprise Fund").
    - `hidden`: Archival or special system use.
  - `icon`: `text` (Emoji or icon name)

### `transactions`
*Money movement. Inflow or Outflow.*
- **Fields**:
  - `payee`: `text` (Where money went/came from)
  - `amount`: `number` (Positive for inflow/deposit, Negative for expense)
  - `date`: `date`
  - `envelope`: `relation` -> `envelopes` (Which budget bucket this affects)
  - `account`: `relation` -> `accounts` (Which real account paid for it)
  - `notes`: `text`
  - `status`: `select` (options: `cleared`, `pending`)

---

## 2. API Rules (Security Logic)

**Goal**: "Child User" (Armin) must see ZERO results for data they don't own. "Partner" sees their own + Joint. "Admin" (CFO) sees everything.

### General Roles
- **Admin**: Attributes { role: 'admin' }
- **Partner**: Attributes { role: 'partner' }
- **Child**: Attributes { role: 'child' }

### Collection Rules

#### `users`
- **List/View**: `id = @request.auth.id` (Users can only see themselves) OR `@request.auth.role = 'admin'`
- **Create/Update/Delete**: `@request.auth.role = 'admin'` (Only CFO manages users)

#### `accounts`
- **List/View**:
  ```sql
  // Admin sees all
  @request.auth.role = 'admin' 
  ||
  // Owner sees their own
  owner = @request.auth.id
  ||
  // Partner sees Joint accounts
  (@request.auth.role = 'partner' && is_joint = true)
  ```
- **Create/Update/Delete**: `@request.auth.role = 'admin'` (Strict control on accounts)

#### `envelopes`
- **List/View**:
  ```sql
  // Admin sees all
  @request.auth.role = 'admin' 
  ||
  // Everyone sees what they own (including Child)
  owner = @request.auth.id
  ||
  // Partner sees 'public' envelopes (Joint Budget)
  (@request.auth.role = 'partner' && visibility = 'public')
  ```
- **Create**: `@request.auth.role = 'admin'` (CFO sets up budget structure initially)
- **Update**: 
  ```sql
  // Admin can edit all
  @request.auth.role = 'admin'
  ||
  // Owners can edit their own (e.g. rename, change icon) - BUT maybe not balance directly?
  // For MVP, allow owners to edit.
  owner = @request.auth.id
  ```

#### `transactions`
- **List/View**:
  ```sql
  // Admin sees all
  @request.auth.role = 'admin'
  ||
  // Users see transactions linked to their envelopes
  envelope.owner = @request.auth.id
  ||
  // Partner sees transactions in public envelopes
  (@request.auth.role = 'partner' && envelope.visibility = 'public')
  ```
- **Create**: 
  ```sql
  // Users can create transactions against their allowed envelopes
  // (Requires verifying the envelope check in the API rule or relying on frontend + backend validation)
  @request.auth.id != ""
  ```
  *(Note: PocketBase API rules for 'Create' usually check the submitted data. We might need a check like `(@request.data.envelope:envelopes.owner = @request.auth.id)` to prevent posting to others' envelopes, but standard List rule filters the relation selection in UI.)*

---

## 3. User Story Mapping (P1)

### Setup Phase (PocketBase Admin UI)
*These stories are executed by the CFO directly in the PocketBase dashboard.*
1.  **As the CFO**, I create the `users` (Me, Spouse, Child).
2.  **As the CFO**, I create the `accounts` (Main Checking, Savings, Wallet).
3.  **As the CFO**, I create the `envelopes` structure:
    -   "Mortgage" (Owner: Me, Visibility: Public)
    -   "Groceries" (Owner: Spouse, Visibility: Public)
    -   "Armin's Allowance" (Owner: Armin, Visibility: Private/Public to him)
    -   "Dad's Hobbies" (Owner: Me, Visibility: Private)

### Usage Phase (Custom React App)
*These stories happen in the new generic frontend.*
1.  **As the Partner**, I log in and see a dashboard showing "Groceries" and "Mortgage" (because they are Public) and my own "Spouse Personal" envelope.
2.  **As the Partner**, I do NOT see "Dad's Hobbies" or "Armin's Allowance" (unless Public).
3.  **As the Child**, I log in and see *only* "Armin's Allowance". My total net worth matches that envelope.
4.  **As the Child**, I try to hack the URL to see transactions for "Mortgage" and get a 404/Empty List (Thanks to API Rules).
5.  **As a User**, I click "Add Transaction", select one of *my* envelopes, enter an amount, and save. The envelope balance updates (needs backend hook or client-side calc).

