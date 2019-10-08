/**
 * Extends the api.utils namespace with additional helper functions.
 * Dependencies:
 *    api.loadExtension
 */
api.loadExtension("api.utils", () => {
    if (!api.utils.svgToDataUrl) {
        api.utils.svgToDataUrl = (svgXmlString, color, opacity = 1) => {
            // if (!color) {
            //     color = (api.runtime && api.runtime.colors && (api.runtime.colors.button_fill || api.runtime.colors.primary_dark)) || '';
            // }
            svgXmlString = svgXmlString
                .replace(/fill\-opacity=""/g, `fill-opacity="${opacity}"`)
                .replace(/fill=""/g, `fill="${color}"`);
            const encoded = window.encodeURIComponent(svgXmlString)
                .replace(/'/g, '%27')
                .replace(/"/g, '%22');

            return `data:image/svg+xml,${encoded}`;
        }
    }

    if (!api.utils.getWebResourceAsync) {
        /**
         * Proxies a web resource request via the application service.
         * @param  [string]           url        The URL to the resource.
         * @param  [string="utf8"]    encoding   Optional encoding (defaults to utf8).
         * @return [Promise(object)]             Returns a promise that resolves to an object with { contentType, dataResponse }.
         **/
        api.utils.getWebResourceAsync = (url, encoding = "utf8") => {
            return app.dv.services.call({
                svc: "Support",
                fn: "ProxyWebResource",
            }, {
                url,
                encoding
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
        api.utils.callEndpointAsync = (endpoint, args, service = "Custom") => {
            return new Promise((resolve, reject) => {
                app.connection.call(service, endpoint, args, (result, error) => {
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
        api.utils.getAttachmentUri = (attachmentPropertyUID, record = (api.openForms.active || api.openForms.allOpenForms().last()).selectedRecord.raw) => {
            return record.gridValues.getVal({ UID: attachmentPropertyUID }).documentURI;
        };
    }

    if (!api.utils.toLinker) {
        /**
         * Constructs a linker object  if object is not already one.
         * @param    {string|object}        id    String identifier or a linker object.
         * @param    {string="Property"}    type  Entity type to identify ("Property", "View", etc.).
         * @return   {object}               { Type(string), UID(GUID) }
         */
        api.utils.toLinker = (id, type = "Property") => {
            if (typeof id === "string") {
                return { Type: type, UID: id };
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
        api.utils.isFunction = item => {
            return item && typeof(item) === "function";
        };
    }

    if (!api.utils.smartSort) {
        api.utils.smartSort = (list, matchTerm) => {
            const values = list.map((item, index) => {
                const value = item ? item.toString() : "";
                const lowerCaseValue = value.toLowerCase();
                const equalsSearchTerm = lowerCaseValue === matchTerm;
                const matchPosition = equalsSearchTerm ? 0 : (matchTerm ? lowerCaseValue.indexOf(matchTerm) : -1);
                return {
                    index,
                    value,
                    equalsSearchTerm,
                    matchPosition
                };
            });
            values.sort((a, b) => {
                // Exact matches always come first
                if (a.equalsSearchTerm && !b.equalSearchTerm) {
                    return -1;
                }
                if (b.equalSearchTerm) {
                    return 1;
                }
                // Matches that start with the search term come next
                if (a.matchPosition === 0 && b.matchPosition !== 0) {
                    return -1;
                }
                if (b.matchPosition === 0) {
                    return 1;
                }
                // Sort things normally from here on
                if (a.value > b.value) {
                    return 1;
                }
                if (a.value < b.value) {
                    return -1;
                }
                return 0;
            });
            const sorted = values.map(item => list[item.index]);
            return sorted;
        };
    }

    if (!api.utils.stringify) {
        /**
         * Custom JSON.stringify implementation that prevents circular reference errors.
         * @param   {object}        object            The object to be stringified.
         * @returns {string}                          A string representation of the object.
         */
        api.utils.stringify = object => {
            const cache = [];
            return JSON.stringify(object, (key, value) => {
                if (typeof value === "object" && value !== null) {
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
        api.utils.objectComparator = (key, order = 'asc') => {
            return (a, b) => {
                if(!a.hasOwnProperty(key) ||
                    !b.hasOwnProperty(key)) {
                    return 0;
                }

                const varA = (typeof a[key] === 'string') ?
                    a[key].toUpperCase() : a[key];
                const varB = (typeof b[key] === 'string') ?
                    b[key].toUpperCase() : b[key];

                let comparison = 0;
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
        api.utils.allOpenForms = formOrCollection => {
            let forms = formOrCollection;
            if (!forms) {
                forms = api.openForms.allOpenForms();
            }
            if (!Array.isArray(forms)) {
                forms = [forms];
            }
            return [].concat(...forms.map(form => {
                form = form.raw ? form : form.apiRef;
                if (form.raw && form.raw.children && Array.isArray(form.raw.children) && form.raw.children.length) {
                    return [].concat(form, ...api.utils.allOpenForms(form.raw.children));
                } else {
                    return form;
                }
            }));
        };
    }

    if (!api.utils.getOpenForm) {
        /**
         * Finds a form.
         * @param {Object} formID  An API Name, a numeric ID, UID or linker ({ UID: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", Type: "View" }) that identifies the form.
         * @returns                A reference to an open form.
         */
        api.utils.getOpenForm = formID => {
            const form = api.utils.validateFormID(formID).getOpenFormFn();
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
        api.utils.validateFormID = formID => {
            let getOpenFormFn = (id = formID) => api.openForms.findByID(id) ||
                api.utils.allOpenForms().find(f => f.raw && f.raw.drivingView && f.raw.drivingView.ViewID && f.raw.drivingView.ViewID === id);
            // Determine the identifier type
            if (isNaN(formID)) {
                // Ensure non-numeric ID is a linker
                formID = api.utils.toLinker(formID, "View");
                getOpenFormFn = (linker = formID) => api.openForms.findByLinker(linker) ||
                    api.utils.allOpenForms().find(f => f.raw && f.raw.drivingView && (f.raw.drivingView.UID === linker.UID || f.raw.drivingView.Name === linker.UID));
            }
            return {
                formID,
                getOpenFormFn,
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
        api.utils.openFormAsync = (formID, mode = app.dv.types.OPEN_MODES.NORMAL) => {
            return new Promise((resolve, reject) => {
                const formFinder = api.utils.validateFormID(formID);
                const validFormID = formFinder.formID;
                app.dv.actionLibrary.inlineExe(null, api.actions.dvCore.OpenView, { viewId: validFormID, mode }, result => {
                    if (result.success) {
                        const form = formFinder.getOpenFormFn();
                        if (!form) {
                            reject(`The form (ID: ${formID}) was reported to be opened, but its key could not be located in api.openForms.`);
                        }
                        resolve(form.raw);
                    } else {
                        reject(`The form (ID: ${formID}) could not be opened.${result.actionMessage ? " Action Message: " + result.actionMessage : ""}`);
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
        api.utils.openForm = (formID, mode = app.dv.types.OPEN_MODES.NORMAL) => {
            api.utils.openFormAsync(formID, mode);
        }
    }

    if (!api.utils.closeForm) {
        /**
         * Closes a form.
         * @param {Object} formID    A raw form, or a numeric ID, UID or linker ({ UID: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", Type: "View" }) that identifies the form.
         */
        api.utils.closeForm = (form) => {
            if (!form.typeName || form.typeName !== "app.dv.mvc") {
                const formFinder = api.utils.validateFormID(form);
                form = api.utils.getOpenForm(formFinder.formID);
            }
            if (form) {
                app.dv.mvc.close(form);
            }
        };
    }

     if (!api.utils.IcsGenerator) {
         api.utils.IcsGenerator = class IcsGenerator {
            // From https://github.com/matthiasanderer/icsFormatter
            constructor() {
                if (navigator.userAgent.indexOf('MSIE') > -1 && navigator.userAgent.indexOf('MSIE 10') == -1) {
                    console.log('Unsupported Browser');
                    return;
                }
                this._LINE_SEPARATOR = (navigator.appVersion.indexOf('Win') === -1) ? '\n' : '\r\n';
                this._calendarEvents = [];
                this._calendarStartIndicator = [
                    'BEGIN:VCALENDAR',
                    'VERSION:2.0'
                ].join(this._LINE_SEPARATOR);
                this._calendarEndIndicator = `${this._LINE_SEPARATOR}END:VCALENDAR`;
            }

            /**
             * Returns events array
             * @return {array} Events
             */
            get events() {
                return this._calendarEvents;
            }

            /**
             * Returns calendar string
             * @return {string} Calendar in iCalendar format
             */
            get calendarString() {
                return this._calendarStartIndicator + this._LINE_SEPARATOR + this._calendarEvents.join(this._LINE_SEPARATOR) + this._calendarEndIndicator;
            }

            /**
             * Add event to the calendar
             * @param  {string} subject     Subject/Title of event
             * @param  {string} description Description of event
             * @param  {string} location    Location of event
             * @param  {string} begin       Beginning date of event
             * @param  {string} stop        Ending date of event
             */
            addEvent(subject, description, location, begin, stop) {
                const start_date = new Date(begin).addMinutes(begin.getTimezoneOffset());
                const end_date = new Date(stop).addMinutes(stop.getTimezoneOffset());

                const start_year = start_date.getFullYear().toString().padStart(4, "0");
                const start_month = (start_date.getMonth() + 1).toString().padStart(2, "0");
                const start_day = start_date.getDate().toString().padStart(2, "0");
                const start_hours = start_date.getHours().toString().padStart(2, "0");
                const start_minutes = start_date.getMinutes().toString().padStart(2, "0");
                const start_seconds = start_date.getSeconds().toString().padStart(2, "0");

                const end_year = end_date.getFullYear().toString().padStart(4, "0");
                const end_month = (end_date.getMonth() + 1).toString().padStart(2, "0");
                const end_day = end_date.getDate().toString().padStart(2, "0");
                const end_hours = end_date.getHours().toString().padStart(2, "0");
                const end_minutes = end_date.getMinutes().toString().padStart(2, "0");
                const end_seconds = end_date.getSeconds().toString().padStart(2, "0");

                // Since some calendars don't add 0 second events, we need to remove time if there is none...
                let dtStart = '';
                let dtEnd = '';
                if (start_hours + start_minutes + start_seconds + end_hours + end_minutes + end_seconds !== 0) {
                    // not all day - so this needs the time as well
                    dtStart = `:${start_year}${start_month}${start_day}T${start_hours}${start_minutes}${start_seconds}Z`;
                    dtEnd = `:${end_year}${end_month}${end_day}T${end_hours}${end_minutes}${end_seconds}Z`;
                }
                else {
                    // if this time is midnight to midnight - then it is an "all day" event.
                    dtStart = `;VALUE=DATE:${start_year}${start_month}${start_day}`;
                    dtEnd = `;VALUE=DATE:${end_year}${end_month}${end_day}`;
                }

                const calendarEvent = [
                    "BEGIN:VEVENT",
                    "CLASS:PUBLIC",
                    `DESCRIPTION:${description}`,
                    `DTSTART${dtStart}`,
                    `DTEND${dtEnd}`,
                    `LOCATION:${location.replace(/\r/g, "\\, ")}`,
                    `SUMMARY:${subject}`,
                    "TRANSP:TRANSPARENT",
                    "END:VEVENT",
                ].join(this._LINE_SEPARATOR);

                this._calendarEvents.push(calendarEvent);
                return this;
            }

            /**
             * Download calendar
             * @param  {string} filename Filename
             * @param  {string} ext      Extention
             */
            download(filename = "calendar.ics") {
                if (this._calendarEvents.length < 1) {
                    return false;
                }
                const content = `data:text/calendar;charset=utf8,${escape(this.calendarString)}`;
                const downloadLink = document.createElement("a");
                downloadLink.href = content;
                downloadLink.download = filename;

                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
            }
        };
    }

    if (!api.utils.loadGoogleFonts) {
        api.utils.loadGoogleFonts = (fontNames) => {
            return new Promise((resolve, reject) => {
                try {
                    const loadFonts = () => {
                        window.WebFont.load({
                            google: {
                                families: fontNames
                            }
                        });
                        resolve();
                    };

                    if (typeof(window.WebFont) !== "undefined") {
                        // Load fonts if the API is already loaded
                        loadFonts();
                    } else {
                        // Load API and then load specified fonts
                        api.utils.loadResource("https://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js", "JS", loadFonts);
                    }
                } catch (exception) {
                    reject(exception);
                }
            });
        }
    }
});
