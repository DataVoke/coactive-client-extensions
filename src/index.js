(
    // NOTE: All code herein must be run before other extension modules as they depend on it.
    // NOTE: All code herein should be ES5-compatible. Other extensions will use this module to transpile back to ES5 when necessary, so they may use ES6+

    /**
     * Custom Action: api.loadExtension
     * Create an extension loader that can be used to extend the app's client-side API.
     */
    // These are dependencies of babel-standalone
    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };
    function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } };
    function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; };
    function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); };
    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); };
    function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

    if (!api.transformJavaScript) {
        api.transformJavaScript = function (code, forceTransform) {
            if (code) {
                // Use Babel to transform JavaScript for older browsers, if available
                if ((api._supportLegacyBrowser || forceTransform) && Babel) {
                    // Coerce the code to a string in case it's a function and then transform it
                    if (typeof code !== "string") {
                        code = code.toString();
                    }
                    return Babel.transform(code, { presets: ["react", "es2015", "stage-0"], parserOpts: { allowReturnOutsideFunction: true } }).code;
                } else {
                    return code;
                }
            } else {
                return null;
            }
        };
    }

    if (!api.evalTransformedJavaScript) {
        api.evalTransformedJavaScript = function (code, forceTransform) {
            var transformed = api.transformJavaScript(code, forceTransform);
            if (transformed) {
                if (typeof transformed === "string") {
                    return eval(transformed);
                } else if (typeof transformed === "function") {
                    // If we still have a function, just execute it
                    return transformed();
                }
            }
        };
    }

    var overrideExtensionsRegisterAction = function () {
        // Override the original extensions.registerAction function to transform code for older browsers
        if (!api._originalRegisterAction) {
            api._originalRegisterAction = app.dv.cache.extensions.registerAction;
            app.dv.cache.extensions.registerAction = function (action) {
                // Call the original function to register the actions
                api._originalRegisterAction(action);
                // Replace each code block with its transformed version and evaluate it so the transformed code executes when called
                if (action.Definition.CreateSettingsPanel) {
                    action.Definition.CreateSettingsPanel = api.evalTransformedJavaScript("(" + action.Definition.CreateSettingsPanel + ")");
                }
                if (action.Definition.Execute) {
                    action.Definition.Execute = api.evalTransformedJavaScript("(" + action.Definition.Execute + ")");
                }
                if (action.Definition.GetFriendlyName) {
                    action.Definition.GetFriendlyName = api.evalTransformedJavaScript("(" + action.Definition.GetFriendlyName + ")");
                }
                if (action.Definition.Settings) {
                    action.Definition.Settings = api.evalTransformedJavaScript("(" + action.Definition.Settings + ")");
                }
            };
        }
    };

    var overrideRunJavaScriptActionExecute = function () {
        // Override the original action Execute function to transform code for older browsers
        if (!api._originalRunJavaScriptActionExecute) {
            api._originalRunJavaScriptActionExecute = app.dv.actionLibrary.actionStores.dvCore.RunJavaScript.Definition.Execute;
            app.dv.actionLibrary.actionStores.dvCore.RunJavaScript.Definition.Execute = function (options, callback) {
                // Transform the JavaScript and call original Execute function
                options.action.Settings.JsText = api.transformJavaScript(options.action.Settings.JsText);
                api._originalRunJavaScriptActionExecute(options, callback);
            };
        }
    };

    if (!api.loadExtension) {
        // Create an extension loader that can be used to extend the app's client-side API
        api.loadExtension = function (namespace, loader) {
            // Create the namespace if it doesn't exist
            if (typeof namespace === "string" && !eval(namespace)) {
                eval(namespace + " = {}");
            }

            // If we have a loader, execute it
            if (loader) {
                if (api.evalTransformedJavaScript) {
                    // Transform JavaScript for older browsers if required and available
                    api.evalTransformedJavaScript("(" + loader + ")();");
                } else {
                    loader();
                }
            }
        };
    }

    // Determine if we need to support a legacy browser
    // (may be forced by setting api._supportLegacyBrowser to true; otherwise detected here)
    if (api._supportLegacyBrowser !== true && api.utils.supportsES6()) {
        api._supportLegacyBrowser = false;
    } else {
        api._supportLegacyBrowser = true;
        // Load Babel to transform JavaScript for older browsers
        api.utils.loadResource("babel-standalone@6.26.0", "npm", function() {
            // Re-register all custom actions so they use transformed JavaScript
            app.dv.cache.loadExtensionCache(app.dv.cache.extensions.allActions.Values);
            executionHelper.resolve();
        });
        // We need to transform ES6 JavaScript to ES5
        overrideExtensionsRegisterAction();
        overrideRunJavaScriptActionExecute();
    }
)();
