/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3333333333")

  // add field
  collection.fields.addAt(14, new Field({
    "hidden": false,
    "id": "bool4274022410",
    "name": "isIncome",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3333333333")

  // remove field
  collection.fields.removeById("bool4274022410")

  return app.save(collection)
})
