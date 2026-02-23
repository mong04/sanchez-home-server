/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4444444444")

  // add field
  collection.fields.addAt(8, new Field({
    "hidden": false,
    "id": "bool1442100010",
    "name": "isRecurring",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // add field
  collection.fields.addAt(9, new Field({
    "hidden": false,
    "id": "select645904403",
    "maxSelect": 1,
    "name": "frequency",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "monthly",
      "quarterly",
      "yearly"
    ]
  }))

  // add field
  collection.fields.addAt(10, new Field({
    "hidden": false,
    "id": "number1036071427",
    "max": null,
    "min": null,
    "name": "dueDay",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(11, new Field({
    "hidden": false,
    "id": "date1269603864",
    "max": "",
    "min": "",
    "name": "startDate",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(12, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text18589324",
    "max": 0,
    "min": 0,
    "name": "notes",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4444444444")

  // remove field
  collection.fields.removeById("bool1442100010")

  // remove field
  collection.fields.removeById("select645904403")

  // remove field
  collection.fields.removeById("number1036071427")

  // remove field
  collection.fields.removeById("date1269603864")

  // remove field
  collection.fields.removeById("text18589324")

  return app.save(collection)
})
