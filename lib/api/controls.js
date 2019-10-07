"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

/**
 * Extends the api.controls namespace with additional helper functions.
 * Dependencies:
 *    api.loadExtension
 */
api.loadExtension("api.controls", function () {
  if (!api.controls.ProgressBar) {
    /**
     * Create a progress bar control
     *
     * Example Use:
     * var pb = new api.controls.ProgressBar();
     * pb.maxValue = 2000; //Set max value
     * pb.value = 100; //set Value
     * pb.message = 'Test Message' //set the message
     * pb.progressMessage = "100/2000" //set the progress message
     *
     * OR
     *
     * var pb = new api.controls.ProgressBar(api.openForms.active.raw.rootPanel.parent, 2000,"Test Message", "100/2000");
     * pb.value = 100;
     *
     * @type {api.controls.ProgressBar}
     */
    api.controls.ProgressBar =
    /*#__PURE__*/
    function (_zebra$ui$Panel) {
      _inherits(_class, _zebra$ui$Panel);

      /**
       * Create the progress bar
       * @param parent The control you want to progress to appear in. blank will default to the current form.
       * @param maxValue The max progress value
       * @param messageText The message text (left Side)
       * @param progressText the progress text (right Side)
       * @param show (Show or hide the progress
       */
      function _class(parent) {
        var _this;

        var maxValue = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 100;
        var messageText = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "Initializing...";
        var progressText = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : "";
        var show = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : true;

        _classCallCheck(this, _class);

        //Create progress bar
        var LO = zebra.layout;
        var UI = zebra.ui;
        _this = _possibleConstructorReturn(this, _getPrototypeOf(_class).call(this, new LO.StackLayout()));

        if (parent == null) {
          parent = api.openForms.active.raw.rootPanel.parent;
        } //Set the defaults to the Progress bar control


        _this._barWidth = 500;
        _this._barHeight = 35;
        _this._maxValue = maxValue;
        _this._progressSize = 0;
        _this._value = 0;
        parent.layout = new LO.StackLayout();

        _this.setBackground("#000000CC");

        _this.setVisible(show);

        parent.add(_assertThisInitialized(_this)); //Create the Center panel that holds the progress bar

        _this.panelCenter = new UI.Panel(new LO.FlowLayout(LO.CENTER, LO.CENTER, LO.VERTICAL, 3));

        _this.panelCenter.setBackground("transparent");

        _this.add(_this.panelCenter); //Create the labels Panel


        _this.labelPanel = new UI.Panel(new LO.BorderLayout());

        _this.labelPanel.setPreferredSize(_this._barWidth, -1);

        _this.panelCenter.add(_this.labelPanel); //Create the progress message


        _this.labelMessage = new UI.Label(messageText);

        _this.labelMessage.setColor("#ffffff");

        _this.labelMessage.setFont(new UI.Font("Sans-Serif", 16));

        _this.labelPanel.add(LO.LEFT, _this.labelMessage); //Create the progress label


        _this.labelProgress = new UI.Label(progressText);

        _this.labelProgress.setColor("#ffffff");

        _this.labelProgress.setFont(new UI.Font("Sans-Serif", 16));

        _this.labelPanel.add(LO.RIGHT, _this.labelProgress); //Create the progress bars border panel


        _this.panelBorder = new UI.Panel(new LO.FlowLayout(LO.LEFT, LO.CENTER));

        _this.panelBorder.setPreferredSize(_this._barWidth, _this._barHeight);

        _this.panelBorder.setBackground("#999999");

        _this.panelCenter.add(_this.panelBorder); //Create Progress bar


        _this.progressBar = new UI.Panel(new LO.FlowLayout(LO.LEFT, LO.CENTER));

        _this.progressBar.setPreferredSize(0, _this._barHeight);

        _this.progressBar.setBackground("#6ae78d");

        _this.panelBorder.add(_this.progressBar);

        return _this;
      }
      /**
       * set the maxValue of the progress bar
       */


      _createClass(_class, [{
        key: "setProgressBarColor",

        /**
         * Set the progress bar color
         * @param color  The color of the progress bar
         */
        value: function setProgressBarColor(color) {
          this.progressBar.setBackground(color);
        }
        /**
         * Set the progress container panels back color
         * @param color  The color of the progress container panel
         */

      }, {
        key: "setProgressPanelColor",
        value: function setProgressPanelColor(color) {
          this.panelBorder.setBackground(color);
        }
        /**
         * Set the progress background color. This is the opaque color of the progress bars background, "DEFAULT: #000000CC"
         * @param color  The color to set the background
         */

      }, {
        key: "setBackgroundColor",
        value: function setBackgroundColor(color) {
          this.setBackground(color);
        }
        /**
         * Set the progress value and label text of the progress bar
         * @param value The value of the progress bar
         * @param messageText The message text
         * @param progressText The progress text
         */

      }, {
        key: "setProgressValues",
        value: function setProgressValues(value) {
          var messageText = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "";
          var progressText = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "";

          //Calculate the size of the progress bar...
          var progressSize = (value / this._maxValue * this._barWidth).toFixed(0);

          if (progressSize > this._barWidth) {
            progressSize = this._barWidth;
          }

          this._progressSize = progressSize;
          this._value = value;
          this.progressBar.setPreferredSize(progressSize, this._barHeight);
          this.labelMessage.setValue(messageText);
          this.labelProgress.setValue(progressText);
          this.repaint();
        }
        /**
         * Set the Message text of the progress bar (Left Message Text
         * @param text  The text to update the message to
         */

      }, {
        key: "setMessageText",
        value: function setMessageText(text) {
          this.labelMessage.setValue(text);
          this.repaint();
        }
        /**
         * Set the progress value text of the progress bar (Right Message Text)
         * @param text The text to update the label to
         */

      }, {
        key: "setProgressText",
        value: function setProgressText(text) {
          this.labelProgress.setValue(text);
          this.repaint();
        }
        /**
         * Resize the progress bar to be the size specified
         * @param barHeight The height of the bar
         * @param barWidth The Width of the bar
         * @param fontSize The new font size of the text
         */

      }, {
        key: "resizeProgressBar",
        value: function resizeProgressBar(barHeight, barWidth) {
          var fontSize = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 16;
          this._barWidth = barWidth;
          this._barHeight = barHeight;
          this.panelBorder.setPreferredSize(this._barWidth, this._barHeight);
          this.progressBar.setPreferredSize(0, this._barHeight);
          this.labelPanel.setPreferredSize(this._barWidth, -1);
          this.labelProgress.setFont(new zebra.ui.Font("Sans-Serif", fontSize));
          this.labelMessage.setFont(new zebra.ui.Font("Sans-Serif", fontSize));
          this.setProgressValues(this._value, this.labelMessage.getValue(), this.labelProgress.getValue());
        }
        /**
         * Show the progess bar
         */

      }, {
        key: "show",
        value: function show() {
          this.setVisible(true);
        }
        /**
         * hide the progress bar
         */

      }, {
        key: "hide",
        value: function hide() {
          this.setVisible(false);
        }
        /**
         * Dispose and remove the progress bar
         */

      }, {
        key: "dispose",
        value: function dispose() {
          this._barWidth = undefined;
          this._barHeight = undefined;
          this.panelBorder = undefined;
          this.progressBar = undefined;
          this.labelPanel = undefined;
          this.labelMessage = undefined;
          this.labelProgress = undefined;
          this.panelCenter = undefined;
          this._maxValue = undefined;
          this._value = undefined;
          this._progressSize = undefined;
          this.removeMe();
        }
      }, {
        key: "maxValue",
        set: function set(value) {
          this._maxValue = value;
          this.setProgressValues(this._value, this.labelMessage.getValue(), this.labelProgress.getValue());
        }
        /**
         * get the max value of the progress bar
         * @returns {*} Returns the max Value.
         */
        ,
        get: function get() {
          return this._maxValue;
        }
        /**
         * set the value of the progress bar
         * @param value The value to set
         */

      }, {
        key: "value",
        set: function set(value) {
          this._value = value;
          this.setProgressValues(value, this.labelMessage.getValue(), this.labelProgress.getValue());
        }
        /**
         * Get the current value of the progress bar.
         * @returns The value of the progress bar.
         */
        ,
        get: function get() {
          return this._value;
        }
        /**
         * Set the progress message
         * @param text The progress message
         */

      }, {
        key: "message",
        set: function set(text) {
          this.labelMessage.setValue(text);
        }
        /**
         * Get the progress message
         * @returns {*} The progress message
         */
        ,
        get: function get() {
          return this.labelMessage.getValue();
        }
        /**
         * set the progress value label text (Right Side message
         * @param text The progress value label text
         */

      }, {
        key: "progressMessage",
        set: function set(text) {
          this.labelProgress.setValue(text);
        }
        /**
         * Get the progress value label text (Right Side message)
         * @returns {*} The progress value label text
         */
        ,
        get: function get() {
          return this.labelProgress.getValue();
        }
      }]);

      return _class;
    }(zebra.ui.Panel);
  }
});
//# sourceMappingURL=controls.js.map