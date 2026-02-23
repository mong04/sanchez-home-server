/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1181747102")

  // update collection data
  unmarshal({
    "name": "budget_months"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1181747102")

  // update collection data
  unmarshal({
    "name": "bidget_months"
  }, collection)

  return app.save(collection)
})
