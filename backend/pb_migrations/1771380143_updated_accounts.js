/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1111111111")

  // update collection data
  unmarshal({
    "createRule": "owner = @request.auth.id",
    "deleteRule": "owner = @request.auth.id || (@request.auth.role = 'partner' && is_joint = true)",
    "updateRule": "owner = @request.auth.id || (@request.auth.role = 'partner' && is_joint = true)"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1111111111")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.role = 'admin'",
    "deleteRule": "@request.auth.role = 'admin'",
    "updateRule": "@request.auth.role = 'admin'"
  }, collection)

  return app.save(collection)
})
