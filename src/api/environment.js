/**
 * Custom Action: Extend api.environment
 * Extends the api.environment namespace with additional helper functions.
 * Dependencies:
 *    api.loadExtension
 */
// This is a quick way to remove/clear variables with a certain prefix.
/*Example
    Variables in the dictionary
    order.id
    order.callingForm
    orderItem.id
    quote.id
    quote.callingForm

    Executing api.environment.clearVariablesWithPrefix("order.") will clear all variables that start with "order."
    Executing api.environment.clearVariablesWithPrefix("order.", true) will remove all variables that start with "order."
*/
// Clears/removes all variables that start with the the prefix
api.loadExtension("api.environment", () => {
    if (!api.environment.clearVariablesWithPrefix) {
        api.environment.clearVariablesWithPrefix = (prefix, removeVariable = false) => {
            if (api.environment && api.environment.variables) {
                for (let key in api.environment.variables) {
                    if (key.startsWith(prefix)) {
                        if (removeVariable) {
                            api.environment.removeVariable(key);
                        } else {
                            api.environment.setVariableValue(key, "");
                        }
                    }
                }
            }
        };
    }
});
