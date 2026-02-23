/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3333333333")

  // update collection data
  unmarshal({
    "listRule": "@request.auth.id != ''",
    "viewRule": "@request.auth.id != ''"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3333333333")

  // update collection data
  unmarshal({
    "listRule": "account.owner = @request.auth.id || createdBy = @request.auth.id",
    "viewRule": "account.owner = @request.auth.id || createdBy = @request.auth.id"
  }, collection)

  return app.save(collection)
})
