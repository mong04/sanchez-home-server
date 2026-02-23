/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const collections = ["accounts", "categories", "transactions", "budget_months"];

    for (const name of collections) {
        try {
            const collection = app.findCollectionByNameOrId(name);
            if (collection) {
                collection.listRule = "@request.auth.id != ''";
                collection.viewRule = "@request.auth.id != ''";
                collection.createRule = "@request.auth.id != ''";
                collection.updateRule = "@request.auth.id != ''";
                collection.deleteRule = "@request.auth.id != ''";
                app.save(collection);
            }
        } catch (err) {
            console.error("Migration failed for " + name, err);
        }
    }
}, (app) => {
    // Revert to original rules
    const accounts = app.findCollectionByNameOrId("accounts");
    if (accounts) {
        accounts.listRule = "owner = @request.auth.id";
        accounts.viewRule = "owner = @request.auth.id";
        accounts.createRule = "@request.auth.id != ''";
        accounts.updateRule = "owner = @request.auth.id";
        accounts.deleteRule = "owner = @request.auth.id";
        app.save(accounts);
    }

    const categories = app.findCollectionByNameOrId("categories");
    if (categories) {
        categories.listRule = "owner = @request.auth.id";
        categories.viewRule = "owner = @request.auth.id";
        categories.createRule = "@request.auth.id != ''";
        categories.updateRule = "owner = @request.auth.id";
        categories.deleteRule = "owner = @request.auth.id";
        app.save(categories);
    }

    const transactions = app.findCollectionByNameOrId("transactions");
    if (transactions) {
        transactions.listRule = "account.owner = @request.auth.id || createdBy = @request.auth.id";
        transactions.viewRule = "account.owner = @request.auth.id || createdBy = @request.auth.id";
        transactions.createRule = "@request.auth.id != ''";
        transactions.updateRule = "account.owner = @request.auth.id || createdBy = @request.auth.id";
        transactions.deleteRule = "account.owner = @request.auth.id || createdBy = @request.auth.id";
        app.save(transactions);
    }

    const budgetMonths = app.findCollectionByNameOrId("budget_months");
    if (budgetMonths) {
        budgetMonths.listRule = "owner = @request.auth.id";
        budgetMonths.viewRule = "owner = @request.auth.id";
        budgetMonths.createRule = "@request.auth.id != ''";
        budgetMonths.updateRule = "owner = @request.auth.id";
        budgetMonths.deleteRule = "owner = @request.auth.id";
        app.save(budgetMonths);
    }
})
