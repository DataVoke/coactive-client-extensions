"use strict";

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

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
      var callback = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : noop;
      var form = options.form,
          record = options.record,
          map = options.map;

      if (record) {
        // If a record was provided, use its form
        form = record.parent;
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

      var _loop = function _loop(i, k) {
        var key = objKeys[i];
        var lookForPropertyName = map[key].toLowerCase();
        var recordProperty = record.gridValues.Values.find(function (item) {
          return item.property.Definition.Name.toLowerCase() === lookForPropertyName || item.property.Name.toLowerCase() === lookForPropertyName;
        });

        if (recordProperty) {
          //If the key on the incoming object is an array, use it's first element
          var expr = Array.isArray(object[key]) ? object[key][0] : object[key]; //If we have an invalid expression, add an escape character

          expr = expr.replace(/'/g, "''").replace(/}/g, "' + Char(125) + '");
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

      for (var i = 0, k = objKeys.length; i < k; i++) {
        _loop(i, k);
      }

      if (!!callback) {
        callback();
      }
    };
  }

  if (!api.data.objectsToRecords) {
    api.data.objectsToRecords = function (objects, options) {
      objects.forEach(function (item) {
        return api.data.objectToRecord(item, options);
      });
    };
  }

  if (!api.data.objectToNewRecord) {
    api.data.objectToNewRecord = function (object, options) {
      var callback = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : noop;
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
            var lookForPropertyName = map[key].toLowerCase();
            var recordProperty = record.gridValues.Values.find(function (item) {
              return item.property.Definition.Name.toLowerCase() === lookForPropertyName || item.property.Name.toLowerCase() === lookForPropertyName;
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
                  callback();
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
            for (var i = lowerLimit, il = upperLimit; i < il; i++) {
              var row = importData[i];
              var importLoadRecord = app.dv.mvc.createRecord(importForm, Object.values(row)[0]);

              if (!makeDataStateDirty) {
                // Set data state to not dirty if so indicated
                importLoadRecord.clientRecord.Record._State = app.dv.types.EntityStates.Unmodified;
              }

              app.dv.mvc.addRecord(importForm, importLoadRecord, null);

              if (importLoadRecord != null) {
                // whether this is a new or found record, we now need to merge it.
                var columnCounter = 1;
                var maxDataColumns = row.length;
                var contextGridColumnValues = importForm.gridColumns.Values;

                for (var j = 0, jl = contextGridColumnValues.length; j < jl; j++) {
                  try {
                    // if we are out of columns in our data, import no more.
                    if (columnCounter >= maxDataColumns) {
                      break;
                    } // get the current column


                    var col = contextGridColumnValues[j];

                    if (importForm.primaryRecordType.Definition.CodePropertyID !== null && col.property.UID === importForm.primaryRecordType.Definition.CodePropertyID.UID) {
                      if (!makeDataStateDirty) {
                        // Set data state to not dirty if so indicated
                        var gridValue = importLoadRecord.gridValues.getVal(importForm.primaryRecordType.Definition.CodePropertyID);
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

                    if (row.hasOwnProperty(col.property.Name)) {
                      // get the import value by name or position.
                      var valueToImport = useOrdinalMatching ? Object.values(row)[columnCounter] : row[col.property.Name];

                      try {
                        //Try to decode URI the value
                        valueToImport = decodeURIComponent(valueToImport);
                      } catch (ex) {
                        //There was an error decoding the data
                        console.log("An error occurred while performing a decodeURI on row: ".concat(i, " column ").concat(columnCounter));
                      }

                      columnCounter++; // if the text value is "null", then assume that it really is a null value.

                      if (valueToImport.toLowerCase() == "null") {
                        valueToImport = null;
                      }

                      if (valueToImport == null || valueToImport == "") {
                        // if they are trying to load an empty value into a new record, skip this.
                        continue;
                      } // get the grid value for this column property in this record.


                      var gridValueToMerge = importLoadRecord.gridValues.getVal(col.property.PropertyID);

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

                resolve();
              }
            }
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

  if (!api.data.getEndpointResult) {
    api.data.getEndpointResult =
    /*#__PURE__*/
    function () {
      var _ref4 = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee(endpointName) {
        var inputParameters,
            _args = arguments;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                inputParameters = _args.length > 1 && _args[1] !== undefined ? _args[1] : {};
                _context.prev = 1;
                return _context.abrupt("return", new Promise(function (resolve, reject) {
                  if (endpointName) {
                    // const input = eval(`(function() { return ${inputParameters}; })()`);
                    app.connection.call("Custom", endpointName, inputParameters, function (result, error) {
                      resolve(result);
                    });
                  } else {
                    reject("There is no endpoint specified.");
                  }
                }));

              case 5:
                _context.prev = 5;
                _context.t0 = _context["catch"](1);
                throw _context.t0;

              case 8:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, null, [[1, 5]]);
      }));

      return function (_x) {
        return _ref4.apply(this, arguments);
      };
    }();
  }
});
//# sourceMappingURL=data.js.map