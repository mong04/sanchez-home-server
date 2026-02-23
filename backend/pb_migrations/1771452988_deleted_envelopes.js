/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2222222222");

  return app.delete(collection);
}, (app) => {
  const collection = new Collection({
    "createRule": "@request.auth.role = 'admin'",
    "deleteRule": "@request.auth.role = 'admin'",
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text3208210256",
        "max": 0,
        "min": 0,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "envelopes_name",
        "max": 0,
        "min": 0,
        "name": "name",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "envelopes_budget_limit",
        "max": null,
        "min": null,
        "name": "budget_limit",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "envelopes_current_balance",
        "max": null,
        "min": null,
        "name": "current_balance",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "envelopes_owner",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "owner",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "envelopes_visibility",
        "maxSelect": 1,
        "name": "visibility",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "public",
          "private",
          "hidden"
        ]
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "envelopes_icon",
        "max": 0,
        "min": 0,
        "name": "icon",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "autodate2990389176",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": true,
        "type": "autodate"
      },
      {
        "hidden": false,
        "id": "autodate3332085495",
        "name": "updated",
        "onCreate": true,
        "onUpdate": true,
        "presentable": false,
        "system": true,
        "type": "autodate"
      }
    ],
    "id": "pbc_2222222222",
    "indexes": [],
    "listRule": "@request.auth.role = 'admin' || owner = @request.auth.id || (@request.auth.role = 'partner' && visibility = 'public')",
    "name": "envelopes",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.role = 'admin' || owner = @request.auth.id",
    "viewRule": "@request.auth.role = 'admin' || owner = @request.auth.id || (@request.auth.role = 'partner' && visibility = 'public')"
  });

  return app.save(collection);
})
