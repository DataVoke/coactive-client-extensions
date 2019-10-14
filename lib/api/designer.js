"use strict";

/**
 * Extends the api.designer namespace with additional helper functions.
 * Dependencies:
 *    api.loadExtension
 *    api.bindingsRegistry
 *    api.utils.loadResource
 *    api.utils.runFunction
 */
api.loadExtension("api.designer", function () {
  require(["".concat(api.utils.npmProviderUrl || "https://unpkg.com/", "/jsondiffpatch")], function () {
    api.designer.diff = function () {
      return app.dv.cache.views.allOriginalViews.Values.map(function (original) {
        var modified = app.dv.cache.views.allViews.getVal(original.ViewID);
        return {
          name: original.Name,
          type: "Form",
          original: original,
          modified: modified,
          diff: window.jsondiffpatch.diff(original, modified)
        };
      });
    };
  });

  api.designer.getActiveJavascriptEditor = function () {
    return Array.from(app.dv.userWorkspace.windowManager._windows.values()).find(function (w) {
      return w.constructor.name === "JavascriptEditor" || w.constructor.name === "ExpressionEditor" || w.constructor.name === "CodeActionEditorWindow" || w.constructor.name === "CodeEndpointEditorWindow";
    });
  };

  api.designer.search = function (searchTerm) {
    var matches = [];
    app.dv.cache.views.allViews.Values.forEach(function (view) {
      view.Definition.ViewMacros.forEach(function (task) {
        task.Actions.forEach(function (action) {
          if (action.Settings) {
            Object.keys(action.Settings).forEach(function (key) {
              if (action.Settings[key] && action.Settings[key].contains && action.Settings[key].contains(searchTerm)) {
                matches.push({
                  view: view,
                  task: task,
                  action: action,
                  key: key
                });
              }
            });
          }
        });
      });
    });
    return matches;
  };

  api.designer.reset = function () {
    // Clear bindings registry
    api.bindingsRegistry.bindings.clear(); // Close all open forms

    api.openForms.allOpenForms().forEach(function (form) {
      if (form && form.raw && form.raw.window) {
        api.utils.runFunction(form.raw.window.closeWindow, form.raw.window);
      }
    }); // Run startup sequence

    app.dv.cache.session.startupView();
  };
});
//# sourceMappingURL=designer.js.map