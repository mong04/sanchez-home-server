export const FIELD_MAP: Record<string, string> = {
    'emailVisibility': 'emailvisibility',
    'initialBalance': 'initialbalance',
    'initialBalanceDate': 'initialbalancedate',
    'isSystem': 'issystem',
    'isRecurring': 'isrecurring',
    'dueDay': 'dueday',
    'startDate': 'startdate',
    'expirationTime': 'expirationtime',
    'userId': 'userid',
    'transferGroupId': 'transfergroupid',
    'createdBy': 'createdby',
    'splitGroupId': 'splitgroupid',
    'isIncome': 'isincome',
    'templateTransactionId': 'templatetransactionid',
    'nextDate': 'nextdate',
    'autoApply': 'autoapply',
    'owner': 'owner',
    'frequency': 'frequency'
};

export const REVERSE_FIELD_MAP: Record<string, string> = Object.entries(FIELD_MAP)
    .reduce((acc, [k, v]) => ({ ...acc, [v]: k }), {});
