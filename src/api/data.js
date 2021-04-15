export default (() => {
    /**
     * Extends the api.data namespace with additional helper functions.
     * Dependencies:
     *    api.ui
     *    api.actions
     */
    if (!api.data) api.data = {};

    if (!api.data.recordToObject) {
        api.data.recordToObject = (record, attachNativeRecord = false, includeHiddenColumns = false) => {
            if (!record)
                record = api.ui.getDefaultForm().selectedRecord;
            const object = {};
            if (!record.gridValues) {
                record = record.raw;
            }
            const gridColumns = record.apiRef.parent.raw.gridColumns;
            record.gridValues.Values.forEach(item => {
                if (includeHiddenColumns || !gridColumns.getVal({ Type: "Column", UID: item.property.UID}).columnProperty.IsHidden) {
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
        api.data.recordsToObjects = (form, attachNativeRecord = false, includeHiddenColumns = false) => {
            if (!form)
                form = api.ui.getDefaultForm();
            return form.records.Values.map(item => api.data.recordToObject(item, attachNativeRecord, includeHiddenColumns));
        };
    }

    let noop = function() {};

    if (!api.data.objectToRecord) {
        api.data.objectToRecord = (object, options, operationCallback = noop) => {
            let { form, record, map } = options;
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
                api.actions.execute(form, api.actions.dvCore.NewRecord, {}, result => {
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
                Object.keys(object).forEach(key => map[key] = key);
            }
            // Transfer the values from the object to the record
            let objKeys = Object.keys(map);
            for (let i = 0, k = objKeys.length; i < k; i++) {
                let key = objKeys[i];
                const lookForPropertyName = map[key];
                const recordProperty = lookForPropertyName && record.gridValues.Values.find(item => {
                    return item.property.Definition.Name.toLowerCase() === lookForPropertyName.toLowerCase() || item.property.Name.toLowerCase() === lookForPropertyName.toLowerCase();
                });
                if (recordProperty) {
                    //If the key on the incoming object is an array, use it's first element
                    let expr = Array.isArray(object[key]) ? object[key][0] : object[key];
                    //If we have an invalid expression, add an escape character
                    if (typeof expr === "string") {
                        expr = expr
                            .replace(/'/g, "''")
                            .replace(/}/g, "' + Char(125) + '");
                    }
                    api.actions.execute(form, api.actions.dvCore.SetValue, {
                        propertyId: recordProperty.property.PropertyID,
                        expression: `'${expr}'`
                    }, result => {
                        if (!result.success) {
                            throw new Error(result.actionMessage);
                        }
                    });
                }
            }
            if (!!operationCallback) {
                operationCallback(record);
                return record;
            }
        };
    }

    if (!api.data.objectsToRecords) {
        api.data.objectsToRecords = (objects, options) => {
            return objects.forEach(item => api.data.objectToRecord(item, options));
        };
    }

    if (!api.data.objectToNewRecord) {
        api.data.objectToNewRecord = (object, options, operationCallback = noop) => {
            console.log("DEPRECATED: This may not work as expected.");
            let { form, map } = options;
            let record;
            if (!form) {
                // If no form was provided or detected, use the default one
                form = api.ui.getDefaultForm();
            }
            // Create new record on the identified form
            api.actions.execute(form, api.actions.dvCore.NewRecord, {}, result => {
                if (!result.success) {
                    throw new Error(result.actionMessage);
                }
                else {
                    record = form.apiRef.selectedRecord.raw;
                    if (!map) {
                        // If no map was provided, assume keys/property names match between object and record
                        map = {};
                        Object.keys(object).forEach(key => object[key] = key);
                    }
                    // Transfer the values from the object to the record
                    let keys = Object.keys(map);
                    (function setValuesForRecord (index) {
                        let key = keys[index];
                        const lookForPropertyName = map[key];
                        const recordProperty = lookForPropertyName && record.gridValues.Values.find(item => {
                            return item.property.Definition.Name.toLowerCase() === lookForPropertyName.toLowerCase() || item.property.Name.toLowerCase() === lookForPropertyName.toLowerCase();
                        });
                        if (recordProperty) {
                            //If the key on the incoming object is an array, use it's first element
                            let expr = Array.isArray(object[key]) ? object[key][0] : object[key];
                            //If we have an invalid expression, add an escape character
                            if (expr != null && expr.indexOf("'") > -1) {
                                expr = expr.replace(/'/g, "''");
                            }
                            api.actions.execute(form, api.actions.dvCore.SetValue, {
                                propertyId: recordProperty.property.PropertyID,
                                expression: `'${expr}'`
                            }, result => {
                                if (!result.success) {
                                    throw new Error(result.actionMessage);
                                }
                                if (index === keys.length - 1) {
                                    operationCallback(record);
                                    return record;
                                }
                                else {
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
        api.data.objectsToForm = ({
            objects,
            form,
            progressBar,
            progressIncrement = 50,
            useOrdinalMatching = false,
            makeDataStateDirty = true,
        }) => {
            if (!Array.isArray(objects)) {
                throw new Error("The objects parameter must be an array of objects.");
            }

            // Make sure we've got a raw form (may be an API reference)
            if (form instanceof api.factory.View) {
                form = form.raw;
            }
            const objectCount = objects.length;

            return new Promise((resolve) => {
                const batchCount = Math.ceil(objectCount / progressIncrement);

                // Prevent UI updates while adding records
                if (form.setBulkInsert) form.setBulkInsert(true);
                else app.dv.mvc.setBulkInsert(form, true);

                if (progressBar) {
                    progressBar.maxValue = objectCount;
                    progressBar.value = 0;
                }

                const importBatchRecords = (importData, importForm, lowerLimit, upperLimit) => {
                    return new Promise((resolve) => {
                        const recordCodePropertyID = importForm && importForm.primaryRecordType && importForm.primaryRecordType.Definition && importForm.primaryRecordType.Definition.CodePropertyID;
                        const recordCodePropertyName = importForm.gridColumns.getVal(recordCodePropertyID).property.Name;
                        for (let recordIndex = lowerLimit; recordIndex < upperLimit; recordIndex++) {
                            const importItem = importData[recordIndex];
                            console.log(`importItem: ${recordIndex}`, importItem);
                            // Check to see if there is an attached existing native record and replace it instead of creating a new record
                            const internalRecordID = importItem._record && importItem._record.clientRecord && importItem._record.clientRecord.Record && importItem._record.clientRecord.Record.RecordID &&
                                importItem._record.clientRecord.Record.RecordID;
                            const code = (importItem[recordCodePropertyName] || Math.floor(Math.random() * Math.floor(10000))).toString();
                            let gridRecord;
                            if (internalRecordID > 0) {
                                // Attempt to use any existing record
                                gridRecord = importForm.records.getVal(internalRecordID);
                            }
                            if (!gridRecord) {
                                // Create a new GridRecord if necessary
                                if (importForm.createRecord) gridRecord = importForm.createRecord(code);
                                else gridRecord = app.dv.mvc.createRecord(importForm, code);
                                // Assign the internal record ID in case the record exists but the form does not currently have it loaded
                                gridRecord.clientRecord.Record.RecordID = internalRecordID || gridRecord.clientRecord.Record.RecordID;
                                // Only add the record to the MVC if it's not already there
                                if (importForm.addRecord) importForm.addRecord(gridRecord, null);
                                else app.dv.mvc.addRecord(importForm, gridRecord, null);
                            }
                            if (!makeDataStateDirty) {
                                // Set data state to not dirty if so indicated
                                gridRecord.clientRecord.Record._State = app.dv.types.EntityStates.Unmodified;
                            }
                            // whether this is a new or found record, we now need to merge it.
                            let columnCounter = 1;
                            const maxDataColumns = importItem.length;
                            const contextGridColumnValues = importForm.gridColumns.Values;

                            for (let valueIndex = 0; valueIndex < contextGridColumnValues.length; valueIndex++) {
                                try {
                                    // if we are out of columns in our data, import no more.
                                    if (columnCounter >= maxDataColumns) { break; }

                                    // get the current column
                                    const col = contextGridColumnValues[valueIndex];

                                    if (col.property.UID === recordCodePropertyID.UID) {
                                        if (!makeDataStateDirty) {
                                            // Set data state to not dirty if so indicated
                                            const gridValue = gridRecord.gridValues.getVal(recordCodePropertyID);
                                            gridValue.dynamicValue._State = app.dv.types.EntityStates.Unmodified;
                                            gridValue.dynamicValue.Value = gridValue.dynamicValueEdit.Value;
                                            gridValue.dynamicValueEdit = null;
                                        }
                                        // skip the record code property, it was either used to create the record or find it.
                                        continue;
                                    }

                                    if (useOrdinalMatching && col.columnProperty.IsHidden == true) {
                                        // if the column is hidden, it shouldn't be touched by the import.
                                        continue;
                                    }

                                    if (importItem.hasOwnProperty(col.property.Name)) {
                                        // get the import value by name or position.
                                        let valueToImport = useOrdinalMatching ?
                                            Object.values(importItem)[columnCounter] :
                                            importItem[col.property.Name];
                                        try {
                                            //Try to decode URI the value
                                            valueToImport = decodeURIComponent(valueToImport);
                                        }
                                        catch(ex) {
                                            //There was an error decoding the data
                                            if (api._debugMode) console.log(`An error occurred while performing a decodeURI on row: ${i} column ${columnCounter}`);
                                        }
                                        columnCounter++;

                                        // if the text value is "null", then assume that it really is a null value.
                                        if (valueToImport.toLowerCase() == "null") { valueToImport = null; }
                                        if ((valueToImport == null || valueToImport == "")) {
                                            // if they are trying to load an empty value into a new record, skip this.
                                            continue;
                                        }

                                        // get the grid value for this column property in this record.
                                        const gridValueToMerge = gridRecord.gridValues.getVal(col.property.PropertyID);

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
                                }
                                catch (e) {
                                    if (importForm.setBulkInsert) importForm.setBulkInsert(false);
                                    else app.dv.mvc.setBulkInsert(importForm, false);
                                }
                            }
                        }
                        resolve();
                    });
                }

                let batchIdx = 0;
                const processChunk = () => {

                    if (batchIdx === batchCount) {
                        // stop bulk insert on the MVC and show the records that were imported in the MVC grid...
                        if (form.setBulkInsert) form.setBulkInsert(false);
                        else app.dv.mvc.setBulkInsert(form, false);
                        resolve();
                        return;
                    }

                    const lowerLimit = batchIdx * progressIncrement;
                    const upperLimit = Math.min(lowerLimit + progressIncrement, objectCount);
                    // if (upperLimit > objectCount) { upperLimit = objectCount; }
                    if (progressBar) {
                        progressBar.value = upperLimit;
                        progressBar.progressMessage = `${upperLimit} / ${objectCount}`;
                    }

                    setTimeout (() => {
                        importBatchRecords(objects, form, lowerLimit, upperLimit).then(() => {
                            batchIdx++;
                            processChunk();
                        });
                    }, 50);
                }

                processChunk();
            });
        };
    }

    if (!api.data.columnArrayToObjects) {
        api.data.columnArrayToObjects = (columns, includeColumnUIDs) => {
            const object = {};
            (columns||[]).forEach(column => {
                if (column && column.property && column.property.Definition && column.property.Definition.Name) {
                    if (!includeColumnUIDs || includeColumnUIDs.some(uid => uid === column.property.UID)) {
                        object[column.property.Definition.Name] = column.value;
                    }
                } else if (column && column.header && column.treeItem) {
                    object[""] = `${column.treeItem.value.value} - ${column.treeItem.summaryText()}`;
                }
            });
            return object;
        };
    }

    if (!api.data.recordArrayToObjects) {
        api.data.recordArrayToObjects = (records, includeColumnUIDs) => {
            return (records||[]).map(record => api.data.columnArrayToObjects(record, includeColumnUIDs));
        };
    }

    if (!api.data.groupItemArrayToObjects) {
        api.data.groupItemArrayToObjects = (groupItems, includeColumnUIDs) => {
            return (groupItems||[]).sort(api.data.groupItemsSorter).map(groupItem => ({
                [`${groupItem.value.property.Definition.Name}`]: groupItem.value.value,
                records: groupItem.children && groupItem.children.length ?
                         api.data.groupItemArrayToObjects(groupItem.children, includeColumnUIDs) :
                         api.data.recordArrayToObjects(groupItem.getAllChildRecords(), includeColumnUIDs),
            }));
        };
    }

    if (!api.data.formToObjects) {
        api.data.formToObjects = ({
            form = api.ui.getDefaultForm(),
            includeHiddenColumns = false,
            grouped = true,
            hierarchical = false,
        }) => {
            // Make sure we've got a raw form (may be an API reference)
            if (form instanceof api.factory.View) {
                form = form.raw;
            }
            const gridController = form.gridController;
            const includeColumnUIDs =  gridController.mvcColumns.map(gridColumn => {
                if (includeHiddenColumns || !gridColumn.columnProperty.IsHidden) {
                    return gridColumn.property.UID;
                }
            }).filter(gridColumn => Boolean(gridColumn));
            if (hierarchical) {
                return api.data.groupItemArrayToObjects(gridController.groupTree, includeColumnUIDs);
            } else if (grouped) {
                //  The boundArray property only includes visible rows, so we need to expand all groups first
                gridController.expandCollapseAllGroups(true);
                return api.data.recordArrayToObjects(gridController.boundArray.objs, includeColumnUIDs);
            } else {
                //  The getSortedRecords method only includes visible rows, so we need to expand all groups first
                gridController.expandCollapseAllGroups(true);
                return api.data.recordArrayToObjects(gridController.getSortedRecords().map(record => record.gridValues.Values), includeColumnUIDs);
            }
        };
    }

    if (!api.data.groupItemsSorter) {
        api.data.groupItemsSorter = (a, b) => {
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
        api.data.generateGridValuesMap = (formOrGridRecord) => {
            let gridRecord;
            if (formOrGridRecord instanceof app.dv.entities.GridRecord) gridRecord = formOrGridRecord;
            else if (formOrGridRecord != null && formOrGridRecord.createRecord) gridRecord = formOrGridRecord.createRecord("");
            else gridRecord = app.dv.mvc.createRecord(formOrGridRecord, "");

            const gridValuesMap = {};
            gridRecord.gridValues.Values.forEach(gridValue => {
                gridValuesMap[`${gridValue.property.Name}`] = gridValue;
            });
            return gridValuesMap;
        };
    }

    if (!api.data.objectToGridRecord) {
        api.data.objectToGridRecord = (form, object, gridRecord) => {
            if (gridRecord == null) {
                if (form.createRecord) gridRecord = form.createRecord("");
                else gridRecord = app.dv.mvc.createRecord(form, "");
            }
            const gridValuesMap = api.data.generateGridValuesMap(gridRecord);
            for (let key in object) {
                const gridValue = gridValuesMap[key];
                if (gridValue) {
                    let valueToSet = object[key];
                    if (gridValue.dynamicValue.DataType === app.dv.types.PropertyDataType.DateTime) {
                        valueToSet = new Date(valueToSet);
                        if (!valueToSet.isValid()) {
                            valueToSet = null;
                        }
                    }
                    gridValue.setValue(valueToSet);
                }
            };
            return gridRecord;
        }
    }

    if (!api.data.getExpressionValue) {
        api.data.getExpressionValue = (gridValue) => {
            const gridRecord = gridValue.parentRecord;
            const form = gridRecord.parentMVC;
            const property = gridValue.property;
            const formula = property.Definition.Formula;
            if (formula) {
                const viewID = form.drivingView.ViewID;
                const expression = new app.dv.helpers.expression.create(property, viewID, formula, null, form);
                return expression.evaluate(viewID, gridRecord);
            } else {
                return null;
            }
        }
    }

    if (!api.data.setBinaryValue) {
        api.data.setBinaryValue = (gridValue, base64Value, fileName, fileDate = new Date(), fileHash = "") => {
            if (gridValue instanceof app.dv.entities.GridValue) {
                const valueMetadata = [
                    { Key: "FileSize", Value: base64Value.length },
                    { Key: "FileName", Value: fileName },
                    { Key: "FileDate", Value: fileDate },
                    { Key: "FileHash", Value: fileHash },
                ];
                app.dv.mvc.gridRecord.gridValue.setBinaryValue(gridValue, JSON.stringify(valueMetadata));
                gridValue.dynamicValueEdit.Value = base64Value;
                gridValue.dynamicValueEdit._State = app.dv.types.EntityStates.Modified;
                gridValue.updateUI();
                const mvc = gridValue && gridValue.parentRecord && gridValue.parentRecord.parentMVC;
                const gridController = mvc && mvc.gridController;
                if (gridController) {
                    gridController.dataLoaded(mvc);
                    gridController.uiGrid.vrp();
                }
            } else {
                if (api._debugMode) console.log(`${gridValue} is not a GridValue.`);
            }
        };
    }

    if (!api.data.getBinaryValueAsync) {
        api.data.getBinaryValueAsync = async (gridValue) => {
            if (gridValue instanceof app.dv.entities.GridValue) {
                const splitFileName = app.dv.mvc.gridRecord.gridValue.getBinaryFilename(gridValue).split(".");
                const imageType = splitFileName[splitFileName.length - 1];
                const record = await app.dv.services.call(app.dv.services.endpoints.getByID, {
                    TypeValueID: gridValue.dynamicValue.TypeValueID,
                    ForType: app.dv.types.PropertyDataType.Binary
                });
                return app.dv.tools.arrayBufferToBase64(record.Value.data);
            } else {
                if (api._debugMode) console.log(`${gridValue} is not a GridValue.`);
            }
        };
    }

    return api.data;
})();
