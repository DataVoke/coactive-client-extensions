export default (() => {
    /**
     * Extends the api.designer namespace with additional helper functions.
     * Dependencies:
     *    api.loadExtension
     *    api.bindingsRegistry
     *    api.utils.loadResource
     *    api.utils.runFunction
     */
    api.loadExtension("api.designer", () => {
        api.utils.loadResource("jsondiffpatch", "npm", () => {
            api.designer.diff = () => {
                return app.dv.cache.views.allOriginalViews.Values.map(original => {
                    const modified = app.dv.cache.views.allViews.getVal(original.ViewID);
                    return {
                        name: original.Name,
                        type: "Form",
                        original,
                        modified,
                        diff: window.jsondiffpatch.diff(original,
                                                        modified)
                    };
                });
            }
        });

        api.designer.getActiveJavascriptEditor = () => {
            return Array.from(app.dv.userWorkspace.windowManager._windows.values()).find(
                w =>
                    w.constructor.name === "JavascriptEditor" ||
                    w.constructor.name === "ExpressionEditor" ||
                    w.constructor.name === "CodeActionEditorWindow" ||
                    w.constructor.name === "CodeEndpointEditorWindow");
        };

        api.designer.search = (searchTerm) => {
            const matches = [];
            app.dv.cache.views.allViews.Values.forEach(view => {
                view.Definition.ViewMacros.forEach(task => {
                    task.Actions.forEach(action => {
                        if (action.Settings) {
                            Object.keys(action.Settings).forEach(key => {
                                if (action.Settings[key] && action.Settings[key].contains && action.Settings[key].contains(searchTerm)) {
                                    matches.push({
                                        view,
                                        task,
                                        action,
                                        key,
                                    });
                                }
                            });
                        }
                    });
                });
            });
            return matches;
        };

        api.designer.reset = () => {
            // Clear bindings registry
            api.bindingsRegistry.bindings.clear();
            // Close all open forms
            api.openForms.allOpenForms().forEach(form => {
                if (form && form.raw && form.raw.window) {
                    api.utils.runFunction(form.raw.window.closeWindow, form.raw.window);
                }
            });
            // Run startup sequence
            app.dv.cache.session.startupView();
        };
    });
})();
