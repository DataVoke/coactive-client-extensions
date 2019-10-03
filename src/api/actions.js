/**
 * Custom Action: Extend api.actions
 * Extends the api.actions namespace with additional helper functions.
 * Dependencies:
 *    api.loadExtension
 *    api.utils.getOpenForm
 *    api.utils.openFormAsync
 */
api.loadExtension("api.actions", () => {
    if (!api.actions || Object.entries(api.actions).length === 0) {
        // API shortcut to built-in and custom action library stores
        api.actions = app.dv.actionLibrary.actionStores;
    }

    if (!api.actions.execute) {
        // API shortcut to action library execution command
        api.actions.execute = app.dv.actionLibrary.inlineExe;
    }

    if (!api.actions.FormRequestBehaviorModes) {
        api.actions.FormRequestBehaviorModes = {
            Normal: app.dv.types.OPEN_MODES.NORMAL,
            Hidden: app.dv.types.OPEN_MODES.HIDDEN,
            Modal: app.dv.types.OPEN_MODES.MODAL,
            Maximized: app.dv.types.OPEN_MODES.MAXIMIZED,
            Fail: -1,
        };
    }

    if (!api.actions.runTaskAsync) {
        /**
         * Runs a form's task.
         * @param {Object} formID                                            A numeric ID, UID or linker ({ UID: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", Type: "View" }) that identifies the form.
         * @param {number} taskID                                            A numeric ID that identifies the task.
         * @param {number} [mode=api.actions.FormRequestBehavior.Normal]     One of the [api.actions.FormRequestBehaviorModes] to use when opening the form.
         * @returns {Promise}                                                A promise that resolves after the task is sucessfully executed.
         */
        api.actions.runTaskAsync = (formID, taskID, mode = api.actions.FormRequestBehaviorModes.Normal) => {
            return new Promise((resolve, reject) => {
                // Function to run the task after we have the form
                const runTask = form => {
                    app.dv.actionLibrary.inlineExe(form, app.dv.actionLibrary.actionStores.dvCore.CallActionChain, { viewID: formID, macroID: taskID }, result => {
                        if (result.success) {
                            resolve();
                        } else {
                            reject(`The task (ID: ${taskID}) on form (ID: ${formID}) could not be executed.${result.actionMessage ? " Action Message: " + result.actionMessage : ""}`);
                        }
                    });
                };

                // Assume the form is already open, and find it
                const form = api.utils.getOpenForm(formID);
                if (form) {
                    // We have a form, so run the task
                    runTask(form);
                } else {
                    // If the form was not already open, attempt to open it unless requested to fail
                    if (mode !== api.actions.FormRequestBehaviorModes.Fail) {
                        api.utils.openFormAsync(formID, mode).then(f => {
                            runTask(f);
                        });
                    } else {
                        reject(`The form (ID: ${formID}) was not already open, and it could not be opened, so the task could not be run.`);
                    }
                }
            });
        };
    }

    if (!api.actions.runTask) {
        /**
         * Runs a form's task. Does not wait for asynchronous execution of task. Use api.actions.runTaskAsync to await.
         * @param {Object} formID                                            A numeric ID, UID or linker ({ UID: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", Type: "View" }) that identifies the form.
         * @param {number} taskID                                            A numeric ID that identifies the task.
         * @param {number} [mode=api.actions.FormRequestBehavior.Normal]     One of the [api.actions.FormRequestBehaviorModes] to use when opening the form.
         */
        api.actions.runTask = (formID, taskID, mode = api.actions.FormRequestBehaviorModes.Normal) => {
            api.actions.runTaskAsync(formID, taskID, mode);
        }
    }

    // TODO: Add pointer to api.actions.dvCore.[ActionName].Definition.Settings on root action for easy access in context of each action.
});
