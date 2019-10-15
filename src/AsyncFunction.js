export default (() => {
    if (!window.AsyncFunction) {
        window.AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
    }
})();
