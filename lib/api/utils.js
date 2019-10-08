"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/**
 * Extends the api.utils namespace with additional helper functions.
 * Dependencies:
 *    api.loadExtension
 */
api.loadExtension("api.utils", function () {
  if (!api.utils.svgToDataUrl) {
    api.utils.svgToDataUrl = function (svgXmlString, color) {
      var opacity = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;
      // if (!color) {
      //     color = (api.runtime && api.runtime.colors && (api.runtime.colors.button_fill || api.runtime.colors.primary_dark)) || '';
      // }
      svgXmlString = svgXmlString.replace(/fill\-opacity=""/g, "fill-opacity=\"".concat(opacity, "\"")).replace(/fill=""/g, "fill=\"".concat(color, "\""));
      var encoded = window.encodeURIComponent(svgXmlString).replace(/'/g, '%27').replace(/"/g, '%22');
      return "data:image/svg+xml,".concat(encoded);
    };
  }

  if (!api.utils.getWebResourceAsync) {
    /**
     * Proxies a web resource request via the application service.
     * @param  [string]           url        The URL to the resource.
     * @param  [string="utf8"]    encoding   Optional encoding (defaults to utf8).
     * @return [Promise(object)]             Returns a promise that resolves to an object with { contentType, dataResponse }.
     **/
    api.utils.getWebResourceAsync = function (url) {
      var encoding = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "utf8";
      return app.dv.services.call({
        svc: "Support",
        fn: "ProxyWebResource"
      }, {
        url: url,
        encoding: encoding
      });
    };
  }

  if (!api.utils.callEndpointAsync) {
    /**
     * Calls an endpoint.
     * @param  [string]           endpoint   The endpoint name.
     * @param  [object]           args       Object containing arguments to be passed to endpoint.
     * @param  [string="Custom"]  service    The service name (defaults to "Custom").
     * @return [Promise(object)]             Returns a promise that resolves to an object returned by the endpoint.
     **/
    api.utils.callEndpointAsync = function (endpoint, args) {
      var service = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "Custom";
      return new Promise(function (resolve, reject) {
        app.connection.call(service, endpoint, args, function (result, error) {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        });
      });
    };
  }

  if (!api.utils.getAttachmentUri) {
    /**
     * Gets a URI to the specified attachment property on the specified (or currently selected) record.
     * @param  [string]                       attachmentPropertyUID                             The unique ID of the attachment property.
     * @param  [datavoke.entities.gridRecord] record[api.openForms.active.selectedRecord.raw]   The record with the attachment (optional); defaults to the currently selected record.
     * @return [string]                                                                         The URI of the attachment, if any; null if no attachment exists for the record.
     */
    api.utils.getAttachmentUri = function (attachmentPropertyUID) {
      var record = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : (api.openForms.active || api.openForms.allOpenForms().last()).selectedRecord.raw;
      return record.gridValues.getVal({
        UID: attachmentPropertyUID
      }).documentURI;
    };
  }

  if (!api.utils.toLinker) {
    /**
     * Constructs a linker object  if object is not already one.
     * @param    {string|object}        id    String identifier or a linker object.
     * @param    {string="Property"}    type  Entity type to identify ("Property", "View", etc.).
     * @return   {object}               { Type(string), UID(GUID) }
     */
    api.utils.toLinker = function (id) {
      var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "Property";

      if (typeof id === "string") {
        return {
          Type: type,
          UID: id
        };
      } else {
        // TODO: More validation of the object
        return id;
      }
    };
  }

  if (!api.utils.isFunction) {
    /**
     * Determines whether an object is a function.
     * @param    {object}    item    Item to test.
     * @return   {boolean}   True if item is a function; otherwise, false.
     */
    api.utils.isFunction = function (item) {
      return item && typeof item === "function";
    };
  }

  if (!api.utils.smartSort) {
    api.utils.smartSort = function (list, matchTerm) {
      var values = list.map(function (item, index) {
        var value = item ? item.toString() : "";
        var lowerCaseValue = value.toLowerCase();
        var equalsSearchTerm = lowerCaseValue === matchTerm;
        var matchPosition = equalsSearchTerm ? 0 : matchTerm ? lowerCaseValue.indexOf(matchTerm) : -1;
        return {
          index: index,
          value: value,
          equalsSearchTerm: equalsSearchTerm,
          matchPosition: matchPosition
        };
      });
      values.sort(function (a, b) {
        // Exact matches always come first
        if (a.equalsSearchTerm && !b.equalSearchTerm) {
          return -1;
        }

        if (b.equalSearchTerm) {
          return 1;
        } // Matches that start with the search term come next


        if (a.matchPosition === 0 && b.matchPosition !== 0) {
          return -1;
        }

        if (b.matchPosition === 0) {
          return 1;
        } // Sort things normally from here on


        if (a.value > b.value) {
          return 1;
        }

        if (a.value < b.value) {
          return -1;
        }

        return 0;
      });
      var sorted = values.map(function (item) {
        return list[item.index];
      });
      return sorted;
    };
  }

  if (!api.utils.stringify) {
    /**
     * Custom JSON.stringify implementation that prevents circular reference errors.
     * @param   {object}        object            The object to be stringified.
     * @returns {string}                          A string representation of the object.
     */
    api.utils.stringify = function (object) {
      var cache = [];
      return JSON.stringify(object, function (key, value) {
        if (_typeof(value) === "object" && value !== null) {
          if (cache.indexOf(value) !== -1) {
            return;
          }

          cache.push(value);
        }

        return value;
      });
    };
  }

  if (!api.utils.objectComparator) {
    api.utils.objectComparator = function (key) {
      var order = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'asc';
      return function (a, b) {
        if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
          return 0;
        }

        var varA = typeof a[key] === 'string' ? a[key].toUpperCase() : a[key];
        var varB = typeof b[key] === 'string' ? b[key].toUpperCase() : b[key];
        var comparison = 0;

        if (varA > varB) {
          comparison = 1;
        } else if (varA < varB) {
          comparison = -1;
        }

        return order == 'desc' ? comparison * -1 : comparison;
      };
    };
  }

  if (!api.utils.allOpenForms) {
    /**
     * Given a form or collection of forms, returns a flattened array of the original form(s) and all of their currently loaded descendant forms.
     * @param   {object|Array[=api.openForms.allOpenForms()]}        formOrCollection    A single loaded form or a collection of them to search for descendants.
     *                                                                                   If not passed, all top-level currently open forms will be used.
     * @returns {Array}                                                                  The form(s) passed in and all currently loaded embedded forms.
     */
    api.utils.allOpenForms = function (formOrCollection) {
      var _ref;

      var forms = formOrCollection;

      if (!forms) {
        forms = api.openForms.allOpenForms();
      }

      if (!Array.isArray(forms)) {
        forms = [forms];
      }

      return (_ref = []).concat.apply(_ref, _toConsumableArray(forms.map(function (form) {
        form = form.raw ? form : form.apiRef;

        if (form.raw && form.raw.children && Array.isArray(form.raw.children) && form.raw.children.length) {
          var _ref2;

          return (_ref2 = []).concat.apply(_ref2, [form].concat(_toConsumableArray(api.utils.allOpenForms(form.raw.children))));
        } else {
          return form;
        }
      })));
    };
  }

  if (!api.utils.getOpenForm) {
    /**
     * Finds a form.
     * @param {Object} formID  An API Name, a numeric ID, UID or linker ({ UID: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", Type: "View" }) that identifies the form.
     * @returns                A reference to an open form.
     */
    api.utils.getOpenForm = function (formID) {
      var form = api.utils.validateFormID(formID).getOpenFormFn();

      if (form) {
        return form.raw;
      } else {
        return null;
      }
    };
  }

  if (!api.utils.validateFormID) {
    /**
     * Validates a form identifier and determines the appropriate look-up function for the ID.
     * @param {Object} formID  An API Name, numeric ID, UID or linker ({ UID: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", Type: "View" }) that identifies the form.
     * @returns                A valid form identifier and a function to find an open form using the identifier.
     */
    api.utils.validateFormID = function (formID) {
      var getOpenFormFn = function getOpenFormFn() {
        var id = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : formID;
        return api.openForms.findByID(id) || api.utils.allOpenForms().find(function (f) {
          return f.raw && f.raw.drivingView && f.raw.drivingView.ViewID && f.raw.drivingView.ViewID === id;
        });
      }; // Determine the identifier type


      if (isNaN(formID)) {
        // Ensure non-numeric ID is a linker
        formID = api.utils.toLinker(formID, "View");

        getOpenFormFn = function getOpenFormFn() {
          var linker = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : formID;
          return api.openForms.findByLinker(linker) || api.utils.allOpenForms().find(function (f) {
            return f.raw && f.raw.drivingView && (f.raw.drivingView.UID === linker.UID || f.raw.drivingView.Name === linker.UID);
          });
        };
      }

      return {
        formID: formID,
        getOpenFormFn: getOpenFormFn
      };
    };
  }

  if (!api.utils.openFormAsync) {
    /**
     * Opens a form.
     * @param {Object} formID                            A numeric ID, UID or linker ({ UID: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", Type: "View" }) that identifies the form.
     * @param {number} [mode=app.dv.types.OPEN_MODES]    One of the [app.dv.types.OPEN_MODES] to use when opening the form.
     * @returns {Promise}                                A promise that ultimately returns the opened form.
     */
    api.utils.openFormAsync = function (formID) {
      var mode = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : app.dv.types.OPEN_MODES.NORMAL;
      return new Promise(function (resolve, reject) {
        var formFinder = api.utils.validateFormID(formID);
        var validFormID = formFinder.formID;
        app.dv.actionLibrary.inlineExe(null, api.actions.dvCore.OpenView, {
          viewId: validFormID,
          mode: mode
        }, function (result) {
          if (result.success) {
            var form = formFinder.getOpenFormFn();

            if (!form) {
              reject("The form (ID: ".concat(formID, ") was reported to be opened, but its key could not be located in api.openForms."));
            }

            resolve(form.raw);
          } else {
            reject("The form (ID: ".concat(formID, ") could not be opened.").concat(result.actionMessage ? " Action Message: " + result.actionMessage : ""));
          }
        });
      });
    };
  }

  if (!api.utils.openForm) {
    /**
     * Opens a form.
     * @param {Object} formID                            A numeric ID, UID or linker ({ UID: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", Type: "View" }) that identifies the form.
     * @param {number} [mode=app.dv.types.OPEN_MODES]    One of the [app.dv.types.OPEN_MODES] to use when opening the form.
     */
    api.utils.openForm = function (formID) {
      var mode = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : app.dv.types.OPEN_MODES.NORMAL;
      api.utils.openFormAsync(formID, mode);
    };
  }

  if (!api.utils.closeForm) {
    /**
     * Closes a form.
     * @param {Object} formID    A raw form, or a numeric ID, UID or linker ({ UID: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", Type: "View" }) that identifies the form.
     */
    api.utils.closeForm = function (form) {
      if (!form.typeName || form.typeName !== "app.dv.mvc") {
        var formFinder = api.utils.validateFormID(form);
        form = api.utils.getOpenForm(formFinder.formID);
      }

      if (form) {
        app.dv.mvc.close(form);
      }
    };
  }

  if (!api.utils.IcsGenerator) {
    api.utils.IcsGenerator =
    /*#__PURE__*/
    function () {
      // From https://github.com/matthiasanderer/icsFormatter
      function IcsGenerator() {
        _classCallCheck(this, IcsGenerator);

        if (navigator.userAgent.indexOf('MSIE') > -1 && navigator.userAgent.indexOf('MSIE 10') == -1) {
          console.log('Unsupported Browser');
          return;
        }

        this._LINE_SEPARATOR = navigator.appVersion.indexOf('Win') === -1 ? '\n' : '\r\n';
        this._calendarEvents = [];
        this._calendarStartIndicator = ['BEGIN:VCALENDAR', 'VERSION:2.0'].join(this._LINE_SEPARATOR);
        this._calendarEndIndicator = "".concat(this._LINE_SEPARATOR, "END:VCALENDAR");
      }
      /**
       * Returns events array
       * @return {array} Events
       */


      _createClass(IcsGenerator, [{
        key: "addEvent",

        /**
         * Add event to the calendar
         * @param  {string} subject     Subject/Title of event
         * @param  {string} description Description of event
         * @param  {string} location    Location of event
         * @param  {string} begin       Beginning date of event
         * @param  {string} stop        Ending date of event
         */
        value: function addEvent(subject, description, location, begin, stop) {
          var start_date = new Date(begin).addMinutes(begin.getTimezoneOffset());
          var end_date = new Date(stop).addMinutes(stop.getTimezoneOffset());
          var start_year = start_date.getFullYear().toString().padStart(4, "0");
          var start_month = (start_date.getMonth() + 1).toString().padStart(2, "0");
          var start_day = start_date.getDate().toString().padStart(2, "0");
          var start_hours = start_date.getHours().toString().padStart(2, "0");
          var start_minutes = start_date.getMinutes().toString().padStart(2, "0");
          var start_seconds = start_date.getSeconds().toString().padStart(2, "0");
          var end_year = end_date.getFullYear().toString().padStart(4, "0");
          var end_month = (end_date.getMonth() + 1).toString().padStart(2, "0");
          var end_day = end_date.getDate().toString().padStart(2, "0");
          var end_hours = end_date.getHours().toString().padStart(2, "0");
          var end_minutes = end_date.getMinutes().toString().padStart(2, "0");
          var end_seconds = end_date.getSeconds().toString().padStart(2, "0"); // Since some calendars don't add 0 second events, we need to remove time if there is none...

          var dtStart = '';
          var dtEnd = '';

          if (start_hours + start_minutes + start_seconds + end_hours + end_minutes + end_seconds !== 0) {
            // not all day - so this needs the time as well
            dtStart = ":".concat(start_year).concat(start_month).concat(start_day, "T").concat(start_hours).concat(start_minutes).concat(start_seconds, "Z");
            dtEnd = ":".concat(end_year).concat(end_month).concat(end_day, "T").concat(end_hours).concat(end_minutes).concat(end_seconds, "Z");
          } else {
            // if this time is midnight to midnight - then it is an "all day" event.
            dtStart = ";VALUE=DATE:".concat(start_year).concat(start_month).concat(start_day);
            dtEnd = ";VALUE=DATE:".concat(end_year).concat(end_month).concat(end_day);
          }

          var calendarEvent = ["BEGIN:VEVENT", "CLASS:PUBLIC", "DESCRIPTION:".concat(description), "DTSTART".concat(dtStart), "DTEND".concat(dtEnd), "LOCATION:".concat(location.replace(/\r/g, "\\, ")), "SUMMARY:".concat(subject), "TRANSP:TRANSPARENT", "END:VEVENT"].join(this._LINE_SEPARATOR);

          this._calendarEvents.push(calendarEvent);

          return this;
        }
        /**
         * Download calendar
         * @param  {string} filename Filename
         * @param  {string} ext      Extention
         */

      }, {
        key: "download",
        value: function download() {
          var filename = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "calendar.ics";

          if (this._calendarEvents.length < 1) {
            return false;
          }

          var content = "data:text/calendar;charset=utf8,".concat(escape(this.calendarString));
          var downloadLink = document.createElement("a");
          downloadLink.href = content;
          downloadLink.download = filename;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        }
      }, {
        key: "events",
        get: function get() {
          return this._calendarEvents;
        }
        /**
         * Returns calendar string
         * @return {string} Calendar in iCalendar format
         */

      }, {
        key: "calendarString",
        get: function get() {
          return this._calendarStartIndicator + this._LINE_SEPARATOR + this._calendarEvents.join(this._LINE_SEPARATOR) + this._calendarEndIndicator;
        }
      }]);

      return IcsGenerator;
    }();
  }
});
//# sourceMappingURL=utils.js.map