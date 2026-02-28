/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const collection = new Collection({
        "id": "pbc_push_subs",
        "name": "push_subscriptions",
        "type": "base",
        "system": false,
        "listRule": "@request.auth.id = userId",
        "viewRule": "@request.auth.id = userId",
        "createRule": "@request.auth.id != ''",
        "updateRule": "@request.auth.id = userId",
        "deleteRule": "@request.auth.id = userId",
        "fields": [
            {
                "id": "text_id",
                "name": "id",
                "type": "text",
                "system": true,
                "required": true,
                "presentable": false,
                "unique": true,
                "primaryKey": true
            },
            {
                "id": "relation_user",
                "name": "userId",
                "type": "relation",
                "system": false,
                "required": true,
                "presentable": false,
                "unique": false,
                "options": {
                    "collectionId": "_pb_users_auth_",
                    "cascadeDelete": true,
                    "minSelect": null,
                    "maxSelect": 1,
                    "displayFields": null
                }
            },
            {
                "id": "text_endpoint",
                "name": "endpoint",
                "type": "text",
                "system": false,
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
                "id": "number_expire",
                "name": "expirationTime",
                "type": "number",
                "system": false,
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
                "id": "json_keys",
                "name": "keys",
                "type": "json",
                "system": false,
                "required": true,
                "presentable": false,
                "unique": false,
                "options": {
                    "maxSize": 0
                }
            },
            {
                "id": "autodate_created",
                "name": "created",
                "type": "autodate",
                "system": false,
                "required": false,
                "presentable": false,
                "unique": false,
                "onCreate": true,
                "onUpdate": false
            },
            {
                "id": "autodate_updated",
                "name": "updated",
                "type": "autodate",
                "system": false,
                "required": false,
                "presentable": false,
                "unique": false,
                "onCreate": true,
                "onUpdate": true
            }
        ],
        "indexes": [
            "CREATE INDEX `idx_user_endpoint` ON `push_subscriptions` (`userId`, `endpoint`)"
        ]
    });

    return app.save(collection);
}, (app) => {
    const collection = app.findCollectionByNameOrId("push_subscriptions");
    return app.delete(collection);
})
