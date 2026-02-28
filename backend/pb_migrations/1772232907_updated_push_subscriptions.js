/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1438754935")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != \"\"",
    "deleteRule": "@request.auth.id = userId",
    "indexes": [
      "CREATE INDEX idx_user_endpoint ON push_subscriptions (userId, endpoint)"
    ],
    "listRule": "@request.auth.id = userId",
    "updateRule": "@request.auth.id = userId",
    "viewRule": "@request.auth.id = userId"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1438754935")

  // update collection data
  unmarshal({
    "createRule": null,
    "deleteRule": null,
    "indexes": [],
    "listRule": null,
    "updateRule": null,
    "viewRule": null
  }, collection)

  return app.save(collection)
})
