/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const collection = app.findCollectionByNameOrId("push_subscriptions");

    if (!collection) return;

    unmarshal({
        "fields": [
            {
                "id": "text_id",
                "name": "id",
                "type": "text",
                "primaryKey": true,
                "required": true,
                "system": true
            },
            {
                "id": "text_user_id",
                "name": "userId",
                "type": "text",
                "required": true
            },
            {
                "id": "text_endpoint",
                "name": "endpoint",
                "type": "text",
                "required": true
            },
            {
                "id": "number_expire",
                "name": "expirationTime",
                "type": "number",
                "required": false
            },
            {
                "id": "json_keys",
                "name": "keys",
                "type": "json",
                "required": true
            },
            {
                "id": "autodate_created",
                "name": "created",
                "type": "autodate",
                "onCreate": true
            },
            {
                "id": "autodate_updated",
                "name": "updated",
                "type": "autodate",
                "onCreate": true,
                "onUpdate": true
            }
        ]
    }, collection);

    return app.save(collection);
}, (app) => {
    const collection = app.findCollectionByNameOrId("push_subscriptions");
    if (!collection) return;

    unmarshal({
        "fields": [
            {
                "id": "text_id",
                "name": "id",
                "type": "text",
                "primaryKey": true,
                "required": true,
                "system": true
            },
            {
                "id": "relation_user",
                "name": "userId",
                "type": "relation",
                "required": true,
                "options": {
                    "collectionId": "_pb_users_auth_",
                    "cascadeDelete": true,
                    "maxSelect": 1
                }
            },
            {
                "id": "text_endpoint",
                "name": "endpoint",
                "type": "text",
                "required": true
            },
            {
                "id": "number_expire",
                "name": "expirationTime",
                "type": "number",
                "required": false
            },
            {
                "id": "json_keys",
                "name": "keys",
                "type": "json",
                "required": true
            },
            {
                "id": "autodate_created",
                "name": "created",
                "type": "autodate",
                "onCreate": true
            },
            {
                "id": "autodate_updated",
                "name": "updated",
                "type": "autodate",
                "onCreate": true,
                "onUpdate": true
            }
        ]
    }, collection);

    return app.save(collection);
});
