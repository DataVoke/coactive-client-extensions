import _api from './_api';

// Coactive framework dependencies (will already be present when running in context of a Coactive environment)
export default function _apiUtils(context) {
    _api(context);

    if (!context.api.utils) context.api.utils = {
        npmProviderUrl: "https://unpkg.com/",
        supportsES6: () => {
            try {
                new Function("(a = 0) => a");
                return true;
            } catch (err) {
                return false;
            }
        },
        loadResource: (url, resourceType, callback, rawContent) => {
            const resourceTypeLC = resourceType.toLowerCase();
            let elementSourceProperty = null;
            // Function to create a new element of the specified kind
            const createElement = (elementKind, type) => {
                const element = document.createElement(elementKind);
                element.type = type;
                // Generate what should be a unique ID based on the URL/raw content
                element.id = context.btoa(url) || api.utils.generateHash(rawContent);
                return element;
            };

            // Create an element of the appropriate kind based on the resource type specified (JS or CSS)
            let newElement = null;
            switch (true) {
                case resourceTypeLC.indexOf("javascript") > -1 || resourceTypeLC.indexOf("js") > -1:
                    newElement = createElement("script", "text/javascript");
                    if (url) newElement.src = url;
                    elementSourceProperty = "src";
                    break;

                case resourceTypeLC.indexOf("npm") > -1:
                    newElement = createElement("script", "text/javascript");
                    newElement.src = "" + (url.startsWith("http://") || url.startsWith("https://") ? "" : api.utils.npmProviderUrl) + url;
                    elementSourceProperty = "src";
                    break;

                case resourceTypeLC.indexOf("stylesheet") > -1 || resourceTypeLC.indexOf("css") > -1:
                    if (url) {
                        newElement = createElement("link", "text/css");
                        newElement.href = url;
                        newElement.rel = "stylesheet";
                        elementSourceProperty = "href";
                    } else if (rawContent) {
                        newElement = createElement("style", "text/css");
                        elementSourceProperty = "xxx-not-used";
                    }
                    break;

                default:
                    console.log("WARNING: resourceType [" + resourceType + "] not supported for api.utils.loadResource.");
                    break;
            }

            if (newElement) {
                // Inject raw content if any provided
                if (rawContent) newElement.innerHTML = rawContent;
                // Prevent duplicate loading of the same resource and type
                const foundElement = [...document.getElementsByTagName(newElement.tagName)]
                    .find(element => element.type === newElement.type && element[elementSourceProperty] === url);
                if (foundElement) {
                    // Just call back if such an element was already loaded
                    newElement = foundElement;
                    api.utils.runFunction(callback);
                } else {
                    // Set up appropriate event handler to call back when the element has been loaded
                    if (newElement.readyState) {
                        //IE
                        newElement.onreadystatechange = function () {
                            if (newElement.readyState === "loaded" || newElement.readyState === "complete") {
                                newElement.onreadystatechange = null;
                                api.utils.runFunction(callback);
                            }
                        };
                    } else if (url) {
                        //Others
                        newElement.onload = function () {
                            api.utils.runFunction(callback);
                        };
                    } else if (rawContent) {
                        // Only raw content was provided, so just wait a tick and call back
                        context.setTimeout(function() {
                            api.utils.runFunction(callback);
                        });
                    }

                    // Add the new element to the document
                    document.head.appendChild(newElement);
                }
            }
            return newElement;
        },
        generateHash: (value) => {
            if (typeof value !== "string") {
                value = value.toString();
            }
            let hash = 5381;
            let i = value.length;
            while(i) {
                hash = (hash * 33) ^ value.charCodeAt(--i);
            }
            /* JavaScript does bitwise operations (like XOR, above) on 32-bit signed
           * integers. Since we want the results to be always positive, convert the
           * signed int to an unsigned by doing an unsigned bitshift. */
            return hash >>> 0;
        },
        runFunction: (fn, thisArg, params) => {
            if (fn && typeof fn === "function") {
                return fn.apply(thisArg || context, params);
            }
        },
    }
}
