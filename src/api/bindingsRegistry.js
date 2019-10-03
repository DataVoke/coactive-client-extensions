/**
 * Custom Action: Extend api.bindingsRegistry
 * Creates a bindingsRegistry namespace off of api used to manage custom client-side bindings.
 * This includes control events and the custom actions Register Event, Deregister Event and Fire Event.
 * Dependencies:
 *    api.loadExtension
 */
// Create a registry to manage custom client-side bindings
api.loadExtension("api.bindingsRegistry", () => {
    if (!api.bindingsRegistry.bindings) {
        api.bindingsRegistry.bindings = new Map();
    }

    if (!api.bindingsRegistry.register) {
        /**
         * Registers an item and executes its onRegister function. If an item with the key already exists,
         * the previously registered item's onDeregister function will be executed first.
         * @param  {object}   key                 A unique key to track the item.
         * @param  {function} onRegister          The function to be called upon registration.
         * @param  {function} onDeregister        The optional function that will be called upon deregistration.
         * @param  {function} onExecute           The optional function that can be called upon demand.
         * @param  {integer}  executionInterval   Then optional interval in milliseconds at which the binding should be executed.
         * @param  {boolean}  deregisterOnExecute If true, the item's onDeregister function will be called immediately following a call to onExecute.
         * @param  {any}      registrationFormID  If present, the ID of the form that is registering the binding will be stored on the item.
         * @return {object}                       The registered item, including any registrationResult returned by the onRegister function.
         */
        api.bindingsRegistry.register = ({ key, onRegister, onDeregister, onExecute, executionInterval, deregisterOnExecute, registrationFormID }) => {
            const bindings = api.bindingsRegistry.bindings;
            // Look for the item in the registry
            let registryItem = bindings.get(key);
            if (registryItem) {
                // Automatically deregister previous registration if the item is found
                api.bindingsRegistry.deregister(key);
            }
            registryItem = {
                onRegister,
                onDeregister,
                onExecute,
                deregisterOnExecute,
                registrationFormID,
                registrationResult: api.utils.runFunction(onRegister, null, [ registryItem ]),
            };
            // Add the binding to the registry and return it
            bindings.set(key, registryItem);
            // Start time-based execution if interval present
            executionInterval = Number.parseInt(executionInterval);
            if (executionInterval) {
                registryItem.executionIntervalHandle = window.setInterval(() => { return api.bindingsRegistry.execute({ key }); }, executionInterval);
            }
            return registryItem;
        };
    }

    if (!api.bindingsRegistry.deregister) {
        /**
         * Deregisters an item, calling any onDeregister function that was passed when the item was registered.
         * @param  {object} key    The key to the item that was previously registered.
         * @return {object}        The value returned by the executed deregistration function.
         */
        api.bindingsRegistry.deregister = key => {
            const bindings = api.bindingsRegistry.bindings;
            let deregistrationResult = null;
            // Look for the item in the registry
            const registryItem = bindings.get(key);
            if (registryItem) {
                // Run any deregistration and remove it from the registry
                deregistrationResult = api.utils.runFunction(registryItem.onDeregister, null, [ registryItem ]);
                // Stop interval-based execution if necessary
                if (registryItem.executionIntervalHandle) {
                    window.clearInterval(registryItem.executionIntervalHandle);
                    registryItem.executionIntervalHandle = null;
                }
                bindings.delete(key);
                //console.log(`binding deleted '${key}'`);
            } else {
                //console.log(`No binding has been registered with the key '${key}'.`);
            }
            return deregistrationResult;
        };
    }

    if (!api.bindingsRegistry.execute) {
        /**
         * Executes a registered item, optionally deregistering it if specified to do so.
         * @param  {object}  key                The key to the item that was previously registered.
         * @param  {boolean} deregister         If true, the item's onDeregister function will be called after execution.
         * @param  {any}     executionFormID    If present, the ID of the form that is executing the binding will be temporarily stored on the item.
         * @return {object}                     The value returned by the executed function, if any; otherwise, any deregistration function return value.
         */
        api.bindingsRegistry.execute = ({ key, executionFormID, deregister, passedValue }) => {
            const bindings = api.bindingsRegistry.bindings;
            let executionResult = null;
            let deregistrationResult = null;
            // Look for the item in the registry
            const registryItem = bindings.get(key);
            if (registryItem) {
                // Store the executor
                registryItem.executionFormID = executionFormID;
                // Make passed value available to listeners
                registryItem.passedValue = passedValue;
                // Run execution function
                executionResult = api.utils.runFunction(registryItem.onExecute, null, [ registryItem ]);
                // Save execution result in case listeners need it
                registryItem.executionResult = executionResult;
                // Deregister if binding item flag or override parameter indicates to do so
                if (registryItem.deregisterOnExecute || deregister) {
                    // If we weren't eplicitly asked to deregister in this call and a passedValue was provided,
                    // set a flag that indicates to delay deregistration until passedValue is read

                    if (!deregister && passedValue !== undefined && registryItem.executedPassedValue !== true) {
                        registryItem.delayDeregistration = true;
                    } else  {
                        deregistrationResult = api.bindingsRegistry.deregister(key);
                    }
                }
            } else {
                //console.log(`No binding has been registered with the key '${key}'.`);
            }
            // Return execution result, if any; otherwise, return any deregistration result
            return executionResult || deregistrationResult;
        };
    }

    if (!api.bindingsRegistry.getExecutionResult) {
        api.bindingsRegistry.getExecutionResult = (key) => {
            let executionResult = null;
            const bindings = api.bindingsRegistry.bindings;
            // Look for the item in the registry
            const registryItem = bindings.get(key);
            if (registryItem) {
                executionResult = registryItem.executionResult;
            } else {
                //console.log(`No binding has been registered with the key '${key}'.`);
            }
            return executionResult;
        }
    }

    if (!api.bindingsRegistry.getPassedValue) {
        api.bindingsRegistry.getPassedValue = (key) => {
            let passedValue = null;
            let deregistrationResult = null;
            const bindings = api.bindingsRegistry.bindings;
            // Look for the item in the registry
            const registryItem = bindings.get(key);
            if (registryItem) {
                passedValue = registryItem.passedValue;
                registryItem.executedPassedValue = true;
                // If the flag was set to delay deregistration until after passedValue has been read,
                // we can now safely deregister the registry item since we've been asked for the passedValue
                if (registryItem.delayDeregistration && registryItem.deregisterOnExecute) {
                    deregistrationResult = api.bindingsRegistry.deregister(key);
                }
            } else {
                //console.log(`No binding has been registered with the key '${key}'.`);
            }
            return passedValue === false ? false : passedValue || deregistrationResult;
        }
    }
});
