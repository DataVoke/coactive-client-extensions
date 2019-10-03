"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * Custom Action: Extend api.ui
 * Extends the api.ui namespace with additional helper functions.
 * Dependencies:
 *    api.loadExtension
 *    api.bindingsRegistry.register
 *    api.bindingsRegistry.deregister
 *    api.utils.toLinker
 */
capi.loadExtension("api.ui", function () {
  var overlayClassName = "overlayFieldWithElement";

  var getOverlayStyle = function getOverlayStyle(coordinates) {
    //Absolute position is needed on the main container of html elements in order to overlay the canvas. It also allows anchoring the bottom right coordinates to handle window resizing.
    return "position:absolute;display:inline-block;resize:both;top:".concat(coordinates.top, "px;left:").concat(coordinates.left, "px;right:").concat(coordinates.absoluteRight, "px;bottom:").concat(coordinates.absoluteBottom, "px;");
  };
  /**
   * A helper used to determine if a control is of a given type to access its underlying edit control, and to access event binding components.
   */


  var ControlBindingHelper =
  /*#__PURE__*/
  function () {
    function ControlBindingHelper(_ref) {
      var isOne = _ref.isOne,
          editControlAccessor = _ref.editControlAccessor,
          events = _ref.events;

      _classCallCheck(this, ControlBindingHelper);

      this._isOne = isOne;
      this._editControlAccessor = editControlAccessor;
      this._events = events;
    }
    /**
     * Gets a function that returns a boolean value indicating whether the control is of a given type.
     */


    _createClass(ControlBindingHelper, [{
      key: "isOne",
      get: function get() {
        return this._isOne;
      }
      /**
       * Gets a functon that returns the component edit control of a given type.
       */

    }, {
      key: "editControlAccessor",
      get: function get() {
        return this._editControlAccessor;
      }
      /**
       * Gets a map of binding details and helper functions for the various events that a given control can fire.
       */

    }, {
      key: "events",
      get: function get() {
        return this._events;
      }
    }]);

    return ControlBindingHelper;
  }();
  /**
   * A map of helper functions and event binding configurations for a specific type of control (e.g. TextField, ComboBox).
   */


  var controlMap = new Map([["Form", new ControlBindingHelper({
    isOne: function isOne(form) {
      return form.typeName === "app.dv.mvc";
    },
    editControlAccessor: function editControlAccessor(form) {
      return form;
    },
    events: {
      "selectionChanged": {
        nativeEventName: "selectionChanged",
        targetAccessor: function targetAccessor(form) {
          return form;
        }
      }
    }
  })], ["TextField", new ControlBindingHelper({
    isOne: function isOne(control) {
      return control.textField && (control.textField.typeName === "zebra.ui.dvTextField" || control.textField.typeName === "zebra.ui.dvNumberField");
    },
    editControlAccessor: function editControlAccessor(control) {
      return control.textField;
    },
    events: {
      "textUpdated": {
        nativeEventName: "textUpdated",
        targetAccessor: function targetAccessor(editControl) {
          return editControl.view.target;
        }
      }
    }
  })], ["DateTimeField", new ControlBindingHelper({
    isOne: function isOne(control) {
      return control.typeName === "zebra.ui.dvDateTimeField";
    },
    editControlAccessor: function editControlAccessor(control) {
      return control;
    },
    events: {
      "textUpdated": {
        nativeEventName: "textUpdated",
        targetAccessor: function targetAccessor(editControl) {
          return editControl.view.target;
        }
      }
    }
  })], ["ComboBox", new ControlBindingHelper({
    isOne: function isOne(control) {
      return control.comboBox && control.comboBox.typeName === "zebra.ui.dvComboBox";
    },
    editControlAccessor: function editControlAccessor(control) {
      return control.comboBox;
    },
    events: {
      "textUpdated": {
        nativeEventName: "textUpdated",
        targetAccessor: function targetAccessor(editControl) {
          return editControl.content.textField.view.target;
        }
      },
      "itemSelected": {
        nativeEventName: "",
        targetAccessor: function targetAccessor(editControl) {
          return editControl;
        }
      },
      "clicked": {
        nativeEventName: "onClick",
        targetAccessor: function targetAccessor(editControl) {
          return editControl.content.textField;
        }
      }
    }
  })], ["Button", new ControlBindingHelper({
    isOne: function isOne(control) {
      return control.typeName === "zebra.ui.dvButton";
    },
    editControlAccessor: function editControlAccessor(control) {
      return control;
    },
    events: {
      "fired": {
        nativeEventName: "fired",
        targetAccessor: function targetAccessor(editControl) {
          return editControl;
        }
      }
    }
  })], // TODO: Checkbox configuration needs to be verified and/or modified/fully implemented
  ["Checkbox", new ControlBindingHelper({
    isOne: function isOne(control) {
      return control.checkboxField && contro.lcheckboxField.typeName === "zebra.ui.dvCheckbox";
    },
    editControlAccessor: function editControlAccessor(control) {
      return control.checkboxField;
    },
    events: {
      "fired": {
        nativeEventName: "fired",
        targetAccessor: function targetAccessor(editControl) {
          return editControl;
        }
      }
    }
  })]]);
  /**
   * A map of event handlers corresponding to a public event name. The corresponding handler is called internally when
   * the associated bound event fires. It is passed an optional custom handler function that will be called after any
   * internal housekeeping is done.
   */

  var internalEventHandlers = new Map([["selectionChanged", function (editControl, handler) {
    api.utils.runFunction(handler, null, [editControl]);
  }], ["textUpdated", function (editControl, handler) {
    if (!editControl.hasFocus()) {
      // Don't do anything if the control doesn't have focus
      // (further propagation can cause an endless loop if grid cell is updating the field's text)
      return;
    } // Execute the provided handler, passing it the edit control


    api.utils.runFunction(handler, null, [editControl]);
  }], ["itemSelected", function (editControl, handler) {
    if (!editControl.hasFocus()) {
      // Don't do anything if the control doesn't have focus
      // (further propagation can cause an endless loop if grid cell is updating the field's text)
      return;
    } // Execute the provided handler, passing it the edit control


    api.utils.runFunction(handler, null, [editControl]);
  }], ["clicked", function (editControl, handler) {
    api.utils.runFunction(handler, null, [editControl]);
  }], ["fired", function (editControl, handler) {
    api.utils.runFunction(handler, null, [editControl]);
  }]]);

  if (!api.ui.controlHelper) {
    /**
     * A helper object that can be used to bind events to a control.
     */
    api.ui.controlHelper =
    /*#__PURE__*/
    function () {
      /**
       * Constructs a helper that can be used to bind events to a control.
       * @param  {object}    control                The control instance.
       * @param  {object}    form                   The form that hosts the control instance.
       * @param  {object}    action                 Optionally, the custom action that is using the helper.
       * @param  {string}    propertySettingName    Optionally, the name of the setting on the action that
       *                                            identifies the property associated with any bindings.
       */
      function _class(control, form, action, propertySettingName) {
        _classCallCheck(this, _class);

        this.control = control;
        this.form = form.raw ? form.raw : form;
        this.propertySettingName = propertySettingName;
        this.action = action;
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = controlMap.entries()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var _step$value = _slicedToArray(_step.value, 2),
                type = _step$value[0],
                helpers = _step$value[1];

            if (helpers.isOne(control)) {
              this.type = type;
              this._helpers = helpers;
              this.editControl = helpers.editControlAccessor(this.control);
              break;
            }
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator["return"] != null) {
              _iterator["return"]();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }
      }
      /**
       * Gets the underlying target of a specific event for the control.
       * @param {string}        eventName        The event name that was previously bound.
       * @returns {object}                       The underlying target component for the specific control and event.
       */


      _createClass(_class, [{
        key: "getEventTarget",
        value: function getEventTarget(eventName) {
          return this.getEvent(eventName).targetAccessor(this.editControl);
        }
        /**
         * Gets the configuration for a specific event that the control fires. This can be used
         * to map public events to their underlying native events and to access the target
         * of the event to be bound. Because controls are made up of individual component
         * controls, the targets for various events may be different internally.
         * @param {string}        eventName        The event name that is being bound.
         * @returns {object}                       Details of the specific control's and event's binding.
         */

      }, {
        key: "getEvent",
        value: function getEvent(eventName) {
          var events = this._helpers.events;

          if (events) {
            return events[eventName];
          }

          return null;
        }
        /**
         * Generates the most unique key possible using the control helper's constructor parameters.
         * @param {string}        eventName        The event name that is being bound.
         * @returns {string}                       A key suitable for the binding registry.
         */

      }, {
        key: "getBindingKey",
        value: function getBindingKey(eventName) {
          var components = [];

          if (this.form) {
            components.push(["Form", this.form.drivingView.UID].join(":"));
          }

          if (this.action) {
            var actionLinker = this.action.ActionID;

            if (actionLinker) {
              components.push([actionLinker.Type, actionLinker.UID].join(":"));
            }

            if (this.propertySettingName && this.action.Settings) {
              var propertyLinker = this.action.Settings[this.propertySettingName];

              if (propertyLinker && propertyLinker.Type && propertyLinker.UID) {
                components.push([propertyLinker.Type, propertyLinker.UID].join(":"));
              }
            }
          }

          components.push(["Control", this.control.$hash$].join(":"));
          components.push(eventName);
          return components.join("|");
        }
        /**
         * Binds an event handler for the control.
         * @param {string}        eventName        The event name that was previously bound.
         * @param {function}      customHandler    The function to be executed whenever the event fires.
         *                                         When called, it will be passed the bound edit control.
         * @param {number}        delay            Delay in milliseconds between events before execution. Defaults to 0.
         * @returns {object}                       The registered binding.
         */

      }, {
        key: "bind",
        value: function bind(eventName, customHandler) {
          var _this = this;

          var delay = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
          var event = this.getEvent(eventName);
          var internalEventHandler = internalEventHandlers.get(eventName);
          var eventTarget = this.getEventTarget(eventName);
          var timeout = null;

          var invokeInternalHandler = function invokeInternalHandler() {
            window.clearTimeout(timeout);
            timeout = window.setTimeout(function () {
              return internalEventHandler(_this.editControl, customHandler);
            }, delay);
          };

          var nativeEventName = event.nativeEventName;
          return api.bindingsRegistry.register({
            key: this.getBindingKey(eventName),
            registrationFormID: this.form.drivingView.ViewID,
            onRegister: function onRegister() {
              // Bind the actual event handler, and store it for potential unbinding
              if (nativeEventName) {
                if (api.utils.isFunction(eventTarget.bind)) {
                  eventTarget.bind(nativeEventName, invokeInternalHandler);
                } else if (api.utils.isFunction(eventTarget.subscribe)) {
                  // Some objects use subscribe/unSubscribe instead of bind/unbind
                  eventTarget.subscribe(nativeEventName, _this.editControl, invokeInternalHandler);
                } else if (api.utils.isFunction(eventTarget.on)) {
                  // Some objects use subscribe/unSubscribe instead of bind/unbind
                  eventTarget.on(nativeEventName, invokeInternalHandler);
                }
              } else {
                // Some controls only have a single event, so the name is irrelevant and the syntax is different
                eventTarget.bind(invokeInternalHandler);
              }
            },
            onDeregister: function onDeregister() {
              // When the registered binding is deregistered, unbind the event handler instance
              if (api.utils.isFunction(eventTarget.unbind)) {
                eventTarget.unbind(invokeInternalHandler);
              } else if (api.utils.isFunction(eventTarget.unsubscribe)) {
                // Some objects use subscribe/unSubscribe instead of bind/unbind
                eventTarget.unsubscribe(nativeEventName, _this.editControl);
              } else if (api.utils.isFunction(eventTarget.off)) {
                // Some objects use subscribe/unSubscribe instead of bind/unbind
                eventTarget.off(nativeEventName, invokeInternalHandler);
              }
            }
          });
        }
        /**
         * Removes the binding for one of the control's previously bound event handlers.
         * @param {string}    eventName    The event name that was previously bound.
         * @returns {object}               The deregistered binding.
         */

      }, {
        key: "unbind",
        value: function unbind(eventName) {
          // Deregister the binding which will unbind the event handler instance
          return api.bindingsRegistry.deregister(this.getBindingKey(eventName));
        }
      }]);

      return _class;
    }();
  }

  if (!api.ui.getValidGap) {
    api.ui.getValidGap = function (uiControl, gap) {
      var defaultGap = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 5;
      var validGap = Number.parseInt(gap);

      if (isNaN(validGap) || validGap === null) {
        // Use the control's gap or its parent's if none is specified
        validGap = uiControl.gap || (uiControl.parent ? uiControl.parent.gap : defaultGap) || defaultGap;
      }
    };
  }

  if (!api.ui.createVerticalPanel) {
    api.ui.createVerticalPanel = function (gap) {
      return new zebra.ui.dvPanel(new zebra.layout.ListLayout(zebra.layout.STRETCH, gap));
    };
  }

  if (!api.ui.createHorizontalPanel) {
    api.ui.createHorizontalPanel = function (gap) {
      return new zebra.ui.dvPanel(new zebra.layout.FlowLayout(zebra.layout.STRETCH, zebra.layout.CENTER, zebra.layout.HORIZONTAL, gap));
    };
  }

  if (!api.ui.createStretchPanel) {
    api.ui.createStretchPanel = function (orientation, gap) {
      return new zebra.ui.dvPanel(new zebra.layout.dvLayout(orientation, gap));
    };
  }

  if (!api.ui.getMaxSize) {
    api.ui.getMaxSize = function (sizes) {
      return {
        width: Math.max.apply(Math, _toConsumableArray(sizes.map(function (size) {
          return size ? size.width : 0;
        }))),
        height: Math.max.apply(Math, _toConsumableArray(sizes.map(function (size) {
          return size ? size.height : 0;
        })))
      };
    };
  }

  if (!api.ui.normalizeSize) {
    api.ui.normalizeSize = function (size) {
      var normalizedSize = size;
      var dimensionTranslator = {
        width: "innerWidth",
        height: "innerHeight"
      };

      for (var key in normalizedSize) {
        var normalizedDimension = normalizedSize[key];

        if (normalizedDimension !== null && normalizedDimension !== undefined) {
          var stringValue = normalizedDimension.toString();
          var percentIndex = stringValue.indexOf("%");

          if (percentIndex >= 0) {
            var multiplier = (Number.parseInt(stringValue.substring(0, percentIndex)) || 0) / 100;
            normalizedDimension = multiplier * window[dimensionTranslator[key]];
          } else {
            normalizedDimension = Number.parseInt(normalizedDimension);
          }

          normalizedSize[key] = normalizedDimension;
        }
      }

      return normalizedSize;
    };
  }

  if (!api.ui.setFormSize) {
    api.ui.setFormSize = function (form, size) {
      var theForm = api.ui.ensureForm(form);

      if (theForm) {
        var theSize = api.ui.normalizeSize(size);

        for (var key in theSize) {
          var dimension = theSize[key];

          if (dimension !== null && dimension !== undefined) {
            form.window[key] = dimension;
          }
        }
      } else {
        console.log("Form could not be found, so setFormSize could not be executed.");
      }
    };
  }

  if (!api.ui.setFormLocation) {
    api.ui.setFormLocation = function (form, location) {
      var theForm = api.ui.ensureForm(form);

      if (theForm) {
        form.window.left = location.left || location.x;
        form.window.top = location.top || location.y;
      } else {
        console.log("Form could not be found, so setFormLocation could not be executed.");
      }
    };
  }

  if (api.ui.setFormSizeAndLocation) {
    api.ui.setFormSizeAndLocation = function (form, coordinates) {
      api.ui.setFormSize(form, coordinates);
      api.ui.setFormLocation(form, coordinates);
    };
  }

  if (!api.ui.checkboxToButtonPair) {
    api.ui.checkboxToButtonPair = function (_ref2) {
      var checkbox = _ref2.checkbox,
          form = _ref2.form,
          selectedStyle = _ref2.selectedStyle,
          deselectedStyle = _ref2.deselectedStyle,
          _ref2$yesLabel = _ref2.yesLabel,
          yesLabel = _ref2$yesLabel === void 0 ? "Yes" : _ref2$yesLabel,
          _ref2$noLabel = _ref2.noLabel,
          noLabel = _ref2$noLabel === void 0 ? "No" : _ref2$noLabel,
          _ref2$layout = _ref2.layout,
          layout = _ref2$layout === void 0 ? "horizontal" : _ref2$layout,
          _ref2$gap = _ref2.gap,
          gap = _ref2$gap === void 0 ? null : _ref2$gap,
          _ref2$buttonWidth = _ref2.buttonWidth,
          buttonWidth = _ref2$buttonWidth === void 0 ? null : _ref2$buttonWidth,
          _ref2$buttonHeight = _ref2.buttonHeight,
          buttonHeight = _ref2$buttonHeight === void 0 ? null : _ref2$buttonHeight;
      var hostForm = api.ui.ensureForm(form);

      if (hostForm && hostForm.isVisible) {
        var booleanControl = api.ui.ensureCheckbox(checkbox, hostForm);

        if (booleanControl) {
          var currentValue = booleanControl.checkboxField.getValue(); // Hide any existing checkbox

          if (booleanControl.checkboxField) {
            booleanControl.checkboxField.setVisible(false);
          } //Set up styles


          var selectedButtonStyle = api.ui.ensureStyle(selectedStyle);
          var deselectedButtonStyle = api.ui.ensureStyle(deselectedStyle);

          if (selectedButtonStyle && deselectedButtonStyle) {
            // Create a container panel and add buttons in place of checkbox
            if (!booleanControl.buttonPanel) {
              booleanControl.buttonPanel = layout.toLowerCase() === "horizontal" ? api.ui.createHorizontalPanel(gap) : api.ui.createVerticalPanel(gap);
              booleanControl.add(booleanControl.buttonPanel);
            }

            var falseButton = booleanControl.falseButton;

            if (!falseButton) {
              falseButton = new zebra.ui.dvButton();
              booleanControl.buttonPanel.add(falseButton);
            }

            falseButton.applyStyle(booleanControl.currentStyle);
            falseButton.overrideStyle = currentValue === true ? deselectedButtonStyle : currentValue === false ? selectedButtonStyle : booleanControl.currentStyle;
            api.ui.applyStyle(form, falseButton, falseButton.overrideStyle);
            falseButton.setLabel(noLabel);
            var trueButton = booleanControl.trueButton;

            if (!trueButton) {
              trueButton = new zebra.ui.dvButton();
              booleanControl.buttonPanel.add(trueButton);
            }

            trueButton.applyStyle(booleanControl.currentStyle);
            trueButton.overrideStyle = currentValue === true ? deselectedButtonStyle : currentValue === false ? selectedButtonStyle : booleanControl.currentStyle;
            api.ui.applyStyle(form, trueButton, trueButton.overrideStyle);
            trueButton.setLabel(yesLabel);
            window.setTimeout(function () {
              if (falseButton && trueButton) {
                var specifiedSize = {
                  width: Number.parseInt(buttonWidth),
                  height: Number.parseInt(buttonHeight)
                };
                var maxSize = api.ui.getMaxSize([trueButton.getPreferredSize(), falseButton.getPreferredSize()]);
                var applySize = {
                  width: specifiedSize.width || maxSize.width,
                  height: specifiedSize.height || maxSize.height
                };
                falseButton.setPreferredSize(applySize.width, applySize.height);
                falseButton.vrp();
                trueButton.setPreferredSize(applySize.width, applySize.height);
                trueButton.vrp();
              }
            }, 11);
          } else {
            var message = "You must supply styles for selected and deselected button states. See console for more details.";
            console.error(message, "selectedStyle:", selectedStyle, "deselectedStyle:", deselectedStyle);
            throw new Error(message);
          }
        } else {
          var _message = "Could not find checkbox control. See console for more details.";
          console.error(_message, "checkbox:", checkbox);
          throw new Error(_message);
        }

        return booleanControl;
      } else {
        console.log("Form is not visible, so checkboxToButtonPair could not be executed.");
        return null;
      }
    };
  }

  if (!api.ui.comboBoxToButtons) {
    api.ui.comboBoxToButtons = function (_ref3) {
      var combobox = _ref3.combobox,
          form = _ref3.form,
          selectedStyle = _ref3.selectedStyle,
          deselectedStyle = _ref3.deselectedStyle,
          _ref3$layout = _ref3.layout,
          layout = _ref3$layout === void 0 ? "vertical" : _ref3$layout,
          _ref3$gap = _ref3.gap,
          gap = _ref3$gap === void 0 ? null : _ref3$gap,
          _ref3$buttonWidth = _ref3.buttonWidth,
          buttonWidth = _ref3$buttonWidth === void 0 ? null : _ref3$buttonWidth,
          _ref3$buttonHeight = _ref3.buttonHeight,
          buttonHeight = _ref3$buttonHeight === void 0 ? null : _ref3$buttonHeight;
      var hostForm = api.ui.ensureForm(form);

      if (hostForm && hostForm.isVisible) {
        var comboBoxControl = api.ui.ensureComboBox(combobox, hostForm);

        if (comboBoxControl) {
          var currentValue = comboBoxControl.comboBox.getValue(); // Hide existing combobox

          comboBoxControl.comboBox.setVisible(false); // Set up styles

          var selectedButtonStyle = api.ui.ensureStyle(selectedStyle);
          var deselectedButtonStyle = api.ui.ensureStyle(deselectedStyle);

          if (selectedButtonStyle && deselectedButtonStyle) {
            // Create a container panel and add buttons in place of checkbox
            if (!comboBoxControl.buttonPanel) {
              comboBoxControl.buttonPanel = layout.toLowerCase() === "horizontal" ? api.ui.createHorizontalPanel(gap) : api.ui.createVerticalPanel(gap);
              comboBoxControl.add(comboBoxControl.buttonPanel);
            }

            if (!comboBoxControl.buttonArray && Array.isArray(comboBoxControl.comboBox.cachedList)) {
              comboBoxControl.buttonArray = comboBoxControl.comboBox.cachedList.map(function (listItem) {
                if (listItem) {
                  var button = new zebra.ui.dvButton();
                  button.applyStyle(comboBoxControl.currentStyle);
                  button.overrideStyle = currentValue === listItem ? selectedButtonStyle : deselectedButtonStyle;
                  api.ui.applyStyle(form, button, button.overrideStyle);
                  button.setLabel(listItem);
                  comboBoxControl.buttonPanel.add(button);
                  return button;
                }
              });
            }

            window.setTimeout(function () {
              if (comboBoxControl && comboBoxControl.buttonArray) {
                var specifiedSize = {
                  width: Number.parseInt(buttonWidth),
                  height: Number.parseInt(buttonHeight)
                };
                var maxSize = api.ui.getMaxSize(comboBoxControl.buttonArray.map(function (button) {
                  return button ? button.getPreferredSize() : null;
                }));
                var applySize = {
                  width: specifiedSize.width || maxSize.width,
                  height: specifiedSize.height || maxSize.height
                };
                comboBoxControl.buttonArray.forEach(function (button) {
                  if (button) {
                    button.setPreferredSize(applySize.width, applySize.height);
                    button.vrp();
                  }
                });
              }
            }, 11);
          } else {
            var message = "You must supply styles for selected and deselected button states. See console for more details.";
            console.error(message, "selectedStyle:", selectedStyle, "deselectedStyle:", deselectedStyle);
            throw new Error(message);
          }
        } else {
          var _message2 = "Could not find combobox control. See console for more details.";
          console.error(_message2, "combobox:", combobox);
          throw new Error(_message2);
        }

        return comboBoxControl;
      } else {
        console.log("Form is not visible, so comboBoxToButtons could not be executed.");
        return null;
      }
    };
  }

  if (!api.ui.buttonGroupHelper) {
    api.ui.buttonGroupHelper =
    /*#__PURE__*/
    function () {
      function _class2(_ref4) {
        var _this2 = this;

        var form = _ref4.form,
            containerPanel = _ref4.containerPanel,
            selectedStyle = _ref4.selectedStyle,
            deselectedStyle = _ref4.deselectedStyle,
            _ref4$allowedMinValue = _ref4.allowedMinValueCount,
            allowedMinValueCount = _ref4$allowedMinValue === void 0 ? 0 : _ref4$allowedMinValue,
            allowedMaxValueCount = _ref4.allowedMaxValueCount,
            action = _ref4.action,
            propertySettingName = _ref4.propertySettingName,
            boundPropertyID = _ref4.boundPropertyID,
            initialValue = _ref4.initialValue,
            onSelection = _ref4.onSelection,
            onValueSet = _ref4.onValueSet;

        _classCallCheck(this, _class2);

        this.form = api.ui.ensureForm(form);

        if (this.form.isVisible) {
          this.propertySettingName = propertySettingName;
          this.action = action; // Allow use of a Group Panel or a regular one as a button container
          // TODO: Support any valid container?

          this.containerPanel = api.ui.ensureGroupPanel(containerPanel, this.form) || api.ui.ensurePanel(containerPanel);
          this.selectedStyle = api.ui.ensureStyle(selectedStyle);
          this.deselectedStyle = api.ui.ensureStyle(deselectedStyle); // Allow the specified min value count or none if not specified

          this.allowedMinValueCount = Number.parseInt(allowedMinValueCount) || 0;
          this.boundPropertyID = api.utils.toLinker(boundPropertyID);
          this.controlHelpers = new Map();
          this.lastClickedButton = null;
          this.setValues(initialValue);

          if (this.selectedStyle && this.deselectedStyle) {
            if (this.containerPanel) {
              // Wire up each button contained by the group panel to a shared event handler
              // TODO: Instead of a deep search, look specifically for components that contain a button at the first appropriate child level of the container
              var buttons = api.ui.getControlsByTypeName(this.containerPanel, "zebra.ui.dvButton", true);

              if (buttons) {
                // Allow the specified max value count or count of all possible values if not specified
                this.allowedMaxValueCount = Number.parseInt(allowedMaxValueCount) || buttons.length;
                buttons.forEach(function (button) {
                  // Create a helper for each button and map by unique ID
                  var controlHelper = new api.ui.controlHelper(button, _this2.form, action, propertySettingName);

                  _this2.controlHelpers.set(button.$hash$, controlHelper); // Bind each button's fired event to a shared handler


                  controlHelper.bind("fired", function (control) {
                    _this2._toggleButtonValue(control);

                    _this2.styleButtons();

                    api.utils.runFunction(_this2.setFormValueFromControl, null, [_this2.form]);
                    api.utils.runFunction(onSelection, null, [_this2]);
                  });

                  controlHelper.isSelected = function () {
                    return _this2.hasValue(button.label.originalText);
                  }; // Style button according to value


                  _this2.styleButton(button);
                });

                if (this.boundPropertyID) {
                  // Create a helper for the form since we need to know when a bound property value may have changed due to row selection
                  var formHelper = new api.ui.controlHelper(this.form, this.form, action, propertySettingName);
                  this.formHelper = formHelper;

                  this.setControlValueFromForm = function () {
                    // Update the button group's value with the bound field's value from the selected record
                    var gridValue = _this2.boundPropertyGridValue;
                    var value = gridValue && gridValue.getValue ? gridValue.getValue() : null;

                    if (value && typeof value !== "string" && value.toString) {
                      value = value.toString();
                    }

                    _this2.value = value;
                    api.utils.runFunction(onValueSet, null, [_this2]);
                  };

                  this.setFormValueFromControl = function () {
                    // Assign the value to the bound property
                    var gridValue = _this2.boundPropertyGridValue;

                    if (gridValue) {
                      // gridValue.setValue(this.value);
                      gridValue.displayProperties.setText(_this2.value);
                    }
                  }; // Bind future value changes


                  formHelper.bind("selectionChanged", this.setControlValueFromForm); // Set current value

                  this.setControlValueFromForm(this.form);
                }
              } else {
                var message = "There are no buttons inside Panel.";
                console.error(message, containerPanel);
                throw new Error(message);
              }
            } else {
              var _message3 = "Could not find Panel.";
              console.error(_message3, "containerPanel:", containerPanel);
              throw new Error(_message3);
            }
          } else {
            var _message4 = "You must supply styles for selected and deselected button states. See console for more details.";
            console.error(_message4, "selectedStyle:", selectedStyle, "deselectedStyle:", deselectedStyle);
            throw new Error(_message4);
          }
        } else {
          console.log("Could not create buttonGroupHelper since form is not visible.");
        }
      }

      _createClass(_class2, [{
        key: "styleButton",
        value: function styleButton(button) {
          var styleToApply = this.hasValue(button.label.originalText) ? this.selectedStyle : this.deselectedStyle;
          button.overrideStyle = styleToApply;
          api.ui.applyStyle(this.form, button, styleToApply);
        }
      }, {
        key: "styleButtons",
        value: function styleButtons() {
          var _this3 = this;

          this.controlHelpers.forEach(function (helper) {
            _this3.styleButton(helper.control);
          });
        }
      }, {
        key: "setValues",
        value: function setValues(values) {
          if (Array.isArray(values)) {
            this._values = values;
          } else if (values !== null && values !== undefined) {
            this._values = [values];
          } else {
            this._values = [];
          }
        }
      }, {
        key: "addValue",
        value: function addValue(value) {
          if (this._allowAddValue(value)) {
            this._values.push(value);
          }
        }
      }, {
        key: "removeValue",
        value: function removeValue(value) {
          if (this._allowRemoveValue(value)) {
            this._values.remove(value);
          }
        }
      }, {
        key: "hasValue",
        value: function hasValue(value) {
          return Array.isArray(this._values) ? this._values.indexOf(value) > -1 : false;
        }
      }, {
        key: "_toggleButtonValue",
        value: function _toggleButtonValue(button) {
          this.lastClickedButton = button;
          var controlHelper = this.controlHelpers.get(button.$hash$);

          if (controlHelper) {
            // Get the toggled boolean value that indicates whether the button is currently selected
            var newSelectionValue = !controlHelper.isSelected();
            var buttonValue = button.label.originalText;

            if (this.allowedMaxValueCount <= 1) {
              // Replace value if only one is allowed at a time
              if (newSelectionValue === true) {
                this.value = buttonValue;
              } else if (newSelectionValue === false && this.allowedMinValueCount < 1) {
                // Allow clearing value if no values are required
                this.value = null;
              }
            } else {
              // Update the underlying values array with the button's value
              if (newSelectionValue === true) {
                this.addValue(buttonValue);
              } else if (newSelectionValue === false) {
                this.removeValue(buttonValue);
              }
            }
          } else {
            console.error("Could not find control helper for button ", button);
          }
        }
      }, {
        key: "_allowAddValue",
        value: function _allowAddValue(value) {
          return this.valueCount + (this.hasValue(value) ? 0 : 1) <= this.allowedMaxValueCount;
        }
      }, {
        key: "_allowRemoveValue",
        value: function _allowRemoveValue(value) {
          return this.valueCount - (this.hasValue(value) ? 1 : 0) >= this.allowedMinValueCount;
        }
      }, {
        key: "valueCount",
        get: function get() {
          return Array.isArray(this._values) ? this._values.length : 0;
        }
      }, {
        key: "value",
        set: function set(values) {
          // Split comma-separated values into an array
          if (values && typeof values === "string") {
            values = values.split(",");
          }

          this.setValues(values);
          this.styleButtons();
        },
        get: function get() {
          // Return values as an array (limit as specified)
          return Array.isArray(this._values) ? this._values.join(",") : null;
        }
      }, {
        key: "values",
        get: function get() {
          return this._values || [];
        }
      }, {
        key: "boundPropertyGridValue",
        get: function get() {
          if (this.boundPropertyID && this.form && this.form.selectedRecord && this.form.selectedRecord.gridValues) {
            return this.form.selectedRecord.gridValues.getVal(this.boundPropertyID);
          } else {
            return null;
          }
        }
      }]);

      return _class2;
    }();
  }

  if (!api.ui.enhanceDateTimeControl) {
    api.ui.enhanceDateTimeControl = function (_ref5) {
      var dateTimeProperty = _ref5.dateTimeProperty,
          form = _ref5.form,
          _ref5$orientation = _ref5.orientation,
          orientation = _ref5$orientation === void 0 ? "horizontal" : _ref5$orientation,
          _ref5$gap = _ref5.gap,
          gap = _ref5$gap === void 0 ? null : _ref5$gap;
      var hostForm = api.ui.ensureForm(form);

      if (hostForm && hostForm.isVisible) {
        var dateTimeControl = api.ui.getFieldUIControl(dateTimeProperty, hostForm);

        if (dateTimeControl) {
          // Hide existing DateTime control
          dateTimeControl.textField.setVisible(false); // Helper to add components to their containers and lay them out and style them consistently

          var addComponentToContainer = function addComponentToContainer(component, container) {
            component.hAlign = zebra.layout.STRETCH;
            component.vAlign = zebra.layout.STRETCH;
            container.add(component);
            component.applyStyle(dateTimeControl.currentStyle);
            return component;
          }; // Create a container panel for replacement controls


          if (!dateTimeControl.controlsPanel) {
            dateTimeControl.controlsPanel = addComponentToContainer(api.ui.createStretchPanel(orientation, gap), dateTimeControl);
            dateTimeControl.dateTextBox = addComponentToContainer(new zebra.ui.dvDateTimeField(), dateTimeControl.controlsPanel);
            dateTimeControl.timeTextBox = addComponentToContainer(new zebra.ui.dvDateTimeField(), dateTimeControl.controlsPanel);
            dateTimeControl.dateTextBox.touch = true;
            dateTimeControl.timeTextBox.touch = true;
            dateTimeControl.textField.previousField.nextField = dateTimeControl.dateTextBox;
            dateTimeControl.dateTextBox.nextField = dateTimeControl.timeTextBox;
            dateTimeControl.dateTextBox.domInput = zebra.util.getWindow(form).getInput("datetime");
            dateTimeControl.dateTextBox.domID = dateTimeControl.dateTextBox.domInput.first().id;
            dateTimeControl.dateTextBox.previousField = dateTimeControl.textField.previousField;
            dateTimeControl.timeTextBox.nextField = dateTimeControl.textField.nextField;
            dateTimeControl.timeTextBox.domInput = zebra.util.getWindow(form).getInput("datetime");
            dateTimeControl.timeTextBox.domID = dateTimeControl.timeTextBox.domInput.first().id;
            dateTimeControl.timeTextBox.domInput.first().type = "time"; // api.ui.overlayCanvasWithElement(form.apiRef, dateTimeControl.dateTextBox, dateTimeControl.dateTextBox.domInput);
            // api.ui.overlayCanvasWithElement(form.apiRef, dateTimeControl.timeTextBox, dateTimeControl.timeTextBox.domInput);
          }

          dateTimeControl.applyStyle(dateTimeControl.currentStyle); // Populate component values

          var currentValue = Date.parse(dateTimeControl.textField.dateTimeField.getValue());

          if (currentValue) {
            dateTimeControl.dateTextBox.setValue(currentValue.toLocaleDateString());
            dateTimeControl.timeTextBox.setValue(currentValue.toLocaleTimeString());
          }
        } else {
          var message = "Could not find DateTime control. See console for more details.";
          console.error(message, "dateTimeProperty:", dateTimeProperty);
          throw new Error(message);
        }

        return dateTimeControl;
      } else {
        console.log("Form is not visible, so enhanceDateTimeControl could not be executed.");
        return null;
      }
    };
  }

  if (!api.ui.dateTimeControlHelper) {
    api.ui.dateTimeControlHelper =
    /*#__PURE__*/
    function () {
      function _class3(_ref6) {
        var _this4 = this;

        var form = _ref6.form,
            action = _ref6.action,
            control = _ref6.control,
            propertySettingName = _ref6.propertySettingName,
            boundPropertyID = _ref6.boundPropertyID,
            initialValue = _ref6.initialValue,
            textUpdated = _ref6.textUpdated,
            onValueSet = _ref6.onValueSet;

        _classCallCheck(this, _class3);

        this.form = api.ui.ensureForm(form);

        if (this.form.isVisible) {
          this.control = control;
          this.propertySettingName = propertySettingName;
          this.boundPropertyID = api.utils.toLinker(boundPropertyID);
          this.controlHelpers = new Map();
          this.value = initialValue;

          if (this.control) {
            [this.control.dateTextBox, this.control.timeTextBox].forEach(function (textBox) {
              // Create a helper for each textBox and map by unique ID
              var controlHelper = new api.ui.controlHelper(textBox, _this4.form, action, propertySettingName);

              _this4.controlHelpers.set(textBox.$hash$, controlHelper); // Bind each textBox's textUpdated event to a shared handler


              controlHelper.bind("textUpdated", function (control) {
                api.utils.runFunction(_this4.setFormValueFromControl, null, [_this4.form]);
                api.utils.runFunction(textUpdated, null, [_this4]);
              });
            });

            if (this.boundPropertyID) {
              // Create a helper for the form since we need to know when a bound property value may have changed due to row selection
              var formHelper = new api.ui.controlHelper(this.form, this.form, action, propertySettingName);
              this.formHelper = formHelper;

              this.setControlValueFromForm = function () {
                // Update the control's value with the bound field's value from the selected record
                var gridValue = _this4.boundPropertyGridValue;
                var value = gridValue && gridValue.getValue ? gridValue.getValue() : null;

                if (value && value instanceof Date && gridValue.dynamicValue && gridValue.dynamicValue.TimeZoneOffset) {
                  // Apply time zone offset to account for framework's DateTime value calculation, or it will be applied twice
                  value.addHours(gridValue.dynamicValue.TimeZoneOffset);
                }

                _this4.value = value;
                api.utils.runFunction(onValueSet, null, [_this4]);
              };

              this.setFormValueFromControl = function () {
                // Assign the value to the bound property
                var gridValue = _this4.boundPropertyGridValue;
                var controlValue = _this4.value;

                if (gridValue && controlValue.isValid()) {
                  gridValue.displayProperties.setText(controlValue);
                }
              }; // Bind future value changes


              formHelper.bind("selectionChanged", this.setControlValueFromForm); // Set current value

              this.setControlValueFromForm(this.form);
            }
          } else {
            var message = "Could not find control.";
            console.error(message, "control:", control);
            throw new Error(message);
          }
        }
      }

      _createClass(_class3, [{
        key: "value",
        set: function set(value) {
          var dateTimeValue = new Date(value);

          if (dateTimeValue.isValid()) {
            this.control.dateTextBox.setValue(dateTimeValue.toLocaleDateString());
            this.control.timeTextBox.setValue(dateTimeValue.toLocaleTimeString());
          }
        },
        get: function get() {
          return new Date("".concat(this.control.dateTextBox.getValue(), " ").concat(this.control.timeTextBox.getValue()));
        }
      }, {
        key: "boundPropertyGridValue",
        get: function get() {
          if (this.boundPropertyID && this.form && this.form.selectedRecord && this.form.selectedRecord.gridValues) {
            return this.form.selectedRecord.gridValues.getVal(this.boundPropertyID);
          } else {
            return null;
          }
        }
      }]);

      return _class3;
    }();
  }

  if (!api.ui.applyDropShadow) {
    api.ui.applyDropShadow = function (_ref7) {
      var uiControl = _ref7.uiControl,
          _ref7$shadowColor = _ref7.shadowColor,
          shadowColor = _ref7$shadowColor === void 0 ? "#888888" : _ref7$shadowColor,
          _ref7$left = _ref7.left,
          left = _ref7$left === void 0 ? 0 : _ref7$left,
          _ref7$top = _ref7.top,
          top = _ref7$top === void 0 ? 0 : _ref7$top,
          _ref7$right = _ref7.right,
          right = _ref7$right === void 0 ? 5 : _ref7$right,
          _ref7$bottom = _ref7.bottom,
          bottom = _ref7$bottom === void 0 ? 5 : _ref7$bottom,
          _ref7$shadowBlur = _ref7.shadowBlur,
          shadowBlur = _ref7$shadowBlur === void 0 ? 10 : _ref7$shadowBlur,
          _ref7$shadowOffsetX = _ref7.shadowOffsetX,
          shadowOffsetX = _ref7$shadowOffsetX === void 0 ? 5 : _ref7$shadowOffsetX,
          _ref7$shadowOffsetY = _ref7.shadowOffsetY,
          shadowOffsetY = _ref7$shadowOffsetY === void 0 ? 5 : _ref7$shadowOffsetY;

      if (!uiControl.border) {
        uiControl.setBorder(new zebra.ui.Border('transparent', 1));
      }

      var targetBorder = uiControl.border;

      targetBorder.getLeft = function () {
        return Number.parseInt(left) || 0;
      };

      targetBorder.getTop = function () {
        return Number.parseInt(top) || 0;
      };

      targetBorder.getRight = function () {
        return Number.parseInt(right) || 5;
      };

      targetBorder.getBottom = function () {
        return Number.parseInt(bottom) || 5;
      };

      targetBorder.paint = function (g, x, y, w, h, d) {
        var lineWidth = g.lineWidth;
        g.lineWidth = this.width;

        if (this.radius > 0) {
          this.outline(g, x, y, w, h, d);
        } else {
          var halfWidth = this.width / 2;
          g.beginPath();
          g.rect(x + halfWidth, y + halfWidth, w - this.width, h - this.width);
          g.closePath();
        }

        g.setColor(this.color);
        g.lineWidth = this.width;
        g.stroke();
        g.lineWidth = lineWidth;

        if (this.shadow) {
          g.shadowColor = this.shadow.color || shadowColor;
          g.shadowBlur = this.shadow.blur || Number.parseInt(shadowBlur) || 10;
          g.shadowOffsetX = this.shadow.offsetX || Number.parseInt(shadowOffsetX) || 5;
          g.shadowOffsetY = this.shadow.offsetY || Number.parseInt(shadowOffsetY) || 5;
          g.fillStyle = "white"; // TODO: Clean up magic numbers

          g.fillRect(5 + this.width, 5 + this.width, w - (6 * 2 + this.getRight()), h - (6 * 2 + this.getBottom())); // Reset shadow attributes so text label is not shadowed

          g.shadowBlur = 0;
          g.shadowColor = "black";
          g.shadowOffsetX = 0;
          g.shadowOffsetY = 0;
        }
      };

      targetBorder.shadow = {};
    };
  }

  if (!api.ui.getFieldUIControl) {
    // Returns the uiControl object for the specified property UID.

    /*
    * getFieldUIControl
    *   controlID: The name of the control or UID (string or linker) of the control's bound property to retrieve.
    *   form: The Form object containing a formController to use.
    *
    * Returns the field's UIControl drawn on the specified view.
    */
    api.ui.getFieldUIControl = function (controlID, form) {
      // If form is not specified, use the current form.
      if (form === null || form === undefined) {
        form = self().raw;
      } else {
        form = api.ui.ensureForm(form);
      }

      if (form && form.isVisible) {
        var field = form.findControl(controlID) || form.findControl(api.utils.toLinker(controlID));

        if (field) {
          if (field.raw) {
            return field.raw;
          }

          if (field["$hash$"]) {
            return field;
          }
        } else {
          console.log("No field UI Control was found for getFieldUIControl('", controlID, "'). Be sure the field is bound to a form control.");
          console.log(controlID);
          return null;
        }
      } else {
        console.log("No form specified and no 'current form'...getFieldUIControl('", controlID, "'), or form is hidden.");
        console.log(controlID);
        return null;
      }
    };
  }

  if (!api.ui.getButtonUIControl) {
    api.ui.getButtonUIControl = function (taskID, form) {
      // If form is not specified, use the current form.
      if (form === null || form === undefined) {
        form = self().raw;
      }

      if (form !== null) {
        // Get the specified button using its ID from the formController (which contains all of the UI Controls).
        var button = form.formController.formActions.getVal(taskID); // Get the uiControl for the button.

        if (button && button.uiControl && Array.isArray(button.uiControl) && button.uiControl.length) {
          return button.uiControl[0];
        } else {
          console.log("No button UI Control was found for getButtonUIControl('", taskID, "'). Be sure the button is bound to a form task.");
          console.log(taskID);
          return null;
        }
      } else {
        console.log("No form specified and no 'current form'...getButtonUIControl('", taskID, "').");
        console.log(taskID);
        return null;
      }
    };
  }

  if (!api.ui.getControlPosition) {
    /*
    * getControlTopLeftInSection
    *   uiControl: The target uiControl to locate.
    *   relativeToPanel: The parent panel to which the relative left and top are measured. Usually the main layout panel of the formControler (mvc.formController.uiControl).
    *
    * Returns the position of the specified uiControl on the form layout relative to the specified parent panel..PW
    */
    api.ui.getControlPosition = function (uiControl, relativeToPanel) {
      // Create the result position object.
      var resPosition = {
        left: 0,
        top: 0
      }; // Verify the uiControl is not null.

      if (uiControl !== null) {
        // Recursively search the parent panels and track the left and top values.
        while (uiControl.parent !== null && uiControl !== relativeToPanel) {
          resPosition.top += uiControl.y;
          resPosition.left += uiControl.x;
          uiControl = uiControl.parent;
        }
      } // Return the resulting position.


      return resPosition;
    };
  }

  if (!api.ui.getFieldCoordinates) {
    api.ui.getFieldCoordinates = function (controlID, form) {
      // Get the property UI Control object
      var field = api.ui.getFieldUIControl(controlID, form);

      if (field) {
        // Store the root panel for the form (containing the entire form layout).
        var rootPanel = form.topMVC; // Get the UI Control's position and size.

        var position = api.ui.getControlPosition(field, rootPanel);

        if (position) {
          var coordinates = {
            top: position.top + field.top,
            left: position.left + field.left,
            width: field.width - (field.left + field.right),
            height: field.height - (field.top + field.bottom),
            absoluteRight: field.right,
            absoluteBottom: field.bottom
          };
          return coordinates;
        } else {
          console.log("getFieldCoordinates: Unable to get control position.");
        }
      } else {
        console.log("getFieldCoordinates: Unabled to find form field for property UID: ", controlID);
      }

      return null;
    };
  }

  if (!api.ui.removeOverlay) {
    /**
     * Removes a DOM element.
     * @param {string|object}    overlay    Either the string identifier of the DOM element or the object itself.
     */
    api.ui.removeOverlay = function (overlay) {
      var id;

      if (typeof overlay === "string") {
        id = overlay;
      } else if (_typeof(overlay) === "object") {
        id = overlay.id;
      }

      var element = document.getElementById(id);

      if (element) {
        element.parentNode.removeChild(element);
      }
    };
  }

  if (!api.ui.removeAllOverlays) {
    /**
     * Removes all DOM elements that have been overlaid using one of the api.ui.overlay helper functions.
     */
    api.ui.removeAllOverlays = function () {
      var elements = document.getElementsByClassName(overlayClassName);

      if (elements) {
        _toConsumableArray(elements).forEach(function (element) {
          return api.ui.removeOverlay(element);
        });
      }
    };
  }

  if (!api.ui.overlayFieldWithElement) {
    /*
    * Overlays the specified field on the specified form with a new DOM element.
    * @param {string|object}    controlID      The name of the control or UID (string or linker) of the control's bound property to retrieve.
    * @param {object}           form           The form on which the property is hosted.
    * @param {string}           id             An identifier that the element will be tagged with.
    * @param {string[div]}      elementType    The type of DOM element to created. Defaults to div.
    * @returns {DOMElement}                    The new element for additional modification.
    */
    api.ui.overlayFieldWithElement = function (controlID, form, id) {
      var elementType = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : "div";
      var coordinates = api.ui.getFieldCoordinates(controlID, form);

      if (coordinates) {
        // Create a new element.
        var newElement = document.createElement(elementType);
        newElement.id = id;
        newElement.style = getOverlayStyle(coordinates); // Add a class that allows easy identification of overlaid items

        newElement.classList.add(overlayClassName); //Add the element to the html element of the specified form.

        form.formController.uiControl.getCanvas().canvas.parentElement.appendChild(newElement); // Return the element for additional use.

        return newElement;
      }

      return null; // Return null if unable to overlay the element.
    };
  }

  if (!api.ui.overlayFieldWithDiv) {
    api.ui.overlayFieldWithDiv = function (controlID, form, id) {
      return api.ui.overlayFieldWithElement(controlID, form, id);
    };
  }

  if (!api.ui.overlayFieldWithVideo) {
    api.ui.overlayFieldWithVideo = function (controlID, form, id, source) {
      var controls = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : true;
      var autoplay = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : true;
      var loop = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : true;
      var newElement = api.ui.overlayFieldWithElement(controlID, form, id, "video");
      newElement.src = source;
      newElement.controls = controls;
      newElement.autoplay = autoplay;
      newElement.loop = loop;
      return newElement;
    };
  }

  if (!api.ui.overlayFieldWithIframe) {
    /*
    * Overlays the specified field on the specified form with a new <iFrame> tag.
    * Returns the new <iFrame> tag object for additional modification.
    */
    api.ui.overlayFieldWithIframe = function (controlID, form) {
      // Get the property UI Control object.
      var fld = api.ui.getFieldUIControl(controlID, form);

      if (fld !== null) {
        // Store the root panel for the form (containing the entire form layout).
        var rootPanel = form.formController.uiControl; // Get the UI Controls position and size.

        var position = api.ui.getControlPosition(fld, rootPanel);

        if (position !== null) {
          // Create a new iFrame object.
          var iFrame = document.createElement("iframe");
          var t = position.top + fld.top;
          var l = position.left + fld.left;
          var w = fld.width - (fld.left + fld.right);
          var h = fld.height - (fld.top + fld.bottom); //Absolute position is needed on the main container of html elements in order to overlay the canvas.

          iFrame.style = "position:absolute;background-color:#ffffff;display:inline-block;padding-bottom:30px;border:none;top:".concat(t, "px;left:").concat(l, "px;width:").concat(w, "px;height:").concat(h, "px;"); //Add the iFrame to the html element of the specified form.

          form.window.canvas.canvas.parentElement.appendChild(iFrame);
          return iFrame; // Return the iFrame for additional use.
        } else {
          console.log("overlayFieldWithIframe: Unable to get control position.");
        }
      } else {
        console.log("Unable to find form field for property UID: " + controlID);
      }

      return null; // Return null if unable to overlay the iFrame.
    };
  }

  if (!api.ui.getCoordinatesForPropertyDropDown) {
    /**
     * Gets a position where a drop-down can be placed directly under a control bound to a property on a form.
     * @param {Object} formID        A numeric ID, UID or linker ({ UID: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", Type: "View" }) that identifies the form.
     * @param {Object} controlID     The name of the control or UID (string or linker) of the control's bound property to retrieve.
     * @returns {Object}             Coordinates { top, left, width, height } directly under the field's control.
     */
    api.ui.getCoordinatesForPropertyDropDown = function (formID, controlID) {
      // Get the form (it should already be open)
      var form = api.utils.getOpenForm(formID); // Get the position of the field bound to the property

      var fieldCoordinates = api.ui.getFieldCoordinates(controlID, form);
      fieldCoordinates.top += fieldCoordinates.height;
      return fieldCoordinates;
    };
  }

  if (!api.ui.getDefaultForm) {
    // TODO: When implementing this in the core code, note that current returns null if a designer is open;
    //       therefore, we may want to hold a reference to the most recently active view and return that
    //       prior to returning last() which is always the most recently opened view sorted by original
    //       instantiation time, not activation time...JH

    /*
    * Returns the active form if there is one, starting from the context of the current expression, if any; otherwise returns the one that was last instantiated.
    */
    api.ui.getDefaultForm = function () {
      var form = null;

      try {
        form = self();

        if (!form || !form.formController) {
          form = null;
        }
      } catch (exception) {}

      if (!form) {
        var getFormFromCurrentExpression = function getFormFromCurrentExpression() {
          if (app.dv.helpers.exprEng.currexpression) {
            return app.dv.helpers.exprEng.currexpression.mvc;
          } else {
            return null;
          }
        };

        var getLastOpenForm = function getLastOpenForm() {
          try {
            return api.openForms.last().raw;
          } catch (exc) {}
        };

        var getActiveForm = function getActiveForm() {
          try {
            return api.openForms.active.raw;
          } catch (exc) {}
        };

        form = getFormFromCurrentExpression() || getActiveForm() || getLastOpenForm();
      }

      return api.ui.ensureForm(form);
    };
  }

  if (!api.ui.getDefaultView) {
    // Alias View -> Form
    api.ui.getDefaultView = api.ui.getDefaultForm;
  }

  if (!api.ui.getGroupPanelByHeaderText) {
    /**
     * Search for a Group Panel by its header text. Searches recurseivly on the form.
     * @param {Text} headerText                        The exact Header Text of the panel to find.
     * @param {Object} form                            The API reference to a form (MVC). Use api.openForms.active for the current form.
     * @returns {Panel}                                The matching panel object, if any.
     */
    api.ui.getGroupPanelByHeaderText = function (headerText, form) {
      var formToUse = form.raw ? form : form.apiRef;

      if (formToUse && formToUse.raw && formToUse.raw.formController) {
        return api.ui.getLayoutItemByName(headerText, formToUse.raw.formController.uiControl);
      } else {
        return null;
      }
    };
  }

  if (!api.ui.getLayoutItemByName) {
    api.ui.getLayoutItemByName = function (name, panelToSearch) {
      var matchingPanel = null;

      var searchPanel = function searchPanel(panel) {
        if (matchingPanel != null) {
          return; // Stop seaching, we found it..PW
        } // Include the panel itself in the search since we might be starting somewhere inside the top-level panel


        panel.kids.forEach(function (p) {
          if (p.definition && p.definition.Name === name) {
            //We have a match, return the panel..PW
            matchingPanel = p;
          } else {
            // Keep searching..PW
            searchPanel(p);
          }
        });
      };

      searchPanel(panelToSearch); //Begin seraching..PW

      return matchingPanel;
    };
  }

  if (!api.ui.getStylableControlOrForm) {
    /**
     * Get a UI control (or form if control is nothing) that has styles and applyStyle method from an identifier.
     * @param   {object}        form            The API reference to an open form (MVC).
     * @param   {object|number} control         The control or its ID (relative to form) whose styles should be manipulated.
     * @returns {type}                          A component that can be styled.
     */
    api.ui.getStylableControlOrForm = function (form, control) {
      var uiControlToStyle = control;

      if (!control) {
        // If no control or ID was passed, assume we're styling the form, and get its stylable component
        uiControlToStyle = form.formController ? form.formController.uiControl : null;
      } else if (control.uiControl) {
        uiControlToStyle = control.uiControl;
      } else if (!control.currentStyle) {
        // Get the underlying stylable component by a control's ID if that's what was passed in
        var typeOfControl = _typeof(control);

        if (typeOfControl === "number") {
          // Numeric ID is a button
          uiControlToStyle = api.ui.getButtonUIControl(control, form);
        } else if (typeOfControl === "string" || typeOfControl === "object") {
          // String/UID is a field
          uiControlToStyle = api.ui.getFieldUIControl(control, form);
        }
      }

      return uiControlToStyle;
    };
  }

  if (!api.ui.setControlVisibility) {
    /**
     * Shows or hides a control.
     * @param   {object}        form            The API reference to an open form (MVC).
     * @param   {object|number} control         The control or its ID (relative to form) that should be manipulated.
     * @param   {boolean}       visible         Pass true to show; false to hide.
     * @returns {type}                          A component that can be hidden.
     */
    api.ui.setControlVisibility = function (form, control, visible) {
      var uiControl = api.ui.getStylableControlOrForm(form, control);

      if (uiControl && uiControl.setVisible) {
        return uiControl.setVisible(visible);
      }

      return null;
    };
  }

  if (!api.ui.hideControl) {
    /**
     * Hides a control.
     * @param   {object}        form            The API reference to an open form (MVC).
     * @param   {object|number} control         The control or its ID (relative to form) that should be manipulated.
     * @returns {type}                          A component that can be hidden.
     */
    api.ui.hideControl = function (form, control) {
      return api.ui.setControlVisibility(form, control, false);
    };
  }

  if (!api.ui.showControl) {
    /**
     * Shows a control.
     * @param   {object}        form            The API reference to an open form (MVC).
     * @param   {object|number} control         The control or its ID (relative to form) that should be manipulated.
     * @returns {type}                          A component that can be hidden.
     */
    api.ui.showControl = function (form, control) {
      return api.ui.setControlVisibility(form, control, true);
    };
  }

  if (!api.ui.applyStyle) {
    /**
     * Apply a style to a form or control, and refresh its appearance.
     * @param   {object}        form            The API reference to an open form (MVC).
     * @param   {object|number} control         The control or its ID (relative to form) whose styles should be manipulated.
     * @param   {object|string} style           The style or its UID that should be applied.
     */
    api.ui.applyStyle = function (form, control, style) {
      if (typeof style === "string" || _typeof(style) === "object" && !style.Definition) {
        // Get a style reference by its UID if that's what was passed
        style = api.ui.getStyleFromUID(style);
      }

      var uiControlToStyle = api.ui.getStylableControlOrForm(form, control);

      if (uiControlToStyle) {
        // Get the style definition and clone it, then merge it with the control's current style and apply it; Note that mergeStyles makes clones of the styles passed to it.
        var mergedStyle = app.dv.mvc.formController.mergeStyles(uiControlToStyle.currentStyle, style); // need the form controller to deal with expressions.

        uiControlToStyle.applyStyle(mergedStyle, (form.raw || form).formController);
      }
    };
  }

  if (!api.ui.applyDefaultStyle) {
    /**
     * Apply the environment's currently configured default style to a form or control, and refresh its appearance.
     * @param   {object}        form            The API reference to an open form (MVC).
     * @param   {object|number} control         The control or its ID (relative to form) whose styles should be manipulated.
     */
    api.ui.applyDefaultStyle = function (form, control) {
      api.ui.applyStyle(form, control, api.ui.getDefaultStyle());
    };
  }

  if (!api.ui.resetStyles) {
    /**
    * Apply the originally configured styles to a form or control, and refresh its appearance.
    * @param   {object}        form            The API reference to an open form (MVC).
    * @param   {object|number} control         The control or its ID (relative to form) whose styles should be manipulated.
    */
    api.ui.resetStyles = function (form, control) {
      var uiControlToStyle = api.ui.getStylableControlOrForm(form, control);
      uiControlToStyle.resetStyle();
      var parentStyle = uiControlToStyle.parent && uiControlToStyle.parent.currentStyle ? uiControlToStyle.parent.currentStyle : api.ui.getDefaultStyle();
      uiControlToStyle.currentStyle = app.dv.mvc.formController.mergeStyles(parentStyle, uiControlToStyle.definition.Styles);
      uiControlToStyle.applyStyle(uiControlToStyle.currentStyle);
    };
  }

  if (!api.ui.getStyleFromUID) {
    /**
     * Get a style from its global identifier.
     * @param   {string|object}        UID     The unique identifier of the style as a string or linker.
     * @returns {object}                       The identified style.
     */
    api.ui.getStyleFromUID = function (UID) {
      var linker = UID;

      if (typeof UID === "string") {
        linker = {
          UID: UID
        };
      }

      return app.dv.cache.styles.allStyles.getVal(linker);
    };
  }

  if (!api.ui.getDefaultStyle) {
    /**
     * Gets the environment's default style from configuration settings.
     * @returns {object}                        The default style object.
     */
    api.ui.getDefaultStyle = function () {
      return api.ui.getStyleFromUID(app.dv.cache.session.configEntity.ConfigValue.SavedThemes.find(function (theme) {
        return theme.IsCurrent;
      }).DefaultStyle);
    };
  }

  if (!api.ui.ensureStyle) {
    /**
     * Ensure that the passed object is a Style, getting one from passed UID, if not.
     * @param   {object|string|Linker}    style    A Style, or a string/Linker UID that represents one.
     * @returns {object}                           A Style object.
     */
    api.ui.ensureStyle = function (style) {
      if (!style || style.clientProperties && style.clientProperties.entityType === "Style") {
        return style;
      } else {
        return api.ui.getStyleFromUID(style);
      }
    };
  }

  if (!api.ui.ensureGroupPanel) {
    /**
     * Ensure that the passed object is a Group Panel, getting one from passed UID and form, if not.
     * @param   {object|string|Linker}    panel    A Group Panel, or a string/Linker UID that represents one.
     * @param   {object}                  panel    A Form that hosts the Group Panel.
     * @returns {object}                           A Group Panel object.
     */
    api.ui.ensureGroupPanel = function (panel, form) {
      if (!panel || panel.typeName === "zebra.ui.dvGroupPanel") {
        return panel;
      } else {
        return form.findControl(panel);
      }
    };
  }

  if (!api.ui.ensurePanel) {
    /**
     * Ensure that the passed object is a Panel, creating one, if not.
     * @param   {object|string|Linker}    panel    A Panel.
     * @param   {boolean[=true]}          create   Pass true to create a new panel if the object passed is not one.
     * @returns {object}                           A Panel object.
     */
    api.ui.ensurePanel = function (panel) {
      var create = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

      if (panel && panel.typeName === "zebra.ui.dvPanel") {
        return panel;
      } else {
        return create ? new zebra.ui.dvPanel() : null;
      }
    };
  }

  if (!api.ui.ensureCheckbox) {
    /**
     * Ensure that the passed object is a ComboBox, getting one from passed UID and form, if not.
     * @param   {object|string|Linker}    panel    A ComboBox, or a string/Linker UID that represents one.
     * @param   {object}                  panel    A Form that hosts the ComboBox.
     * @returns {object}                           A ComboBox object.
     */
    api.ui.ensureCheckbox = function (checkbox, form) {
      if (!checkbox || checkbox.typeName === "zebra.ui.dvLayoutItem" && checkbox.checkboxField) {
        return checkbox;
      } else {
        return api.ui.getFieldUIControl(checkbox, form);
      }
    };
  }

  if (!api.ui.ensureComboBox) {
    /**
     * Ensure that the passed object is a ComboBox, getting one from passed UID and form, if not.
     * @param   {object|string|Linker}    panel    A ComboBox, or a string/Linker UID that represents one.
     * @param   {object}                  panel    A Form that hosts the ComboBox.
     * @returns {object}                           A ComboBox object.
     */
    api.ui.ensureComboBox = function (combobox, form) {
      if (!combobox || combobox.typeName === "zebra.ui.dvComboBox") {
        return combobox;
      } else {
        return api.ui.getFieldUIControl(combobox, form);
      }
    };
  }

  if (!api.ui.ensureDateTimeTextBox) {
    /**
     * Ensure that the passed object is a DateTime TextBox, getting one from passed UID and form, if not.
     * @param   {object|string|Linker}    panel    A DateTime TextBox, or a string/Linker UID that represents one.
     * @param   {object}                  panel    A Form that hosts the DateTime TextBox.
     * @returns {object}                           A DateTime TextBox object.
     */
    api.ui.ensureDateTimeTextBox = function (dateTimeTextBox, form) {
      if (!dateTimeTextBox || dateTimeTextBox.textField && dateTimeTextBox.textField.dateTimeField) {
        return dateTimeTextBox;
      } else {
        return api.ui.getFieldUIControl(dateTimeTextBox, form);
      }
    };
  }

  if (!api.ui.ensureForm) {
    /**
     * Ensure that the passed object is a Form, getting one from passed UID, if not.
     * @param   {object|string|Linker}    form    A Form, or a string/Linker UID that represents one.
     * @returns {object}                          A Form object.
     */
    api.ui.ensureForm = function (form) {
      if (form.typeName === "app.dv.mvc") {
        return form;
      } else if (form instanceof api.factory.View) {
        return form.raw;
      } else {
        return api.utils.getOpenForm(form);
      }
    };
  }

  if (!api.ui.ensureKids) {
    /**
     * Get to the controls ("kids") collection from any of the following:
     *     api.openForms.active.raw.formController.uiControl.kids
     *     api.openForms.active.raw.formController.uiControl
     *     api.openForms.active.raw.formController
     *     api.openForms.active.raw
     *     api.openForms.active
     * @param   {object|Array}        container     A container or collection of controls.
     * @returns {array}                             An array of controls from a form or the value passed in if alreay a container.
     */
    api.ui.ensureKids = function (container) {
      var kidsCollection = container;

      if (kidsCollection && !Array.isArray(kidsCollection)) {
        if (kidsCollection.raw) kidsCollection = kidsCollection.raw;
        if (kidsCollection.typeName === "app.dv.mvc") kidsCollection = kidsCollection.formController;
        if (!kidsCollection.typeName && kidsCollection.uiControl) kidsCollection = kidsCollection.uiControl;
        if (kidsCollection.kids) kidsCollection = kidsCollection.kids;
      }

      return kidsCollection;
    };
  }

  if (!api.ui.flattenControls) {
    /**
     * Flatten all controls ("kids") as an array from any of the following:
     *     api.openForms.active.raw.formController.uiControl.kids
     *     api.openForms.active.raw.formController.uiControl
     *     api.openForms.active.raw.formController
     *     api.openForms.active.raw
     *     api.openForms.active
     * @param   {object|Array}        container     A container or collection of controls.
     * @returns {array}                             An array of controls and all descendent controls recursively from a form or container of controls.
     *                                              The resulting container's elements will still have their full hierarchy.
     */
    api.ui.flattenControls = function (container) {
      var kids = api.ui.ensureKids(container);
      var controls = [];
      kids.forEach(function (control) {
        if (control.kids && Array.isArray(control.kids) && control.kids.length) {
          controls.push(control);
          var moreKids = api.ui.flattenControls(control.kids);
          controls = controls.concat(moreKids);
        }
      });
      return controls;
    };
  }

  if (!api.ui.getControlsByTypeName) {
    /**
     * Get controls of a specified typeName from any of the following:
     *     api.openForms.active.raw.formController.uiControl.kids
     *     api.openForms.active.raw.formController.uiControl
     *     api.openForms.active.raw.formController
     *     api.openForms.active.raw
     *     api.openForms.active
     * @param   {object|Array}        container     A container or collection of controls.
     * @param   {string}              typeName      The type name to match.
     * @param   {boolean[false]}      deepSearch    Pass true to search recursively.
     * @returns {array}                             An array of controls with a given typeName from a form or container of controls.
     */
    api.ui.getControlsByTypeName = function (container, typeName) {
      var deepSearch = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      var kids = api.ui.ensureKids(container);

      if (deepSearch) {
        kids = api.ui.flattenControls(kids);
      }

      return kids.filter(function (k) {
        return k.typeName === typeName;
      });
    };
  }

  if (!api.ui.getControlsByLabel) {
    /**
     * Get controls with a specified label from any of the following:
     *     api.openForms.active.raw.formController.uiControl.kids
     *     api.openForms.active.raw.formController.uiControl
     *     api.openForms.active.raw.formController
     *     api.openForms.active.raw
     *     api.openForms.active
     * @param   {object|Array}        container     A container or collection of controls.
     * @param   {string}              label         The label to match.
     * @param   {boolean[false]}      deepSearch    Pass true to search recursively.
     * @returns {array}                             An array of controls with a given label from a form or container of controls.
     */
    api.ui.getControlsByLabel = function (container, label) {
      var deepSearch = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      var kids = api.ui.ensureKids(container);

      if (deepSearch) {
        kids = api.ui.flattenControls(kids);
      }

      return kids.filter(function (k) {
        return k.label && api.utils.runFunction(k.label.getValue, k.label) === label;
      });
    };
  }

  if (!api.ui.getControlsByID) {
    /**
     * Get controls with a specified id from any of the following:
     *     api.openForms.active.raw.formController.uiControl.kids
     *     api.openForms.active.raw.formController.uiControl
     *     api.openForms.active.raw.formController
     *     api.openForms.active.raw
     *     api.openForms.active
     * @param   {object|Array}        container     A container or collection of controls.
     * @param   {string}              id            The id to match.
     * @param   {boolean[false]}      deepSearch    Pass true to search recursively.
     * @returns {array}                             An array of controls with a given id from a form or container of controls.
     */
    api.ui.getControlsByID = function (container, id) {
      var deepSearch = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      var kids = api.ui.ensureKids(container);

      if (deepSearch) {
        kids = api.ui.flattenControls(kids);
      }

      return kids.filter(function (k) {
        return k.id === id;
      });
    };
  }

  if (!api.ui.getControlsOfType) {
    /**
     * Get controls of a specified type (using instanceof operator) from any of the following:
     *     api.openForms.active.raw.formController.uiControl.kids
     *     api.openForms.active.raw.formController.uiControl
     *     api.openForms.active.raw.formController
     *     api.openForms.active.raw
     *     api.openForms.active
     * @param   {object|Array}        container     A container or collection of controls.
     * @param   {type}                type          The type to match.
     * @param   {boolean[false]}      deepSearch    Pass true to search recursively.
     * @returns {array}                             An array of controls of a given type from a form or container of controls.
     */
    api.ui.getControlsOfType = function (container, type) {
      var deepSearch = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      var kids = api.ui.ensureKids(container);

      if (deepSearch) {
        kids = api.ui.flattenControls(kids);
      }

      return kids.filter(function (k) {
        return k instanceof type;
      });
    };
  }

  if (!api.ui.applyBoxShadow) {
    api.ui.applyBoxShadow = function (apiForm, apiControl, boxShadow) {
      var divShadow = document.createElement("div");
      divShadow.style.boxShadow = boxShadow || "rgba(0, 0, 0, 0.3) 0px 2px 4px 0px";

      if (apiControl.raw.border) {
        divShadow.style.borderRadius = "".concat(apiControl.raw.border.radius, "px");
      }

      divShadow.style.background = "transparent";
      divShadow.style.pointerEvents = "none";
      api.ui.overlayCanvasWithElement(apiForm, apiControl, divShadow);
      apiControl.raw.divShadow = divShadow;
    };
  }

  if (!api.ui.overlayCanvasWithElement) {
    api.ui.overlayCanvasWithElement = function (apiForm, apiControl, element) {
      var domElement = element;

      if (typeof element === "string") {
        // Create an actual DOM element if a string was passed in
        domElement = document.createElement("div");
        domElement.style.background = "transparent";
        domElement.style.overflowY = "auto";
        domElement.innerHTML = element; // Add a class that allows easy identification of overlaid items

        domElement.classList.add(overlayClassName);
      }

      var rawCtl = apiControl.raw;
      var scrollPnl = findScrollPanel(rawCtl);
      var scrollMgr = null;

      if (scrollPnl != null) {
        scrollMgr = scrollPnl.scrollManager;
      } // Append the element to the top-level form's work area div


      setElementPos(zebra.util.getAbsolutePosition(rawCtl), rawCtl);
      var formWindow = apiForm.raw.topMVC.window;
      formWindow.workarea.baseElement.appendChild(domElement);

      rawCtl.laidout = function (e) {
        setElementPos(zebra.util.getAbsolutePosition(rawCtl), rawCtl);
      };

      formWindow.on("winResize", function (e) {
        setElementPos(zebra.util.getAbsolutePosition(rawCtl), rawCtl);
      });

      if (scrollMgr && scrollMgr.target) {
        scrollMgr.target.catchScrolled = rawCtl.laidout;
      }

      function setElementPos(controlPos, rawCtl) {
        var elementStyle = domElement.style;
        elementStyle.position = "absolute";

        if (scrollMgr != null) {
          if (scrollMgr.sx < 0) {} else {
            elementStyle.left = "".concat(controlPos.x, "px");
            elementStyle.width = "".concat(rawCtl.width, "px");
          }

          var scrollPnlPos = zebra.util.getAbsolutePosition(scrollPnl);

          if (scrollMgr.sy < 0) {
            if (scrollPnlPos.y === 0) {
              elementStyle.top = "".concat(controlPos.y, "px");
              elementStyle.height = "".concat(rawCtl.height, "px");
            } else {
              controlPos.y -= scrollMgr.sy;
              elementStyle.top = "".concat(controlPos.y, "px");
              elementStyle.height = "".concat(scrollPnl.height, "px");
            }
          } else {
            elementStyle.top = "".concat(controlPos.y, "px");

            if (scrollPnlPos.y === 0) {
              elementStyle.height = "".concat(rawCtl.height, "px");
            } else {
              elementStyle.height = "".concat(scrollPnl.height, "px");
            }
          }
        } else {
          elementStyle.left = "".concat(controlPos.x, "px");
          elementStyle.width = "".concat(rawCtl.width, "px");
          elementStyle.top = "".concat(controlPos.y, "px");
          elementStyle.height = "".concat(rawCtl.height, "px");
        }
      }

      function findScrollPanel(rawCtl) {
        if (rawCtl.parent == null) {
          return null;
        }

        if (rawCtl.scrollManager != null) {
          return rawCtl;
        } else {
          return findScrollPanel(rawCtl.parent);
        }
      }

      return domElement;
    };
  }
});
//# sourceMappingURL=ui.js.map