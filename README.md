# coactive-client-extensions
Provides extensions for the Coactive browser client JavaScript API.

## Usage
In your Coactive environment's Startup JavaScript, dynamically import the extensions that you need from any public CDN that hosts npm packages (e.g. [unpkg.com](unpkg.com), [cdnjs.com](cdnjs.com)):

```
// Load the api.utils namespace helper functions
import("//unpkg.com/coactive-client-extensions@latest/src/api/utils").then(() => {
    // Use api.utils members now
});
```
Each extension is a self-executing module that adds helpful functions off of your environment's `api` namespace.

## Sample
```
// Base path to self-executing JavaScript source is `/src`; specify version using npm syntax after @
const apiExtensionsBaseUrl = "//unpkg.com/coactive-client-extensions@0.0.32/src";

// Create the extension loader used to extend all other namespaces
import(`${apiExtensionsBaseUrl}/api/utils`).then(() => {
    // Load custom fonts
    api.utils.loadGoogleFonts([
        "Roboto",
        "Fira Sans",
    ]);
});
import(`${apiExtensionsBaseUrl}/api/environment`);
import(`${apiExtensionsBaseUrl}/api/bindingsRegistry`);
import(`${apiExtensionsBaseUrl}/api/controls`);
import(`${apiExtensionsBaseUrl}/api/runtime`).then(() => {
    // Now that we've loaded the api.runtime.images namespace and added helpers
    // and default images, we can add/override app-specific images
    api.runtime.images.addImages({
        logo: `<svg height="100" width="100">
                 <circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="blue" />
               </svg> `,
    });
import(`${apiExtensionsBaseUrl}/api/actions`);
import(`${apiExtensionsBaseUrl}/api/ui`);
import(`${apiExtensionsBaseUrl}/api/designer`);
import(`${apiExtensionsBaseUrl}/api/data`);
import(`${apiExtensionsBaseUrl}/ExtendCoactiveTypes`);
import(`${apiExtensionsBaseUrl}/AsyncFunction`);
```
