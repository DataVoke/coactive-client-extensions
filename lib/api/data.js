"use strict";

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * Custom Action: Extend api.data
 * Extends the api.data namespace with additional helper functions.
 * Dependencies:
 *    api.loadExtension
 *    api.ui
 */
api.loadExtension("api.data", function () {
  if (!api.data.recordToObject) {
    api.data.recordToObject = function (record) {
      var attachNativeRecord = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      var includeHiddenColumns = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      if (!record) record = api.ui.getDefaultForm().selectedRecord;
      var object = {};

      if (!record.gridValues) {
        record = record.raw;
      }

      var gridColumns = record.apiRef.parent.raw.gridColumns;
      record.gridValues.Values.forEach(function (item) {
        if (includeHiddenColumns || !gridColumns.getVal({
          Type: "Column",
          UID: item.property.UID
        }).columnProperty.IsHidden) {
          object[item.property.Definition.Name] = item.value;
          object[item.property.Name] = item.value;
        }
      });

      if (attachNativeRecord) {
        object._record = record;
      }

      return object;
    };
  }

  if (!api.data.recordsToObjects) {
    api.data.recordsToObjects = function (form) {
      var attachNativeRecord = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      var includeHiddenColumns = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      if (!form) form = api.ui.getDefaultForm();
      return form.records.Values.map(function (item) {
        return api.data.recordToObject(item, attachNativeRecord, includeHiddenColumns);
      });
    };
  }

  var noop = function noop() {};

  if (!api.data.objectToRecord) {
    api.data.objectToRecord = function (object, options) {
      var operationCallback = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : noop;
      var form = options.form,
          record = options.record,
          map = options.map;

      if (record && !form) {
        // If a record was provided, use its form
        form = record.parent || record.parentMVC;
      }

      if (!form) {
        // If no form was provided or detected, use the default one
        form = api.ui.getDefaultForm();
      }

      if (!record) {
        // If no record was provided, create one on the identified form
        api.actions.execute(form, api.actions.dvCore.NewRecord, {}, function (result) {
          if (result.success) {
            record = form.apiRef.selectedRecord.raw;
          } else {
            throw new Error(result.actionMessage);
          }
        });
      }

      if (!map) {
        // If no map was provided, assume keys/property names match between object and record
        map = {};
        Object.keys(object).forEach(function (key) {
          return map[key] = key;
        });
      } // Transfer the values from the object to the record


      var objKeys = Object.keys(map);

      var _loop = function _loop(k, _i) {
        var key = objKeys[_i];
        var lookForPropertyName = map[key];
        var recordProperty = lookForPropertyName && record.gridValues.Values.find(function (item) {
          return item.property.Definition.Name.toLowerCase() === lookForPropertyName.toLowerCase() || item.property.Name.toLowerCase() === lookForPropertyName.toLowerCase();
        });

        if (recordProperty) {
          //If the key on the incoming object is an array, use it's first element
          var expr = Array.isArray(object[key]) ? object[key][0] : object[key]; //If we have an invalid expression, add an escape character

          if (typeof expr === "string") {
            expr = expr.replace(/'/g, "''").replace(/}/g, "' + Char(125) + '");
          }

          api.actions.execute(form, api.actions.dvCore.SetValue, {
            propertyId: recordProperty.property.PropertyID,
            expression: "'".concat(expr, "'")
          }, function (result) {
            if (!result.success) {
              throw new Error(result.actionMessage);
            }
          });
        }
      };

      for (var _i = 0, k = objKeys.length; _i < k; _i++) {
        _loop(k, _i);
      }

      if (!!operationCallback) {
        operationCallback(record);
        return record;
      }
    };
  }

  if (!api.data.objectsToRecords) {
    api.data.objectsToRecords = function (objects, options) {
      return objects.forEach(function (item) {
        return api.data.objectToRecord(item, options);
      });
    };
  }

  if (!api.data.objectToNewRecord) {
    api.data.objectToNewRecord = function (object, options) {
      var operationCallback = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : noop;
      console.log("DEPRECATED: This may not work as expected.");
      var form = options.form,
          map = options.map;
      var record;

      if (!form) {
        // If no form was provided or detected, use the default one
        form = api.ui.getDefaultForm();
      } // Create new record on the identified form


      api.actions.execute(form, api.actions.dvCore.NewRecord, {}, function (result) {
        if (!result.success) {
          throw new Error(result.actionMessage);
        } else {
          record = form.apiRef.selectedRecord.raw;

          if (!map) {
            // If no map was provided, assume keys/property names match between object and record
            map = {};
            Object.keys(object).forEach(function (key) {
              return object[key] = key;
            });
          } // Transfer the values from the object to the record


          var keys = Object.keys(map);

          (function setValuesForRecord(index) {
            var key = keys[index];
            var lookForPropertyName = map[key];
            var recordProperty = lookForPropertyName && record.gridValues.Values.find(function (item) {
              return item.property.Definition.Name.toLowerCase() === lookForPropertyName.toLowerCase() || item.property.Name.toLowerCase() === lookForPropertyName.toLowerCase();
            });

            if (recordProperty) {
              //If the key on the incoming object is an array, use it's first element
              var expr = Array.isArray(object[key]) ? object[key][0] : object[key]; //If we have an invalid expression, add an escape character

              if (expr != null && expr.indexOf("'") > -1) {
                expr = expr.replace(/'/g, "''");
              }

              api.actions.execute(form, api.actions.dvCore.SetValue, {
                propertyId: recordProperty.property.PropertyID,
                expression: "'".concat(expr, "'")
              }, function (result) {
                if (!result.success) {
                  throw new Error(result.actionMessage);
                }

                if (index === keys.length - 1) {
                  operationCallback(record);
                  return record;
                } else {
                  index++;
                  setValuesForRecord(index);
                }
              });
            }
          })(0);
        }
      });
    };
  }

  if (!api.data.objectsToForm) {
    api.data.objectsToForm = function (_ref) {
      var objects = _ref.objects,
          form = _ref.form,
          progressBar = _ref.progressBar,
          _ref$progressIncremen = _ref.progressIncrement,
          progressIncrement = _ref$progressIncremen === void 0 ? 50 : _ref$progressIncremen,
          _ref$useOrdinalMatchi = _ref.useOrdinalMatching,
          useOrdinalMatching = _ref$useOrdinalMatchi === void 0 ? false : _ref$useOrdinalMatchi,
          _ref$makeDataStateDir = _ref.makeDataStateDirty,
          makeDataStateDirty = _ref$makeDataStateDir === void 0 ? true : _ref$makeDataStateDir;

      if (!Array.isArray(objects)) {
        throw new Error("The objects parameter must be an array of objects.");
      } // Make sure we've got a raw form (may be an API reference)


      if (form instanceof api.factory.View) {
        form = form.raw;
      }

      var objectCount = objects.length;
      return new Promise(function (resolve) {
        var batchCount = Math.ceil(objectCount / progressIncrement); // Prevent UI updates while adding records

        app.dv.mvc.setBulkInsert(form, true);

        if (progressBar) {
          progressBar.maxValue = objectCount;
          progressBar.value = 0;
        }

        var importBatchRecords = function importBatchRecords(importData, importForm, lowerLimit, upperLimit) {
          return new Promise(function (resolve) {
            var recordCodePropertyID = importForm && importForm.primaryRecordType && importForm.primaryRecordType.Definition && importForm.primaryRecordType.Definition.CodePropertyID;
            var recordCodePropertyName = importForm.gridColumns.getVal(recordCodePropertyID).property.Name;

            for (var recordIndex = lowerLimit; recordIndex < upperLimit; recordIndex++) {
              var importItem = importData[recordIndex]; // Check to see if there is an attached existing native record and replace it instead of creating a new record

              var internalRecordID = importItem._record && importItem._record.clientRecord && importItem._record.clientRecord.Record && importItem._record.clientRecord.Record.RecordID && importItem._record.clientRecord.Record.RecordID;
              var code = (importItem[recordCodePropertyName] || Math.floor(Math.random() * Math.floor(10000))).toString();
              var gridRecord = void 0;

              if (internalRecordID > 0) {
                // Attempt to use any existing record
                gridRecord = importForm.records.getVal(internalRecordID);
              }

              if (!gridRecord) {
                // Create a new GridRecord if necessary
                gridRecord = app.dv.mvc.createRecord(importForm, code); // Assign the internal record ID in case the record exists but the form does not currently have it loaded

                gridRecord.clientRecord.Record.RecordID = internalRecordID || gridRecord.clientRecord.Record.RecordID; // Only add the record to the MVC if it's not already there

                app.dv.mvc.addRecord(importForm, gridRecord, null);
              }

              if (!makeDataStateDirty) {
                // Set data state to not dirty if so indicated
                gridRecord.clientRecord.Record._State = app.dv.types.EntityStates.Unmodified;
              } // whether this is a new or found record, we now need to merge it.


              var columnCounter = 1;
              var maxDataColumns = importItem.length;
              var contextGridColumnValues = importForm.gridColumns.Values;

              for (var valueIndex = 0; valueIndex < contextGridColumnValues.length; valueIndex++) {
                try {
                  // if we are out of columns in our data, import no more.
                  if (columnCounter >= maxDataColumns) {
                    break;
                  } // get the current column


                  var col = contextGridColumnValues[valueIndex];

                  if (col.property.UID === recordCodePropertyID.UID) {
                    if (!makeDataStateDirty) {
                      // Set data state to not dirty if so indicated
                      var gridValue = gridRecord.gridValues.getVal(recordCodePropertyID);
                      gridValue.dynamicValue._State = app.dv.types.EntityStates.Unmodified;
                      gridValue.dynamicValue.Value = gridValue.dynamicValueEdit.Value;
                      gridValue.dynamicValueEdit = null;
                    } // skip the record code property, it was either used to create the record or find it.


                    continue;
                  }

                  if (useOrdinalMatching && col.columnProperty.IsHidden == true) {
                    // if the column is hidden, it shouldn't be touched by the import.
                    continue;
                  }

                  if (importItem.hasOwnProperty(col.property.Name)) {
                    // get the import value by name or position.
                    var valueToImport = useOrdinalMatching ? Object.values(importItem)[columnCounter] : importItem[col.property.Name];

                    try {
                      //Try to decode URI the value
                      valueToImport = decodeURIComponent(valueToImport);
                    } catch (ex) {
                      //There was an error decoding the data
                      if (api._debugMode) console.log("An error occurred while performing a decodeURI on row: ".concat(i, " column ").concat(columnCounter));
                    }

                    columnCounter++; // if the text value is "null", then assume that it really is a null value.

                    if (valueToImport.toLowerCase() == "null") {
                      valueToImport = null;
                    }

                    if (valueToImport == null || valueToImport == "") {
                      // if they are trying to load an empty value into a new record, skip this.
                      continue;
                    } // get the grid value for this column property in this record.


                    var gridValueToMerge = gridRecord.gridValues.getVal(col.property.PropertyID);

                    if (gridValueToMerge.displayProperties.getText() !== valueToImport) {
                      // update/merge the value.
                      gridValueToMerge.displayProperties.setText(valueToImport);

                      if (!makeDataStateDirty) {
                        // Set data state to not dirty if so indicated
                        gridValueToMerge.dynamicValue._State = app.dv.types.EntityStates.Unmodified;
                        gridValueToMerge.dynamicValue.Value = gridValueToMerge.dynamicValueEdit.Value;
                        gridValueToMerge.dynamicValueEdit = null;
                      }
                    }
                  }
                } catch (e) {
                  app.dv.mvc.setBulkInsert(importForm, false);
                }
              }
            }

            resolve();
          });
        };

        var batchIdx = 0;

        var processChunk = function processChunk() {
          if (batchIdx === batchCount) {
            // stop bulk insert on the MVC and show the records that were imported in the MVC grid...
            app.dv.mvc.setBulkInsert(form, false);
            resolve();
            return;
          }

          var lowerLimit = batchIdx * progressIncrement;
          var upperLimit = Math.min(lowerLimit + progressIncrement, objectCount); // if (upperLimit > objectCount) { upperLimit = objectCount; }

          if (progressBar) {
            progressBar.value = upperLimit;
            progressBar.progressMessage = "".concat(upperLimit, " / ").concat(objectCount);
          }

          setTimeout(function () {
            importBatchRecords(objects, form, lowerLimit, upperLimit).then(function () {
              batchIdx++;
              processChunk();
            });
          }, 50);
        };

        processChunk();
      });
    };
  }

  if (!api.data.columnArrayToObjects) {
    api.data.columnArrayToObjects = function (columns, includeColumnUIDs) {
      var object = {};
      (columns || []).forEach(function (column) {
        if (column && column.property && column.property.Definition && column.property.Definition.Name) {
          if (!includeColumnUIDs || includeColumnUIDs.some(function (uid) {
            return uid === column.property.UID;
          })) {
            object[column.property.Definition.Name] = column.value;
          }
        } else if (column && column.header && column.treeItem) {
          object[""] = "".concat(column.treeItem.value.value, " - ").concat(column.treeItem.summaryText());
        }
      });
      return object;
    };
  }

  if (!api.data.recordArrayToObjects) {
    api.data.recordArrayToObjects = function (records, includeColumnUIDs) {
      return (records || []).map(function (record) {
        return api.data.columnArrayToObjects(record, includeColumnUIDs);
      });
    };
  }

  if (!api.data.groupItemArrayToObjects) {
    api.data.groupItemArrayToObjects = function (groupItems, includeColumnUIDs) {
      return (groupItems || []).sort(api.data.groupItemsSorter).map(function (groupItem) {
        var _ref2;

        return _ref2 = {}, _defineProperty(_ref2, "".concat(groupItem.value.property.Definition.Name), groupItem.value.value), _defineProperty(_ref2, "records", groupItem.children && groupItem.children.length ? api.data.groupItemArrayToObjects(groupItem.children, includeColumnUIDs) : api.data.recordArrayToObjects(groupItem.getAllChildRecords(), includeColumnUIDs)), _ref2;
      });
    };
  }

  if (!api.data.formToObjects) {
    api.data.formToObjects = function (_ref3) {
      var _ref3$form = _ref3.form,
          form = _ref3$form === void 0 ? api.ui.getDefaultForm() : _ref3$form,
          _ref3$includeHiddenCo = _ref3.includeHiddenColumns,
          includeHiddenColumns = _ref3$includeHiddenCo === void 0 ? false : _ref3$includeHiddenCo,
          _ref3$grouped = _ref3.grouped,
          grouped = _ref3$grouped === void 0 ? true : _ref3$grouped,
          _ref3$hierarchical = _ref3.hierarchical,
          hierarchical = _ref3$hierarchical === void 0 ? false : _ref3$hierarchical;

      // Make sure we've got a raw form (may be an API reference)
      if (form instanceof api.factory.View) {
        form = form.raw;
      }

      var gridController = form.gridController;
      var includeColumnUIDs = gridController.mvcColumns.map(function (gridColumn) {
        if (includeHiddenColumns || !gridColumn.columnProperty.IsHidden) {
          return gridColumn.property.UID;
        }
      }).filter(function (gridColumn) {
        return Boolean(gridColumn);
      });

      if (hierarchical) {
        return api.data.groupItemArrayToObjects(gridController.groupTree, includeColumnUIDs);
      } else if (grouped) {
        //  The boundArray property only includes visible rows, so we need to expand all groups first
        gridController.expandCollapseAllGroups(true);
        return api.data.recordArrayToObjects(gridController.boundArray.objs, includeColumnUIDs);
      } else {
        //  The getSortedRecords method only includes visible rows, so we need to expand all groups first
        gridController.expandCollapseAllGroups(true);
        return api.data.recordArrayToObjects(gridController.getSortedRecords().map(function (record) {
          return record.gridValues.Values;
        }), includeColumnUIDs);
      }
    };
  }

  if (!api.data.groupItemsSorter) {
    api.data.groupItemsSorter = function (a, b) {
      if (a.value.value > b.value.value) {
        return 1;
      }

      if (a.value.value < b.value.value) {
        return -1;
      }

      return 0;
    };
  }

  if (!api.data.generateGridValuesMap) {
    api.data.generateGridValuesMap = function (formOrGridRecord) {
      var gridRecord = formOrGridRecord instanceof app.dv.entities.GridRecord ? formOrGridRecord : app.dv.mvc.createRecord(formOrGridRecord, "");
      var gridValuesMap = {};
      gridRecord.gridValues.Values.forEach(function (gridValue) {
        gridValuesMap["".concat(gridValue.property.Name)] = gridValue;
      });
      return gridValuesMap;
    };
  }

  if (!api.data.objectToGridRecord) {
    api.data.objectToGridRecord = function (form, object) {
      var gridRecord = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : app.dv.mvc.createRecord(form, "");
      var gridValuesMap = api.data.generateGridValuesMap(gridRecord);

      for (var key in object) {
        var gridValue = gridValuesMap[key];

        if (gridValue) {
          var valueToSet = object[key];

          if (gridValue.dynamicValue.DataType === app.dv.types.PropertyDataType.DateTime) {
            valueToSet = new Date(valueToSet);

            if (!valueToSet.isValid()) {
              valueToSet = null;
            }
          }

          gridValue.setValue(valueToSet);
        }
      }

      ;
      return gridRecord;
    };
  }

  if (!api.data.getExpressionValue) {
    api.data.getExpressionValue = function (gridValue) {
      var gridRecord = gridValue.parentRecord;
      var form = gridRecord.parentMVC;
      var property = gridValue.property;
      var formula = property.Definition.Formula;

      if (formula) {
        var viewID = form.drivingView.ViewID;
        var expression = new app.dv.helpers.expression.create(property, viewID, formula, null, form);
        return expression.evaluate(viewID, gridRecord);
      } else {
        return null;
      }
    };
  }

  if (!api.data.setBinaryValue) {
    api.data.setBinaryValue = function (gridValue, base64Value, fileName) {
      var fileDate = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : new Date();
      var fileHash = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : "";

      if (gridValue instanceof app.dv.entities.GridValue) {
        var valueMetadata = [{
          Key: "FileSize",
          Value: base64Value.length
        }, {
          Key: "FileName",
          Value: fileName
        }, {
          Key: "FileDate",
          Value: fileDate
        }, {
          Key: "FileHash",
          Value: fileHash
        }];
        app.dv.mvc.gridRecord.gridValue.setBinaryValue(gridValue, JSON.stringify(valueMetadata));
        gridValue.dynamicValueEdit.Value = base64Value;
        gridValue.dynamicValueEdit._State = app.dv.types.EntityStates.Modified;
        gridValue.updateUI();
        var mvc = gridValue && gridValue.parentRecord && gridValue.parentRecord.parentMVC;
        var gridController = mvc && mvc.gridController;

        if (gridController) {
          gridController.dataLoaded(mvc);
          gridController.uiGrid.vrp();
        }
      } else {
        if (api._debugMode) console.log("".concat(gridValue, " is not a GridValue."));
      }
    };
  }
});
//# sourceMappingURL=data.js.map