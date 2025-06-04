## Extended-search
A fast and light advanced search input field with flags and multi-line information.
![Search Example](search.jpg)

---
# Advanced Search Suggestion Component

## Overview

This package provides an advanced search input field with dynamic suggestions. It's designed to fetch suggestions from a server when the user types (minimum 3 characters) and display them in a structured, two-column layout. It also includes a standalone demo version that uses local mock data.

The suggestions feature:
- Grouping by category (e.g., "quoteType").
- Display of a flag icon (if a valid flag class is provided).
- Main suggestion text (e.g., "Name").
- Secondary text below the name in the left column (e.g., "Sector").
- Right-aligned details in the right column:
    - Symbol and ISIN (e.g., "SYMBOL | ISIN" or just "SYMBOL").
    - Price with a "€" symbol below the Symbol/ISIN.
- Click handling on suggestions, passing `symbol`, `name`, and `price` to a JavaScript function.
- Debounced input to limit server requests.

## Files Included

-   **`demo.html`**: Main HTML file that links to external `extended-search.js` and `extended-search.css`. This version is configured for server-side search.
-   **`demo_full.html`**: A standalone HTML file with all CSS and JavaScript embedded. It uses local mock data for immediate demonstration of the UI and functionality.
-   **`extended-search.js`**: JavaScript file containing the logic for fetching data from a server, displaying suggestions, and handling user interactions.
-   **`extended-search.css`**: CSS file for styling the search input, suggestions box, and the layout of individual suggestion items.
-   **`sample-data.json`**: An example JSON file showing the expected data structure to be returned by your server endpoint.
-   **`README.md`**: This documentation file.

## Setup and Usage

### 1. `demo.html` (Server-Side Search)

This is the primary version intended for integration with a backend.

**a. Dependencies:**
   - The component uses `flag-icons` for displaying country flags. The CDN link is included in `demo.html`:
     ```html
     <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/flag-icons/7.2.1/css/flag-icons.min.css" ... />
     ```
   - Ensure you have `extended-search.css` and `extended-search.js` in the same directory as `demo.html`, or update the paths in `demo.html` accordingly.

**b. Server Endpoint Configuration:**
   - Open `extended-search.js`.
   - Locate the following line:
     ```javascript
     const SERVER_SEARCH_ENDPOINT = 'YOUR_SERVER_ENDPOINT_HERE/search';
     ```
   - **You MUST replace `'YOUR_SERVER_ENDPOINT_HERE/search'` with the actual URL of your server-side search API.**
   - The script will send a GET request to this endpoint with the search query appended as a parameter named `term` (e.g., `YOUR_SERVER_ENDPOINT_HERE/search?term=QUERY`). If your server expects a different parameter name (e.g., `q`), modify the `fetchURL` in the `fetchSuggestionsFromServer` function within `extended-search.js`.

**c. Expected Server JSON Response Format:**
   - Your server should respond with a JSON array of objects. Each object represents a suggestion group. Refer to `sample-data.json` for the detailed structure.
   - Key fields expected by `extended-search.js` for each item in the `results` array:
     - `quoteType`: (string) The category name for the group.
     - `results`: (array) An array of suggestion items.
       - `text`: (string) The main display text for the suggestion (e.g., company name).
       - `link`: (string) The URL the suggestion should link to. Also used to extract the `symbol`.
       - `flag`: (string, optional) The flag icon class suffix (e.g., `"fi-us"`, `"fi-fr"`). The script will prepend `"fi "` to this. If null or missing, no flag is shown.
       - `sector`: (string, optional) Text displayed below the main text in the left column.
       - `isin`: (string, optional) The ISIN code, displayed next to the symbol.
       - `price`: (string or number, optional) The price, displayed below the symbol/ISIN with a "€" suffix.

**d. Running:**
   - Place `demo.html`, `extended-search.js`, and `extended-search.css` on a web server.
   - Access `demo.html` through your web server in a browser.
   - Type at least 3 characters into the search box to trigger a request to your configured server endpoint.

### 2. `demo_full.html` (Standalone Demo)

This version is for quick preview and testing of the UI and client-side interactions without needing a live backend.

**a. How it Works:**
   - All CSS and JavaScript are embedded directly within the HTML file.
   - It uses a local JavaScript variable (`localMockData`) which contains the data from `sample-data.json`.
   - When you type (min. 3 characters), the JavaScript filters this local data instead of making a server request.

**b. Running:**
   - Simply open `demo_full.html` directly in a web browser (e.g., by double-clicking the file). No web server is needed for this version.

## JavaScript (`extended-search.js`) Functionality

**Key features:**

-   **Initialization (`DOMContentLoaded`):** Sets up event listeners and necessary variables.
-   **Debouncing (`debounce`):** User input is debounced (default 500ms for server search, 300ms for local demo) to limit the frequency of search requests while typing.
-   **Search Trigger:** A search is initiated only when the input field contains at least 3 characters.
-   **`fetchSuggestionsFromServer(query)` (in server version):**
    -   Constructs the request URL with the query.
    -   Fetches data from `SERVER_SEARCH_ENDPOINT`.
    -   Handles JSON parsing.
    -   Displays loading messages, search results via `displaySuggestions`, or error messages.
-   **`getLocalSuggestions(query)` (in `demo_full.html`):**
    -   Filters the `localMockData` based on the query.
    -   Searches in `item.text`, `item.sector`, derived `symbol`, and `item.isin`.
-   **`displaySuggestions(data)`:**
    -   Dynamically generates the HTML for the suggestion list based on the received data.
    -   Implements the two-column layout:
        -   **Left Column:** Flag, Main Text (Name), and Sector below the Name.
        -   **Right Column:** Symbol | ISIN, and Price € below that.
    -   Assigns `data-symbol`, `data-name`, and `data-price` attributes to each suggestion link for click handling.
-   **Symbol Extraction:** The symbol is derived from the `item.link` (e.g., the last part of the path, capitalized like "MSFT" from "/light/shard/MSFT/").
-   **`handleSuggestionItemClick(symbol, name, price)`:**
    -   This function is called when a suggestion item is clicked.
    -   It receives `symbol` (string), `name` (string, from `item.text`), and `price` (string or undefined, from `item.price`) as arguments.
    -   **You need to customize this function** to implement your desired action (e.g., navigate, fill input, make another API call).
    -   Currently, it logs the received parameters to the console and hides the suggestions.
-   **UI Interactions:**
    -   Suggestions hide when clicking outside the search component.
    -   Suggestions hide when the "Escape" key is pressed.
    -   Focusing on the input field can re-display existing valid suggestions if the query length is sufficient.

## CSS (`extended-search.css`) Styling

The `extended-search.css` file provides the complete styling for:
-   The overall page layout for the demo.
-   The search input field (`#advanced-search-input`).
-   The suggestions dropdown box (`.suggestions-box`), including scrollbar styling.
-   Suggestion groups and their titles (`.suggestion-group`, `strong`).
-   Individual suggestion items (`a` tags).
-   **Two-column layout within each suggestion item:**
    -   `.suggestion-main-line`: Flex container for the left and right columns.
    -   `.suggestion-left-column`: Contains the flag, name (`.main-text`), and sector (`.info-text`).
    -   `.suggestion-right-column`: Contains the symbol/ISIN and price (`.price-detail`).
-   Flag icons (`span.fi`).
-   Specific text elements like `.main-text`, `.info-text`, `.suggestion-right-details div`.
-   Loading, error, and info messages (`.loading-message`, `.error-message`, `.info-message`).

## Customization

1.  **Server Endpoint (for `extended-search.js` / `demo.html`):**
    -   Modify `SERVER_SEARCH_ENDPOINT` in `extended-search.js` to point to your API.
    -   Adjust the query parameter name in `fetchSuggestionsFromServer` if your server expects something other than `term`.

2.  **Click Action (`handleSuggestionItemClick`):**
    -   Edit the `handleSuggestionItemClick(symbol, name, price)` function in `extended-search.js` (and the embedded version in `demo_full.html`) to define what happens when a user clicks a suggestion.

3.  **Data Structure Adaptation:**
    -   If your server returns data in a different JSON structure, you will need to modify the `displaySuggestions` function (and potentially `getLocalSuggestions` in `demo_full.html`) to correctly parse and display your data. Pay attention to the keys used (e.g., `quoteType`, `results`, `text`, `link`, `flag`, `sector`, `isin`, `price`).

4.  **Styling:**
    -   Modify `extended-search.css` to change the appearance (colors, fonts, spacing, etc.) of the component.

5.  **Debounce Time:**
    -   Adjust the delay (in milliseconds) in the `debounce` call within the `searchInput.addEventListener('input', ...)` if needed. 500ms is for server requests, 300ms for local.

6.  **Minimum Query Length:**
    -   The 3-character minimum is hardcoded in the input event listener and `getLocalSuggestions`. You can change this value if desired.

---

This README should provide a good starting point for anyone using or developing this component further.
