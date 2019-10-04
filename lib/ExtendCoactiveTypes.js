"use strict";

/**
 * Custom Action: Extend Coactive Types API
 * Extends the API of native Coactive types with additional helper functions.
 * Dependencies:
 *    api.loadExtension
 *    api.data
 *    api.utils
 *    lodash (optional, for .find and .filter methods on View type)
 */
api.loadExtension("api", function () {
  // Extend View with recordsToObjects function (includes keys for both Title and API Name and option to attach the underlying raw Coactive records)
  if (!api.factory.View.prototype.recordsToObjects) {
    api.factory.View.prototype.recordsToObjects = function (attachRecord) {
      return api.data.recordsToObjects(this, attachRecord);
    };
  } // Extend View's data with lodash find function


  if (!api.factory.View.prototype.find) {
    api.factory.View.prototype.find = function (lookFor) {
      if (_ && api.utils.isFunction(_.find)) {
        return _.find(this.recordsToObjects(), lookFor);
      } else {
        console.warn("Lodash is not loaded. Be sure to execute a Load Resource action configured to load the 'lodash' package as a 'npm' resource.");
      }
    };
  } // Extend View's data with lodash filter function


  if (!api.factory.View.prototype.filter) {
    api.factory.View.prototype.filter = function (lookFor) {
      if (_ && api.utils.isFunction(_.filter)) {
        return _.filter(this.recordsToObjects(), lookFor);
      } else {
        console.warn("Lodash is not loaded. Be sure to execute a Load Resource action configured to load the 'lodash' package as a 'npm' resource.");
      }
    };
  } // Extend View with close function to close its window


  if (!api.factory.View.prototype.close) {
    api.factory.View.prototype.close = function () {
      if (this.raw && this.raw.window) this.raw.window.closeWindow();else throw new Error("No raw window was found to close.");
    };
  } // Extend View with recordsAsObjects function to convert its Coactive records to JS objects (keyed only by Title)


  if (!api.factory.View.prototype.recordsAsObjects) {
    api.factory.View.prototype.recordsAsObjects = function () {
      return api.data.formToObjects({
        form: this,
        includeHiddenColumns: false,
        grouped: false,
        hierarchical: false
      });
    };
  } // Extend View with recordsAsObjects function to convert its Coactive records to JS objects, including grouping (keyed only by Title)


  if (!api.factory.View.prototype.recordsAsObjectsGrouped) {
    api.factory.View.prototype.recordsAsObjectsGrouped = function () {
      return api.data.formToObjects({
        form: this,
        includeHiddenColumns: false,
        grouped: true,
        hierarchical: false
      });
    };
  } // Extend View with recordsAsObjects function to convert its Coactive records to JS objects, including hierarchical grouping (keyed only by Title)


  if (!api.factory.View.prototype.recordsAsObjectsHierarchical) {
    api.factory.View.prototype.recordsAsObjectsHierarchical = function () {
      return api.data.formToObjects({
        form: this,
        includeHiddenColumns: false,
        grouped: true,
        hierarchical: true
      });
    };
  } // Extend Record with asObject function to convert its Coactive values to JS object keys/values


  if (!api.factory.Record.prototype.asObject) {
    api.factory.Record.prototype.asObject = function () {
      return api.data.recordToObject(this);
    };
  } // Extend dictionary with asObject function for easier consumption of Values


  if (!app.dv.tools.dictionary.prototype.asObject) {
    app.dv.tools.dictionary.prototype.asObject = function () {
      var valuesAsObject = {};
      var itemCount = 0;
      this.forEach(function (item) {
        var namedItem = item.property || item.drivingView || item;
        var valueItem = item.property ? item.value : item;
        var itemAdded = false;

        if (namedItem.Name) {
          valuesAsObject[namedItem.Name] = valueItem;
          itemAdded = true;
        }

        if (namedItem.Definition && namedItem.Definition.Name) {
          valuesAsObject[namedItem.Definition.Name] = valueItem;
          itemAdded = true;
        }

        if (!itemAdded) {
          valuesAsObject[itemCount] = valueItem;
        }

        itemCount++;
      });
      return valuesAsObject;
    };
  }
});
//# sourceMappingURL=ExtendCoactiveTypes.js.map