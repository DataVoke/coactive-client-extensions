/**
 * Custom Action: Extend api.controls
 * Extends the api.controls namespace with additional helper functions.
 * Dependencies:
 *    api.loadExtension
 */
api.loadExtension("api.controls",() => {
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
        api.controls.ProgressBar = class extends zebra.ui.Panel {
            /**
             * Create the progress bar
             * @param parent The control you want to progress to appear in. blank will default to the current form.
             * @param maxValue The max progress value
             * @param messageText The message text (left Side)
             * @param progressText the progress text (right Side)
             * @param show (Show or hide the progress
             */
            constructor(parent, maxValue = 100, messageText = "Initializing...", progressText = "", show = true){
                //Create progress bar
                const LO = zebra.layout;
                const UI = zebra.ui;
                super(new LO.StackLayout());
                if (parent == null) {
                    parent = api.openForms.active.raw.rootPanel.parent;
                }

                //Set the defaults to the Progress bar control
                this._barWidth = 500;
                this._barHeight = 35;
                this._maxValue = maxValue;
                this._progressSize = 0;
                this._value = 0;
                parent.layout = new LO.StackLayout();
                this.setBackground("#000000CC");
                this.setVisible(show);
                parent.add(this);

                //Create the Center panel that holds the progress bar
                this.panelCenter = new UI.Panel(new LO.FlowLayout(LO.CENTER, LO.CENTER, LO.VERTICAL, 3));
                this.panelCenter.setBackground("transparent");
                this.add(this.panelCenter);

                //Create the labels Panel
                this.labelPanel = new UI.Panel(new LO.BorderLayout());
                this.labelPanel.setPreferredSize(this._barWidth, -1);
                this.panelCenter.add(this.labelPanel);

                //Create the progress message
                this.labelMessage = new UI.Label(messageText);
                this.labelMessage.setColor("#ffffff");
                this.labelMessage.setFont(new UI.Font("Sans-Serif", 16));
                this.labelPanel.add(LO.LEFT, this.labelMessage);

                //Create the progress label
                this.labelProgress = new UI.Label(progressText);
                this.labelProgress.setColor("#ffffff");
                this.labelProgress.setFont(new UI.Font("Sans-Serif", 16));
                this.labelPanel.add(LO.RIGHT, this.labelProgress);

                //Create the progress bars border panel
                this.panelBorder = new UI.Panel(new LO.FlowLayout(LO.LEFT, LO.CENTER));
                this.panelBorder.setPreferredSize(this._barWidth, this._barHeight);
                this.panelBorder.setBackground("#999999");
                this.panelCenter.add(this.panelBorder);

                //Create Progress bar
                this.progressBar =  new UI.Panel(new LO.FlowLayout(LO.LEFT, LO.CENTER));
                this.progressBar.setPreferredSize(0, this._barHeight);
                this.progressBar.setBackground("#6ae78d");
                this.panelBorder.add(this.progressBar);

            }

            /**
             * set the maxValue of the progress bar
             */
            set maxValue(value){
                this._maxValue = value;
                this.setProgressValues(this._value, this.labelMessage.getValue(), this.labelProgress.getValue());
            }

            /**
             * get the max value of the progress bar
             * @returns {*} Returns the max Value.
             */
            get maxValue(){
                return this._maxValue;
            }

            /**
             * set the value of the progress bar
             * @param value The value to set
             */
            set value(value){
                this._value = value;
                this.setProgressValues(value, this.labelMessage.getValue(), this.labelProgress.getValue());
            }

            /**
             * Get the current value of the progress bar.
             * @returns The value of the progress bar.
             */
            get value(){
                return this._value
            }

            /**
             * Set the progress message
             * @param text The progress message
             */
            set message(text){
                this.labelMessage.setValue(text);
            }

            /**
             * Get the progress message
             * @returns {*} The progress message
             */
            get message() {
                return this.labelMessage.getValue();
            }

            /**
             * set the progress value label text (Right Side message
             * @param text The progress value label text
             */
            set progressMessage(text){
                this.labelProgress.setValue(text);
            }

            /**
             * Get the progress value label text (Right Side message)
             * @returns {*} The progress value label text
             */
            get progressMessage() {
                return this.labelProgress.getValue();
            }

            /**
             * Set the progress bar color
             * @param color  The color of the progress bar
             */
            setProgressBarColor(color) {
                this.progressBar.setBackground(color);
            }

            /**
             * Set the progress container panels back color
             * @param color  The color of the progress container panel
             */
            setProgressPanelColor(color) {
                this.panelBorder.setBackground(color);
            }

            /**
             * Set the progress background color. This is the opaque color of the progress bars background, "DEFAULT: #000000CC"
             * @param color  The color to set the background
             */
            setBackgroundColor(color) {
                this.setBackground(color);
            }

            /**
             * Set the progress value and label text of the progress bar
             * @param value The value of the progress bar
             * @param messageText The message text
             * @param progressText The progress text
             */
            setProgressValues(value, messageText = "", progressText = ""){
                //Calculate the size of the progress bar...
                var progressSize = ((value/this._maxValue) * this._barWidth).toFixed(0);
                if(progressSize > this._barWidth) {progressSize = this._barWidth;}

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
            setMessageText(text){
                this.labelMessage.setValue(text);
                this.repaint();
            }

            /**
             * Set the progress value text of the progress bar (Right Message Text)
             * @param text The text to update the label to
             */
            setProgressText(text){
                this.labelProgress.setValue(text);
                this.repaint();
            }

            /**
             * Resize the progress bar to be the size specified
             * @param barHeight The height of the bar
             * @param barWidth The Width of the bar
             * @param fontSize The new font size of the text
             */
            resizeProgressBar(barHeight, barWidth, fontSize = 16){
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
            show() {
                this.setVisible(true)
            }

            /**
             * hide the progress bar
             */
            hide() {
                this.setVisible(false)
            }

            /**
             * Dispose and remove the progress bar
             */
            dispose() {
                this._barWidth = undefined;
                this._barHeight = undefined;
                this.panelBorder = undefined;
                this.progressBar = undefined;
                this.labelPanel = undefined;
                this.labelMessage = undefined;
                this.labelProgress = undefined;
                this.panelCenter = undefined
                this._maxValue = undefined;
                this._value = undefined;
                this._progressSize = undefined;
                this.removeMe();
            }
        };
    }
});
