/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4444444444")

  // update collection data
  unmarshal({
    "deleteRule": "@request.auth.id != ''",
    "listRule": "@request.auth.id != ''",
    "updateRule": "@request.auth.id != ''",
    "viewRule": "@request.auth.id != ''"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4444444444")

  // update collection data
  unmarshal({
    "deleteRule": "owner = @request.auth.id",
    "listRule": "owner = @request.auth.id",
    "updateRule": "owner = @request.auth.id",
    "viewRule": "owner = @request.auth.id"
  }, collection)

  return app.save(collection)
})
