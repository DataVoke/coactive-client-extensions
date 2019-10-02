"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _apiUtils;

var _api2 = _interopRequireDefault(require("./_api"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

// Coactive framework dependencies (will already be present when running in context of a Coactive environment)
function _apiUtils(context) {
  (0, _api2["default"])(context);
  if (!context.api.utils) context.api.utils = {
    npmProviderUrl: "https://unpkg.com/",
    supportsES6: function supportsES6() {
      try {
        new Function("(a = 0) => a");
        return true;
      } catch (err) {
        return false;
      }
    },
    loadResource: function loadResource(url, resourceType, callback, rawContent) {
      var resourceTypeLC = resourceType.toLowerCase();
      var elementSourceProperty = null; // Function to create a new element of the specified kind

      var createElement = function createElement(elementKind, type) {
        var element = document.createElement(elementKind);
        element.type = type; // Generate what should be a unique ID based on the URL/raw content

        element.id = context.btoa(url) || api.utils.generateHash(rawContent);
        return element;
      }; // Create an element of the appropriate kind based on the resource type specified (JS or CSS)


      var newElement = null;

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
        if (rawContent) newElement.innerHTML = rawContent; // Prevent duplicate loading of the same resource and type

        var foundElement = _toConsumableArray(document.getElementsByTagName(newElement.tagName)).find(function (element) {
          return element.type === newElement.type && element[elementSourceProperty] === url;
        });

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
            context.setTimeout(function () {
              api.utils.runFunction(callback);
            });
          } // Add the new element to the document


          document.head.appendChild(newElement);
        }
      }

      return newElement;
    },
    generateHash: function generateHash(value) {
      if (typeof value !== "string") {
        value = value.toString();
      }

      var hash = 5381;
      var i = value.length;

      while (i) {
        hash = hash * 33 ^ value.charCodeAt(--i);
      }
      /* JavaScript does bitwise operations (like XOR, above) on 32-bit signed
      * integers. Since we want the results to be always positive, convert the
      * signed int to an unsigned by doing an unsigned bitshift. */


      return hash >>> 0;
    },
    runFunction: function runFunction(fn, thisArg, params) {
      if (fn && typeof fn === "function") {
        return fn.apply(thisArg || context, params);
      }
    }
  };
}
//# sourceMappingURL=_apiUtils.js.map