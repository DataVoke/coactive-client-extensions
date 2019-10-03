/**
 * Custom Action: Extend api.ui
 * Extends the api.ui namespace with additional helper functions.
 * Dependencies:
 *    api.loadExtension
 *    api.bindingsRegistry.register
 *    api.bindingsRegistry.deregister
 *    api.utils.toLinker
 */
api.loadExtension("api.ui", () => {
    const overlayClassName = "overlayFieldWithElement";

    const getOverlayStyle = coordinates => {
        //Absolute position is needed on the main container of html elements in order to overlay the canvas. It also allows anchoring the bottom right coordinates to handle window resizing.
        return `position:absolute;display:inline-block;resize:both;top:${coordinates.top}px;left:${coordinates.left}px;right:${coordinates.absoluteRight}px;bottom:${coordinates.absoluteBottom}px;`;
    };

    /**
     * A helper used to determine if a control is of a given type to access its underlying edit control, and to access event binding components.
     */
    class ControlBindingHelper {
        constructor({ isOne, editControlAccessor, events }) {
            this._isOne = isOne;
            this._editControlAccessor = editControlAccessor;
            this._events = events;
        }

        /**
         * Gets a function that returns a boolean value indicating whether the control is of a given type.
         */
        get isOne() {
            return this._isOne;
        }

        /**
         * Gets a functon that returns the component edit control of a given type.
         */
        get editControlAccessor() {
            return this._editControlAccessor;
        }

        /**
         * Gets a map of binding details and helper functions for the various events that a given control can fire.
         */
        get events() {
            return this._events;
        }
    }

    /**
     * A map of helper functions and event binding configurations for a specific type of control (e.g. TextField, ComboBox).
     */
    const controlMap = new Map([
        ["Form", new ControlBindingHelper({
            isOne: form => form.typeName === "app.dv.mvc",
            editControlAccessor: form => form,
            events: {
                "selectionChanged": {
                    nativeEventName: "selectionChanged",
                    targetAccessor: form => form,
                },
            }
        })],
        ["TextField", new ControlBindingHelper({
            isOne: control => control.textField && (control.textField.typeName === "zebra.ui.dvTextField" || control.textField.typeName === "zebra.ui.dvNumberField"),
            editControlAccessor: control => control.textField,
            events: {
                "textUpdated": {
                    nativeEventName: "textUpdated",
                    targetAccessor: editControl => editControl.view.target,
                },
            },
        })],
        ["DateTimeField", new ControlBindingHelper({
            isOne: control => control.typeName === "zebra.ui.dvDateTimeField",
            editControlAccessor: control => control,
            events: {
                "textUpdated": {
                    nativeEventName: "textUpdated",
                    targetAccessor: editControl => editControl.view.target,
                },
            },
        })],
        ["ComboBox", new ControlBindingHelper({
            isOne: control => control.comboBox && control.comboBox.typeName === "zebra.ui.dvComboBox",
            editControlAccessor: control => control.comboBox,
            events: {
                "textUpdated": {
                    nativeEventName: "textUpdated",
                    targetAccessor: editControl => editControl.content.textField.view.target,
                },
                "itemSelected": {
                    nativeEventName: "",
                    targetAccessor: editControl => editControl,
                },
                "clicked": {
                    nativeEventName: "onClick",
                    targetAccessor: editControl => editControl.content.textField,
                }
            },
        })],
        ["Button", new ControlBindingHelper({
            isOne: control => control.typeName === "zebra.ui.dvButton",
            editControlAccessor: control => control,
            events: {
                "fired": {
                    nativeEventName: "fired",
                    targetAccessor: editControl => editControl,
                },
            },
        })],
        // TODO: Checkbox configuration needs to be verified and/or modified/fully implemented
        ["Checkbox", new ControlBindingHelper({
            isOne: control => control.checkboxField && contro.lcheckboxField.typeName === "zebra.ui.dvCheckbox" ,
            editControlAccessor: control => control.checkboxField,
            events: {
                "fired": {
                    nativeEventName: "fired",
                    targetAccessor: editControl => editControl,
                },
            },
        })],
    ]);

    /**
     * A map of event handlers corresponding to a public event name. The corresponding handler is called internally when
     * the associated bound event fires. It is passed an optional custom handler function that will be called after any
     * internal housekeeping is done.
     */
    const internalEventHandlers = new Map([
        ["selectionChanged", (editControl, handler) => {
            api.utils.runFunction(handler, null, [ editControl ]);
        }],
        ["textUpdated", (editControl, handler) => {
            if (!editControl.hasFocus()) {
                // Don't do anything if the control doesn't have focus
                // (further propagation can cause an endless loop if grid cell is updating the field's text)
                return;
            }

            // Execute the provided handler, passing it the edit control
            api.utils.runFunction(handler, null, [ editControl ]);
        }],
        ["itemSelected", (editControl, handler) => {
            if (!editControl.hasFocus()) {
                // Don't do anything if the control doesn't have focus
                // (further propagation can cause an endless loop if grid cell is updating the field's text)
                return;
            }

            // Execute the provided handler, passing it the edit control
            api.utils.runFunction(handler, null, [ editControl ]);
        }],
        ["clicked", (editControl, handler) => {
            api.utils.runFunction(handler, null, [ editControl ]);
        }],
        ["fired", (editControl, handler) => {
            api.utils.runFunction(handler, null, [ editControl ]);
        }],
    ]);

    if (!api.ui.controlHelper) {
        /**
         * A helper object that can be used to bind events to a control.
         */
        api.ui.controlHelper = class {
            /**
             * Constructs a helper that can be used to bind events to a control.
             * @param  {object}    control                The control instance.
             * @param  {object}    form                   The form that hosts the control instance.
             * @param  {object}    action                 Optionally, the custom action that is using the helper.
             * @param  {string}    propertySettingName    Optionally, the name of the setting on the action that
             *                                            identifies the property associated with any bindings.
             */
            constructor(control, form, action, propertySettingName) {
                this.control = control;
                this.form = form.raw ? form.raw : form;
                this.propertySettingName = propertySettingName;
                this.action = action;
                for (let [type, helpers] of controlMap.entries()) {
                    if (helpers.isOne(control)) {
                        this.type = type;
                        this._helpers = helpers;
                        this.editControl = helpers.editControlAccessor(this.control);
                        break;
                    }
                }
            }

            /**
             * Gets the underlying target of a specific event for the control.
             * @param {string}        eventName        The event name that was previously bound.
             * @returns {object}                       The underlying target component for the specific control and event.
             */
            getEventTarget(eventName) {
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
            getEvent(eventName) {
                const events = this._helpers.events;
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
            getBindingKey(eventName) {
                const components = [];
                if (this.form) {
                    components.push(["Form", this.form.drivingView.UID].join(":"));
                }
                if (this.action) {
                    const actionLinker = this.action.ActionID;
                    if (actionLinker) {
                        components.push([actionLinker.Type, actionLinker.UID].join(":"));
                    }
                    if (this.propertySettingName && this.action.Settings) {
                        const propertyLinker = this.action.Settings[this.propertySettingName];
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
            bind(eventName, customHandler, delay = 0) {
                const event = this.getEvent(eventName);
                const internalEventHandler = internalEventHandlers.get(eventName);
                const eventTarget = this.getEventTarget(eventName);
                let timeout = null;
                const invokeInternalHandler = () => {
                    window.clearTimeout(timeout);
                    timeout = window.setTimeout(() => internalEventHandler(this.editControl, customHandler), delay);
                };
                const nativeEventName = event.nativeEventName;

                return api.bindingsRegistry.register({
                    key: this.getBindingKey(eventName),
                    registrationFormID: this.form.drivingView.ViewID,
                    onRegister: () => {
                        // Bind the actual event handler, and store it for potential unbinding
                        if (nativeEventName) {
                            if (api.utils.isFunction(eventTarget.bind)) {
                                eventTarget.bind(nativeEventName, invokeInternalHandler);
                            } else if (api.utils.isFunction(eventTarget.subscribe)) {
                                // Some objects use subscribe/unSubscribe instead of bind/unbind
                                eventTarget.subscribe(nativeEventName, this.editControl, invokeInternalHandler);
                            } else if (api.utils.isFunction(eventTarget.on)) {
                                // Some objects use subscribe/unSubscribe instead of bind/unbind
                                eventTarget.on(nativeEventName, invokeInternalHandler);
                            }
                        } else {
                            // Some controls only have a single event, so the name is irrelevant and the syntax is different
                            eventTarget.bind(invokeInternalHandler);
                        }
                    },
                    onDeregister: () => {
                        // When the registered binding is deregistered, unbind the event handler instance
                        if (api.utils.isFunction(eventTarget.unbind)) {
                            eventTarget.unbind(invokeInternalHandler);
                        } else if (api.utils.isFunction(eventTarget.unsubscribe)) {
                            // Some objects use subscribe/unSubscribe instead of bind/unbind
                            eventTarget.unsubscribe(nativeEventName, this.editControl);
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
            unbind(eventName) {
                // Deregister the binding which will unbind the event handler instance
                return api.bindingsRegistry.deregister(this.getBindingKey(eventName));
            }
        };
    }

    if (!api.ui.getValidGap) {
        api.ui.getValidGap = (uiControl, gap, defaultGap = 5) => {
            let validGap = Number.parseInt(gap);
            if (isNaN(validGap) || validGap === null) {
                // Use the control's gap or its parent's if none is specified
                validGap = uiControl.gap || (uiControl.parent ? uiControl.parent.gap : defaultGap) || defaultGap;
            }
        };
    }

    if (!api.ui.createVerticalPanel) {
        api.ui.createVerticalPanel = gap => new zebra.ui.dvPanel(new zebra.layout.ListLayout(zebra.layout.STRETCH, gap));
    }

    if (!api.ui.createHorizontalPanel) {
        api.ui.createHorizontalPanel = gap => new zebra.ui.dvPanel(new zebra.layout.FlowLayout(zebra.layout.STRETCH, zebra.layout.CENTER, zebra.layout.HORIZONTAL, gap));
    }

    if (!api.ui.createStretchPanel) {
        api.ui.createStretchPanel = (orientation, gap) => new zebra.ui.dvPanel(new zebra.layout.dvLayout(orientation, gap));
    }

    if (!api.ui.getMaxSize) {
        api.ui.getMaxSize = sizes => {
            return {
                width: Math.max(...sizes.map(size => size ? size.width : 0)),
                height: Math.max(...sizes.map(size => size ? size.height : 0))
            };
        };
    }

    if (!api.ui.normalizeSize) {
        api.ui.normalizeSize = size => {
            const normalizedSize = size;
            const dimensionTranslator = {
                width: "innerWidth",
                height: "innerHeight",
            };
            for (let key in normalizedSize) {
                let normalizedDimension = normalizedSize[key];
                if (normalizedDimension !== null && normalizedDimension !== undefined) {
                    const stringValue = normalizedDimension.toString();
                    const percentIndex = stringValue.indexOf("%");
                    if (percentIndex >= 0) {
                        const multiplier = (Number.parseInt(stringValue.substring(0, percentIndex)) || 0) / 100;
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
        api.ui.setFormSize = (form, size) => {
            const theForm = api.ui.ensureForm(form);
            if (theForm) {
                const theSize = api.ui.normalizeSize(size);
                for (let key in theSize) {
                    let dimension = theSize[key];
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
        api.ui.setFormLocation = (form, location) => {
            const theForm = api.ui.ensureForm(form);
            if (theForm) {
                form.window.left = location.left || location.x;
                form.window.top = location.top || location.y;
            } else {
                console.log("Form could not be found, so setFormLocation could not be executed.");
            }
        };
    }

    if (api.ui.setFormSizeAndLocation) {
        api.ui.setFormSizeAndLocation = (form, coordinates) => {
            api.ui.setFormSize(form, coordinates);
            api.ui.setFormLocation(form, coordinates);
        };
    }

    if (!api.ui.checkboxToButtonPair) {
        api.ui.checkboxToButtonPair = ({
            checkbox,
            form,
            selectedStyle,
            deselectedStyle,
            yesLabel = "Yes",
            noLabel = "No",
            layout = "horizontal",
            gap = null,
            buttonWidth = null,
            buttonHeight = null,
        }) => {
            const hostForm = api.ui.ensureForm(form);
            if (hostForm && hostForm.isVisible) {
                const booleanControl = api.ui.ensureCheckbox(checkbox, hostForm);

                if (booleanControl) {
                    const currentValue = booleanControl.checkboxField.getValue();

                    // Hide any existing checkbox
                    if (booleanControl.checkboxField) {
                        booleanControl.checkboxField.setVisible(false);
                    }

                    //Set up styles
                    const selectedButtonStyle = api.ui.ensureStyle(selectedStyle);
                    const deselectedButtonStyle = api.ui.ensureStyle(deselectedStyle);

                    if (selectedButtonStyle && deselectedButtonStyle) {
                        // Create a container panel and add buttons in place of checkbox
                        if (!booleanControl.buttonPanel) {
                            booleanControl.buttonPanel = layout.toLowerCase() === "horizontal" ? api.ui.createHorizontalPanel(gap) : api.ui.createVerticalPanel(gap);
                            booleanControl.add(booleanControl.buttonPanel);
                        }
                        let falseButton = booleanControl.falseButton;
                        if (!falseButton) {
                            falseButton = new zebra.ui.dvButton();
                            booleanControl.buttonPanel.add(falseButton);
                        }
                        falseButton.applyStyle(booleanControl.currentStyle);
                        falseButton.overrideStyle = currentValue === true ? deselectedButtonStyle : currentValue === false ? selectedButtonStyle : booleanControl.currentStyle;
                        api.ui.applyStyle(form, falseButton, falseButton.overrideStyle);
                        falseButton.setLabel(noLabel);
                        let trueButton = booleanControl.trueButton;
                        if (!trueButton) {
                            trueButton = new zebra.ui.dvButton();
                            booleanControl.buttonPanel.add(trueButton);
                        }
                        trueButton.applyStyle(booleanControl.currentStyle);
                        trueButton.overrideStyle = currentValue === true ? deselectedButtonStyle : currentValue === false ? selectedButtonStyle : booleanControl.currentStyle;
                        api.ui.applyStyle(form, trueButton, trueButton.overrideStyle);
                        trueButton.setLabel(yesLabel);
                        window.setTimeout(() => {
                            if (falseButton && trueButton) {
                                const specifiedSize = {
                                    width: Number.parseInt(buttonWidth),
                                    height: Number.parseInt(buttonHeight)
                                };
                                const maxSize = api.ui.getMaxSize([trueButton.getPreferredSize(), falseButton.getPreferredSize()]);
                                const applySize = {
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
                        const message = "You must supply styles for selected and deselected button states. See console for more details.";
                        console.error(message, "selectedStyle:", selectedStyle, "deselectedStyle:", deselectedStyle);
                        throw new Error(message);
                    }
                } else {
                    const message = "Could not find checkbox control. See console for more details.";
                    console.error(message, "checkbox:", checkbox);
                    throw new Error(message);
                }
                return booleanControl;
            } else {
                console.log("Form is not visible, so checkboxToButtonPair could not be executed.");
                return null;
            }
        };
    }

    if (!api.ui.comboBoxToButtons) {
        api.ui.comboBoxToButtons = ({
            combobox,
            form,
            selectedStyle,
            deselectedStyle,
            layout = "vertical",
            gap = null,
            buttonWidth = null,
            buttonHeight = null,
        }) => {
            const hostForm = api.ui.ensureForm(form);
            if (hostForm && hostForm.isVisible) {
                const comboBoxControl = api.ui.ensureComboBox(combobox, hostForm);

                if (comboBoxControl) {
                    const currentValue = comboBoxControl.comboBox.getValue();

                    // Hide existing combobox
                    comboBoxControl.comboBox.setVisible(false);

                    // Set up styles
                    const selectedButtonStyle = api.ui.ensureStyle(selectedStyle);
                    const deselectedButtonStyle = api.ui.ensureStyle(deselectedStyle);

                    if (selectedButtonStyle && deselectedButtonStyle) {
                        // Create a container panel and add buttons in place of checkbox
                        if (!comboBoxControl.buttonPanel) {
                            comboBoxControl.buttonPanel = layout.toLowerCase() === "horizontal" ? api.ui.createHorizontalPanel(gap) : api.ui.createVerticalPanel(gap);
                            comboBoxControl.add(comboBoxControl.buttonPanel);
                        }
                        if (!comboBoxControl.buttonArray && Array.isArray(comboBoxControl.comboBox.cachedList)) {
                            comboBoxControl.buttonArray = comboBoxControl.comboBox.cachedList.map(listItem => {
                                if (listItem) {
                                    const button = new zebra.ui.dvButton();
                                    button.applyStyle(comboBoxControl.currentStyle);
                                    button.overrideStyle = currentValue === listItem ? selectedButtonStyle : deselectedButtonStyle;
                                    api.ui.applyStyle(form, button, button.overrideStyle);
                                    button.setLabel(listItem);
                                    comboBoxControl.buttonPanel.add(button);
                                    return button;
                                }
                            });
                        }
                        window.setTimeout(() => {
                            if (comboBoxControl && comboBoxControl.buttonArray) {
                                const specifiedSize = {
                                    width: Number.parseInt(buttonWidth),
                                    height: Number.parseInt(buttonHeight)
                                };
                                const maxSize = api.ui.getMaxSize(comboBoxControl.buttonArray.map(button => button ? button.getPreferredSize() : null ));
                                const applySize = {
                                    width: specifiedSize.width || maxSize.width,
                                    height: specifiedSize.height || maxSize.height
                                };
                                comboBoxControl.buttonArray.forEach(button => {
                                    if (button) {
                                        button.setPreferredSize(applySize.width, applySize.height);
                                        button.vrp();
                                    }
                                });
                            }
                        }, 11);
                    } else {
                        const message = "You must supply styles for selected and deselected button states. See console for more details.";
                        console.error(message, "selectedStyle:", selectedStyle, "deselectedStyle:", deselectedStyle);
                        throw new Error(message);
                    }
                } else {
                    const message = "Could not find combobox control. See console for more details.";
                    console.error(message, "combobox:", combobox);
                    throw new Error(message);
                }

                return comboBoxControl;
            } else {
                console.log("Form is not visible, so comboBoxToButtons could not be executed.");
                return null;
            }
        };
    }

    if (!api.ui.buttonGroupHelper) {
        api.ui.buttonGroupHelper = class {
            constructor({
                form,
                containerPanel,
                selectedStyle,
                deselectedStyle,
                allowedMinValueCount = 0,
                allowedMaxValueCount,
                action,
                propertySettingName,
                boundPropertyID,
                initialValue,
                onSelection,
                onValueSet,
            }) {
                this.form = api.ui.ensureForm(form);
                if (this.form.isVisible) {
                    this.propertySettingName = propertySettingName;
                    this.action = action;
                    // Allow use of a Group Panel or a regular one as a button container
                    // TODO: Support any valid container?
                    this.containerPanel = api.ui.ensureGroupPanel(containerPanel, this.form) || api.ui.ensurePanel(containerPanel);
                    this.selectedStyle = api.ui.ensureStyle(selectedStyle);
                    this.deselectedStyle = api.ui.ensureStyle(deselectedStyle);
                    // Allow the specified min value count or none if not specified
                    this.allowedMinValueCount = Number.parseInt(allowedMinValueCount) || 0;
                    this.boundPropertyID = api.utils.toLinker(boundPropertyID);
                    this.controlHelpers = new Map();
                    this.lastClickedButton = null;
                    this.setValues(initialValue);

                    if (this.selectedStyle && this.deselectedStyle) {
                        if (this.containerPanel) {
                            // Wire up each button contained by the group panel to a shared event handler
                            // TODO: Instead of a deep search, look specifically for components that contain a button at the first appropriate child level of the container
                            const buttons = api.ui.getControlsByTypeName(this.containerPanel, "zebra.ui.dvButton", true);
                            if (buttons) {
                                // Allow the specified max value count or count of all possible values if not specified
                                this.allowedMaxValueCount = Number.parseInt(allowedMaxValueCount) || buttons.length;
                                buttons.forEach(button => {
                                    // Create a helper for each button and map by unique ID
                                    const controlHelper = new api.ui.controlHelper(button, this.form, action, propertySettingName);
                                    this.controlHelpers.set(button.$hash$, controlHelper);
                                    // Bind each button's fired event to a shared handler
                                    controlHelper.bind("fired", control => {
                                        this._toggleButtonValue(control);
                                        this.styleButtons();
                                        api.utils.runFunction(this.setFormValueFromControl, null, [ this.form ]);
                                        api.utils.runFunction(onSelection, null, [ this ]);
                                    });
                                    controlHelper.isSelected = () => this.hasValue(button.label.originalText);
                                    // Style button according to value
                                    this.styleButton(button);
                                });
                                if (this.boundPropertyID) {
                                    // Create a helper for the form since we need to know when a bound property value may have changed due to row selection
                                    const formHelper = new api.ui.controlHelper(this.form, this.form, action, propertySettingName);
                                    this.formHelper = formHelper;
                                    this.setControlValueFromForm = () => {
                                        // Update the button group's value with the bound field's value from the selected record
                                        const gridValue = this.boundPropertyGridValue;
                                        let value = gridValue && gridValue.getValue ? gridValue.getValue() : null;
                                        if (value && typeof value !== "string" && value.toString) {
                                            value = value.toString();
                                        }
                                        this.value = value;
                                        api.utils.runFunction(onValueSet, null, [ this ]);
                                    };
                                    this.setFormValueFromControl = () => {
                                        // Assign the value to the bound property
                                        const gridValue = this.boundPropertyGridValue;
                                        if (gridValue) {
                                            // gridValue.setValue(this.value);
                                            gridValue.displayProperties.setText(this.value);
                                        }
                                    };
                                    // Bind future value changes
                                    formHelper.bind("selectionChanged", this.setControlValueFromForm);
                                    // Set current value
                                    this.setControlValueFromForm(this.form);
                                }
                            } else {
                                const message = "There are no buttons inside Panel.";
                                console.error(message, containerPanel);
                                throw new Error(message);
                            }
                        } else {
                            const message = "Could not find Panel.";
                            console.error(message, "containerPanel:", containerPanel);
                            throw new Error(message);
                        }
                    } else {
                        const message = "You must supply styles for selected and deselected button states. See console for more details.";
                        console.error(message, "selectedStyle:", selectedStyle, "deselectedStyle:", deselectedStyle);
                        throw new Error(message);
                    }
                } else {
                    console.log("Could not create buttonGroupHelper since form is not visible.");
                }
            }

            styleButton(button) {
                const styleToApply = this.hasValue(button.label.originalText) ? this.selectedStyle : this.deselectedStyle;
                button.overrideStyle = styleToApply;
                api.ui.applyStyle(this.form, button, styleToApply);
            }

            styleButtons() {
                this.controlHelpers.forEach(helper => {
                    this.styleButton(helper.control);
                });
            }

            setValues(values) {
                if (Array.isArray(values)) {
                    this._values = values;
                } else if (values !== null && values !== undefined) {
                    this._values = [values];
                } else {
                    this._values = [];
                }
            }

            addValue(value) {
                if (this._allowAddValue(value)) {
                    this._values.push(value);
                }
            }

            removeValue(value) {
                if (this._allowRemoveValue(value)) {
                    this._values.remove(value);
                }
            }

            hasValue(value) {
                return Array.isArray(this._values) ?
                    this._values.indexOf(value) > -1 :
                    false;
            }

            get valueCount() {
                return Array.isArray(this._values) ?
                    this._values.length :
                    0;
            }

            set value(values) {
                // Split comma-separated values into an array
                if (values && typeof values === "string") {
                    values = values.split(",");
                }
                this.setValues(values);
                this.styleButtons();
            }

            get value() {
                // Return values as an array (limit as specified)
                return Array.isArray(this._values) ?
                    this._values.join(",") :
                    null;
            }

            get values() {
                return this._values || [];
            }

            get boundPropertyGridValue() {
                if (this.boundPropertyID && this.form && this.form.selectedRecord && this.form.selectedRecord.gridValues) {
                    return this.form.selectedRecord.gridValues.getVal(this.boundPropertyID);
                } else {
                    return null;
                }
            }

            _toggleButtonValue(button) {
                this.lastClickedButton = button;
                const controlHelper = this.controlHelpers.get(button.$hash$);
                if (controlHelper) {
                    // Get the toggled boolean value that indicates whether the button is currently selected
                    const newSelectionValue = !controlHelper.isSelected();
                    const buttonValue = button.label.originalText;
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

            _allowAddValue(value) {
                return this.valueCount + (this.hasValue(value) ? 0 : 1) <= this.allowedMaxValueCount;
            }

            _allowRemoveValue(value) {
                return this.valueCount - (this.hasValue(value) ? 1 : 0) >= this.allowedMinValueCount;
            }
        };
    }

    if (!api.ui.enhanceDateTimeControl) {
        api.ui.enhanceDateTimeControl = ({
            dateTimeProperty,
            form,
            orientation = "horizontal",
            gap = null,
        }) => {
            const hostForm = api.ui.ensureForm(form);
            if (hostForm && hostForm.isVisible) {
                const dateTimeControl = api.ui.getFieldUIControl(dateTimeProperty, hostForm);
                if (dateTimeControl) {
                    // Hide existing DateTime control
                    dateTimeControl.textField.setVisible(false);

                    // Helper to add components to their containers and lay them out and style them consistently
                    const addComponentToContainer = (component, container) => {
                        component.hAlign = zebra.layout.STRETCH;
                        component.vAlign = zebra.layout.STRETCH;
                        container.add(component);
                        component.applyStyle(dateTimeControl.currentStyle);
                        return component;
                    };

                    // Create a container panel for replacement controls
                    if (!dateTimeControl.controlsPanel) {
                        dateTimeControl.controlsPanel = addComponentToContainer(api.ui.createStretchPanel(orientation, gap), dateTimeControl);
                        dateTimeControl.dateTextBox = addComponentToContainer(new zebra.ui.dvDateTimeField, dateTimeControl.controlsPanel);
                        dateTimeControl.timeTextBox = addComponentToContainer(new zebra.ui.dvDateTimeField, dateTimeControl.controlsPanel);
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
                        dateTimeControl.timeTextBox.domInput.first().type = "time";

                        // api.ui.overlayCanvasWithElement(form.apiRef, dateTimeControl.dateTextBox, dateTimeControl.dateTextBox.domInput);
                        // api.ui.overlayCanvasWithElement(form.apiRef, dateTimeControl.timeTextBox, dateTimeControl.timeTextBox.domInput);
                    }

                    dateTimeControl.applyStyle(dateTimeControl.currentStyle);

                    // Populate component values
                    const currentValue = Date.parse(dateTimeControl.textField.dateTimeField.getValue());
                    if (currentValue) {
                        dateTimeControl.dateTextBox.setValue(currentValue.toLocaleDateString());
                        dateTimeControl.timeTextBox.setValue(currentValue.toLocaleTimeString());
                    }
                } else {
                    const message = "Could not find DateTime control. See console for more details.";
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
        api.ui.dateTimeControlHelper = class {
            constructor({
                form,
                action,
                control,
                propertySettingName,
                boundPropertyID,
                initialValue,
                textUpdated,
                onValueSet,
            }) {
                this.form = api.ui.ensureForm(form);
                if (this.form.isVisible) {
                    this.control = control;
                    this.propertySettingName = propertySettingName;
                    this.boundPropertyID = api.utils.toLinker(boundPropertyID);
                    this.controlHelpers = new Map();
                    this.value = initialValue;

                    if (this.control) {
                        [
                            this.control.dateTextBox,
                            this.control.timeTextBox,
                        ].forEach(textBox => {
                            // Create a helper for each textBox and map by unique ID
                            const controlHelper = new api.ui.controlHelper(textBox, this.form, action, propertySettingName);
                            this.controlHelpers.set(textBox.$hash$, controlHelper);
                            // Bind each textBox's textUpdated event to a shared handler
                            controlHelper.bind("textUpdated", control => {
                                api.utils.runFunction(this.setFormValueFromControl, null, [ this.form ]);
                                api.utils.runFunction(textUpdated, null, [ this ]);
                            });
                        });
                        if (this.boundPropertyID) {
                            // Create a helper for the form since we need to know when a bound property value may have changed due to row selection
                            const formHelper = new api.ui.controlHelper(this.form, this.form, action, propertySettingName);
                            this.formHelper = formHelper;
                            this.setControlValueFromForm = () => {
                                // Update the control's value with the bound field's value from the selected record
                                const gridValue = this.boundPropertyGridValue;
                                let value = gridValue && gridValue.getValue ? gridValue.getValue() : null;
                                if (value && value instanceof Date && gridValue.dynamicValue && gridValue.dynamicValue.TimeZoneOffset) {
                                    // Apply time zone offset to account for framework's DateTime value calculation, or it will be applied twice
                                    value.addHours(gridValue.dynamicValue.TimeZoneOffset);
                                }
                                this.value = value;
                                api.utils.runFunction(onValueSet, null, [ this ]);
                            };
                            this.setFormValueFromControl = () => {
                                // Assign the value to the bound property
                                const gridValue = this.boundPropertyGridValue;
                                const controlValue = this.value;
                                if (gridValue && controlValue.isValid()) {
                                    gridValue.displayProperties.setText(controlValue);
                                }
                            };
                            // Bind future value changes
                            formHelper.bind("selectionChanged", this.setControlValueFromForm);
                            // Set current value
                            this.setControlValueFromForm(this.form);
                        }
                    } else {
                        const message = "Could not find control.";
                        console.error(message, "control:", control);
                        throw new Error(message);
                    }
                }
            }

            set value(value) {
                const dateTimeValue = new Date(value);
                if (dateTimeValue.isValid()) {
                    this.control.dateTextBox.setValue(dateTimeValue.toLocaleDateString());
                    this.control.timeTextBox.setValue(dateTimeValue.toLocaleTimeString());
                }
            }

            get value() {
                return new Date(`${this.control.dateTextBox.getValue()} ${this.control.timeTextBox.getValue()}`);
            }

            get boundPropertyGridValue() {
                if (this.boundPropertyID && this.form && this.form.selectedRecord && this.form.selectedRecord.gridValues) {
                    return this.form.selectedRecord.gridValues.getVal(this.boundPropertyID);
                } else {
                    return null;
                }
            }
        };
    }

    if (!api.ui.applyDropShadow) {
        api.ui.applyDropShadow = ({ uiControl, shadowColor = "#888888", left = 0, top = 0, right = 5, bottom = 5, shadowBlur = 10, shadowOffsetX = 5, shadowOffsetY = 5 }) => {
            if (!uiControl.border) {
                uiControl.setBorder(new zebra.ui.Border('transparent', 1));
            }
            const targetBorder = uiControl.border;

            targetBorder.getLeft = () => Number.parseInt(left) || 0;
            targetBorder.getTop = () => Number.parseInt(top) || 0;
            targetBorder.getRight = () => Number.parseInt(right) || 5;
            targetBorder.getBottom = () => Number.parseInt(bottom) || 5;

            targetBorder.paint = function (g, x, y, w, h, d) {
                const lineWidth = g.lineWidth;
                g.lineWidth = this.width;

                if (this.radius > 0) {
                    this.outline(g, x, y, w, h, d);
                }
                else {
                    const halfWidth = this.width / 2;
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

                    g.fillStyle = "white";
                    // TODO: Clean up magic numbers
                    g.fillRect(5 + this.width, 5 + this.width, w - ((6 * 2) + this.getRight()), h - ((6 * 2) + this.getBottom()));

                    // Reset shadow attributes so text label is not shadowed
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
        api.ui.getFieldUIControl = (controlID, form) => {
            // If form is not specified, use the current form.
            if (form === null || form === undefined) {
                form = self().raw;
            } else {
                form = api.ui.ensureForm(form);
            }

            if (form && form.isVisible) {
                let field = form.findControl(controlID) || form.findControl(api.utils.toLinker(controlID));
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
        api.ui.getButtonUIControl = (taskID, form) => {
            // If form is not specified, use the current form.
            if (form === null || form === undefined) {
                form = self().raw;
            }

            if (form !== null) {
                // Get the specified button using its ID from the formController (which contains all of the UI Controls).
                const button = form.formController.formActions.getVal(taskID);

                // Get the uiControl for the button.
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
        api.ui.getControlPosition = (uiControl, relativeToPanel) => {
            // Create the result position object.
            var resPosition = { left: 0, top: 0 };

            // Verify the uiControl is not null.
            if (uiControl !== null) {
                // Recursively search the parent panels and track the left and top values.
                while (uiControl.parent !== null && uiControl !== relativeToPanel) {
                    resPosition.top += uiControl.y;
                    resPosition.left += uiControl.x;
                    uiControl = uiControl.parent;
                }
            }

            // Return the resulting position.
            return resPosition;
        };
    }

    if (!api.ui.getFieldCoordinates) {
        api.ui.getFieldCoordinates = (controlID, form) => {
            // Get the property UI Control object
            const field = api.ui.getFieldUIControl(controlID, form);
            if (field) {
                // Store the root panel for the form (containing the entire form layout).
                const rootPanel = form.topMVC;
                // Get the UI Control's position and size.
                const position = api.ui.getControlPosition(field, rootPanel);
                if (position) {
                    const coordinates = {
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
        api.ui.removeOverlay = overlay => {
            let id;
            if (typeof overlay === "string") {
                id = overlay;
            } else if (typeof overlay === "object") {
                id = overlay.id;
            }
            const element = document.getElementById(id);
            if (element) {
                element.parentNode.removeChild(element);
            }
        };
    }

    if (!api.ui.removeAllOverlays) {
        /**
         * Removes all DOM elements that have been overlaid using one of the api.ui.overlay helper functions.
         */
        api.ui.removeAllOverlays = () => {
            const elements = document.getElementsByClassName(overlayClassName);
            if (elements) {
                [...elements].forEach(element => api.ui.removeOverlay(element));
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
        api.ui.overlayFieldWithElement = (controlID, form, id, elementType = "div") => {
            const coordinates = api.ui.getFieldCoordinates(controlID, form);
            if (coordinates) {
                // Create a new element.
                const newElement = document.createElement(elementType);
                newElement.id = id;
                newElement.style = getOverlayStyle(coordinates);

                // Add a class that allows easy identification of overlaid items
                newElement.classList.add(overlayClassName);

                //Add the element to the html element of the specified form.
                form.formController.uiControl.getCanvas().canvas.parentElement.appendChild(newElement);

                // Return the element for additional use.
                return newElement;
            }
            return null;    // Return null if unable to overlay the element.
        };
    }

    if (!api.ui.overlayFieldWithDiv) {
        api.ui.overlayFieldWithDiv = (controlID, form, id) => {
            return api.ui.overlayFieldWithElement(controlID, form, id);
        };
    }

    if (!api.ui.overlayFieldWithVideo) {
        api.ui.overlayFieldWithVideo = (controlID, form, id, source, controls = true, autoplay = true, loop = true) => {
            const newElement = api.ui.overlayFieldWithElement(controlID, form, id, "video");
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
        api.ui.overlayFieldWithIframe = (controlID, form) => {
            // Get the property UI Control object.
            var fld = api.ui.getFieldUIControl(controlID, form);
            if (fld !== null) {
                // Store the root panel for the form (containing the entire form layout).
                var rootPanel = form.formController.uiControl;

                // Get the UI Controls position and size.
                var position = api.ui.getControlPosition(fld, rootPanel);
                if (position !== null) {
                    // Create a new iFrame object.
                    var iFrame = document.createElement("iframe");
                    var t = position.top + fld.top;
                    var l = position.left + fld.left;
                    var w = fld.width - (fld.left + fld.right);
                    var h = fld.height - (fld.top + fld.bottom);

                    //Absolute position is needed on the main container of html elements in order to overlay the canvas.
                    iFrame.style=`position:absolute;background-color:#ffffff;display:inline-block;padding-bottom:30px;border:none;top:${t}px;left:${l}px;width:${w}px;height:${h}px;`;

                    //Add the iFrame to the html element of the specified form.
                    form.window.canvas.canvas.parentElement.appendChild(iFrame);

                    return iFrame; // Return the iFrame for additional use.
                } else {
                    console.log("overlayFieldWithIframe: Unable to get control position.");
                }
            } else {
                console.log("Unable to find form field for property UID: " + controlID);
            }
            return null;    // Return null if unable to overlay the iFrame.
        };
    }

    if (!api.ui.getCoordinatesForPropertyDropDown) {
        /**
         * Gets a position where a drop-down can be placed directly under a control bound to a property on a form.
         * @param {Object} formID        A numeric ID, UID or linker ({ UID: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", Type: "View" }) that identifies the form.
         * @param {Object} controlID     The name of the control or UID (string or linker) of the control's bound property to retrieve.
         * @returns {Object}             Coordinates { top, left, width, height } directly under the field's control.
         */
        api.ui.getCoordinatesForPropertyDropDown = (formID, controlID) => {
            // Get the form (it should already be open)
            const form = api.utils.getOpenForm(formID);
            // Get the position of the field bound to the property
            const fieldCoordinates = api.ui.getFieldCoordinates(controlID, form);
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
        api.ui.getDefaultForm = () => {
            let form = null;
            try {
                form = self();
                if (!form || !form.formController) {
                    form = null;
                }
            } catch (exception) { }
            if (!form) {
                const getFormFromCurrentExpression = () => {
                    if (app.dv.helpers.exprEng.currexpression) {
                        return app.dv.helpers.exprEng.currexpression.mvc;
                    } else {
                        return null;
                    }
                };
                const getLastOpenForm = () => {
                    try {
                        return api.openForms.last().raw;
                    } catch (exc) {}
                };
                const getActiveForm = () => {
                    try {
                        return api.openForms.active.raw;
                    } catch(exc) {}
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
        api.ui.getGroupPanelByHeaderText = (headerText, form) => {
            const formToUse = form.raw ? form : form.apiRef;
            if (formToUse && formToUse.raw && formToUse.raw.formController) {
                return api.ui.getLayoutItemByName(headerText, formToUse.raw.formController.uiControl);
            } else {
                return null;
            }
        };
    }

    if (!api.ui.getLayoutItemByName) {
        api.ui.getLayoutItemByName = (name, panelToSearch) => {
            var matchingPanel = null;
            const searchPanel = panel => {
                if (matchingPanel != null) {
                    return; // Stop seaching, we found it..PW
                }

                // Include the panel itself in the search since we might be starting somewhere inside the top-level panel
                panel.kids.forEach(function(p) {
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
        api.ui.getStylableControlOrForm = (form, control) => {
            let uiControlToStyle = control;
            if (!control) {
                // If no control or ID was passed, assume we're styling the form, and get its stylable component
                uiControlToStyle = form.formController ? form.formController.uiControl : null;
            } else if (control.uiControl) {
                uiControlToStyle = control.uiControl;
            } else if (!control.currentStyle) {
                // Get the underlying stylable component by a control's ID if that's what was passed in
                const typeOfControl = typeof control;
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
        api.ui.setControlVisibility = (form, control, visible) => {
            const uiControl = api.ui.getStylableControlOrForm(form, control);
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
        api.ui.hideControl = (form, control) => {
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
        api.ui.showControl = (form, control) => {
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
        api.ui.applyStyle = (form, control, style) => {
            if (typeof style === "string" || (typeof style === "object" && !style.Definition)) {
                // Get a style reference by its UID if that's what was passed
                style = api.ui.getStyleFromUID(style);
            }
            const uiControlToStyle = api.ui.getStylableControlOrForm(form, control);
            if (uiControlToStyle) {
                // Get the style definition and clone it, then merge it with the control's current style and apply it; Note that mergeStyles makes clones of the styles passed to it.
                const mergedStyle = app.dv.mvc.formController.mergeStyles(uiControlToStyle.currentStyle, style);
                // need the form controller to deal with expressions.
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
        api.ui.applyDefaultStyle = (form, control) => {
            api.ui.applyStyle(form, control, api.ui.getDefaultStyle());
        };
    }

    if (!api.ui.resetStyles) {
         /**
         * Apply the originally configured styles to a form or control, and refresh its appearance.
         * @param   {object}        form            The API reference to an open form (MVC).
         * @param   {object|number} control         The control or its ID (relative to form) whose styles should be manipulated.
         */
        api.ui.resetStyles = (form, control) => {
            const uiControlToStyle = api.ui.getStylableControlOrForm(form, control);
            uiControlToStyle.resetStyle();
            const parentStyle = (uiControlToStyle.parent && uiControlToStyle.parent.currentStyle) ? uiControlToStyle.parent.currentStyle : api.ui.getDefaultStyle();
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
        api.ui.getStyleFromUID = UID => {
            let linker = UID;
            if (typeof UID === "string") {
                linker = { UID };
            }
            return app.dv.cache.styles.allStyles.getVal(linker);
        };
    }

    if (!api.ui.getDefaultStyle) {
        /**
         * Gets the environment's default style from configuration settings.
         * @returns {object}                        The default style object.
         */
        api.ui.getDefaultStyle = () => {
            return api.ui.getStyleFromUID(app.dv.cache.session.configEntity.ConfigValue.SavedThemes.find(theme => theme.IsCurrent).DefaultStyle);
        };
    }

    if (!api.ui.ensureStyle) {
        /**
         * Ensure that the passed object is a Style, getting one from passed UID, if not.
         * @param   {object|string|Linker}    style    A Style, or a string/Linker UID that represents one.
         * @returns {object}                           A Style object.
         */
        api.ui.ensureStyle = style => {
            if (!style || (style.clientProperties && style.clientProperties.entityType === "Style")) {
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
        api.ui.ensureGroupPanel = (panel, form) => {
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
        api.ui.ensurePanel = (panel, create = true) => {
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
        api.ui.ensureCheckbox = (checkbox, form) => {
            if (!checkbox || (checkbox.typeName === "zebra.ui.dvLayoutItem" && checkbox.checkboxField)) {
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
        api.ui.ensureComboBox = (combobox, form) => {
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
        api.ui.ensureDateTimeTextBox = (dateTimeTextBox, form) => {
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
        api.ui.ensureForm = form => {
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
        api.ui.ensureKids = container => {
            let kidsCollection = container;
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
        api.ui.flattenControls = container => {
            let kids = api.ui.ensureKids(container);
            let controls = [];
            kids.forEach(control => {
                if (control.kids && Array.isArray(control.kids) && control.kids.length) {
                    controls.push(control);
                    const moreKids = api.ui.flattenControls(control.kids);
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
        api.ui.getControlsByTypeName = (container, typeName, deepSearch = false) => {
            let kids = api.ui.ensureKids(container);
            if (deepSearch) {
                kids = api.ui.flattenControls(kids);
            }
            return kids.filter(k => k.typeName === typeName);
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
        api.ui.getControlsByLabel = (container, label, deepSearch = false) => {
            let kids = api.ui.ensureKids(container);
            if (deepSearch) {
                kids = api.ui.flattenControls(kids);
            }
            return kids.filter(k => k.label && (api.utils.runFunction(k.label.getValue, k.label) === label));
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
        api.ui.getControlsByID = (container, id, deepSearch = false) => {
            let kids = api.ui.ensureKids(container);
            if (deepSearch) {
                kids = api.ui.flattenControls(kids);
            }
            return kids.filter(k => k.id === id);
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
        api.ui.getControlsOfType = (container, type, deepSearch = false) => {
            let kids = api.ui.ensureKids(container);
            if (deepSearch) {
                kids = api.ui.flattenControls(kids);
            }
            return kids.filter(k => k instanceof type);
        };
    }

    if (!api.ui.applyBoxShadow) {
        api.ui.applyBoxShadow = (apiForm, apiControl, boxShadow) => {
            let divShadow = document.createElement("div");
            divShadow.style.boxShadow = boxShadow || "rgba(0, 0, 0, 0.3) 0px 2px 4px 0px";
            if (apiControl.raw.border) {
                divShadow.style.borderRadius = `${apiControl.raw.border.radius}px`;
            }
            divShadow.style.background = "transparent";
            divShadow.style.pointerEvents = "none";

            api.ui.overlayCanvasWithElement(apiForm, apiControl, divShadow);
            apiControl.raw.divShadow = divShadow;
        };
    }

    if (!api.ui.overlayCanvasWithElement) {
        api.ui.overlayCanvasWithElement = (apiForm, apiControl, element) => {
            let domElement = element;
            if (typeof element === "string") {
                // Create an actual DOM element if a string was passed in
                domElement = document.createElement("div");
                domElement.style.background = "transparent";
                domElement.style.overflowY = "auto";
                domElement.innerHTML = element;
                // Add a class that allows easy identification of overlaid items
                domElement.classList.add(overlayClassName);
            }
            let rawCtl = apiControl.raw;
            let scrollPnl = findScrollPanel(rawCtl);
            let scrollMgr = null;

            if (scrollPnl != null) {
                scrollMgr = scrollPnl.scrollManager;
            }

            // Append the element to the top-level form's work area div
            setElementPos(zebra.util.getAbsolutePosition(rawCtl), rawCtl);
            const formWindow = apiForm.raw.topMVC.window;
            formWindow.workarea.baseElement.appendChild(domElement);

            rawCtl.laidout = (e) => {
                setElementPos(zebra.util.getAbsolutePosition(rawCtl), rawCtl);
            };

            formWindow.on("winResize", (e) => {
                setElementPos(zebra.util.getAbsolutePosition(rawCtl), rawCtl);
            });

            if (scrollMgr && scrollMgr.target) {
                scrollMgr.target.catchScrolled = rawCtl.laidout;
            }

            function setElementPos(controlPos, rawCtl) {
                const elementStyle = domElement.style;

                elementStyle.position = "absolute";

                if (scrollMgr != null) {
                    if (scrollMgr.sx < 0) {

                    }
                    else {
                        elementStyle.left = `${controlPos.x}px`;
                        elementStyle.width = `${rawCtl.width}px`;
                    }

                    let scrollPnlPos = zebra.util.getAbsolutePosition(scrollPnl);
                    if (scrollMgr.sy < 0) {
                        if (scrollPnlPos.y === 0) {
                            elementStyle.top = `${controlPos.y}px`;
                            elementStyle.height = `${rawCtl.height}px`;
                        }
                        else {
                            controlPos.y -= scrollMgr.sy
                            elementStyle.top = `${controlPos.y}px`;
                            elementStyle.height = `${scrollPnl.height}px`;
                        }
                    }
                    else {
                        elementStyle.top = `${controlPos.y}px`;

                        if (scrollPnlPos.y === 0) {
                            elementStyle.height = `${rawCtl.height}px`;
                        }
                        else {
                            elementStyle.height = `${scrollPnl.height}px`;
                        }
                    }
                }
                else {
                    elementStyle.left = `${controlPos.x}px`;
                    elementStyle.width = `${rawCtl.width}px`;
                    elementStyle.top = `${controlPos.y}px`;
                    elementStyle.height = `${rawCtl.height}px`;
                }
            }

            function findScrollPanel(rawCtl) {
                if (rawCtl.parent == null) {
                    return null
                }
                if (rawCtl.scrollManager != null) {
                    return rawCtl;
                }
                else {
                    return findScrollPanel(rawCtl.parent);
                }
            }

            return domElement;
        };
    }
});
