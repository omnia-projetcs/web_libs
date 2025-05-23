/**
 * @file extended-search.js
 * @description Input search extended function with flags and more informations
 * @author Nicolas HANTEVILLE
 *
 * Copyright 2025 Nicolas HANTEVILLE
 * @link https://github.com/omnia-projetcs/web_libs
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
 
 document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('advanced-search-input');
    const suggestionsBox = document.getElementById('search-suggestions');

    // ====================================================================================
    // IMPORTANT : Remplacez ceci par l'URL de votre propre endpoint serveur
    // Exemple : const SERVER_SEARCH_ENDPOINT = '/api/search';
    const SERVER_SEARCH_ENDPOINT = 'YOUR_SERVER_ENDPOINT_HERE/search';
    // ====================================================================================

    let debounceTimer;

    const debounce = (func, delay) => {
        return function(...args) {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => func.apply(this, args), delay);
        };
    };

    function handleSuggestionItemClick(symbol, name, price) {
        console.log("Suggestion cliquée !");
        console.log("  Symbole:", symbol);
        console.log("  Nom    :", name);
        console.log("  Prix   :", price, "(type:", typeof price, ")");
        // Personnalisez cette fonction.
        // Exemple: searchInput.value = name; // Remplir le champ avec le nom
        hideSuggestions();
    }

    const displaySuggestions = (data) => {
        suggestionsBox.innerHTML = '';

        if (!data || !Array.isArray(data) || data.length === 0) {
            suggestionsBox.classList.remove('visible');
            return;
        }

        let hasContentToDisplay = false;
        data.forEach(group => {
            if (group.quoteType && Array.isArray(group.results) && group.results.length > 0) {
                hasContentToDisplay = true;
                const groupDiv = document.createElement('div');
                groupDiv.classList.add('suggestion-group');

                const categoryTitle = document.createElement('strong');
                categoryTitle.textContent = group.quoteType;
                groupDiv.appendChild(categoryTitle);

                group.results.forEach(item => {
                    if (item.text && item.link) {
                        const itemLink = document.createElement('a');
                        itemLink.href = item.link;

                        let symbol = '';
                        if (item.link) {
                            const parts = item.link.split('/').filter(part => part.trim() !== '');
                            if (parts.length > 0) {
                                symbol = parts[parts.length - 1].toUpperCase();
                            }
                        }
                        if (symbol) {
                            itemLink.dataset.symbol = symbol;
                        }
                        itemLink.dataset.name = item.text;
                        if (item.price !== undefined && item.price !== null) {
                            itemLink.dataset.price = item.price;
                        }

                        const suggestionMainLine = document.createElement('div');
                        suggestionMainLine.classList.add('suggestion-main-line');

                        const leftColumn = document.createElement('div');
                        leftColumn.classList.add('suggestion-left-column');
                        const nameLineDiv = document.createElement('div');
                        nameLineDiv.classList.add('name-line');

                        if (item.flag && typeof item.flag === 'string') {
                            const flagSpan = document.createElement('span');
                            flagSpan.className = `fi ${item.flag}`;
                            nameLineDiv.appendChild(flagSpan);
                        }
                        const mainTextSpan = document.createElement('span');
                        mainTextSpan.classList.add('main-text');
                        mainTextSpan.textContent = item.text;
                        nameLineDiv.appendChild(mainTextSpan);
                        leftColumn.appendChild(nameLineDiv);

                        if (item.sector && typeof item.sector === 'string' && item.sector.trim() !== '') {
                            const sectorDiv = document.createElement('div');
                            sectorDiv.classList.add('info-text');
                            sectorDiv.textContent = item.sector;
                            leftColumn.appendChild(sectorDiv);
                        }
                        suggestionMainLine.appendChild(leftColumn);

                        if (symbol || (item.price !== undefined && item.price !== null)) {
                            const rightColumn = document.createElement('div');
                            rightColumn.classList.add('suggestion-right-column');
                            if (symbol) {
                                let symbolIsinText = symbol;
                                if (item.isin && typeof item.isin === 'string' && item.isin.trim() !== '') {
                                    symbolIsinText = `${symbol} | ${item.isin}`;
                                }
                                const symbolIsinDiv = document.createElement('div');
                                symbolIsinDiv.textContent = symbolIsinText;
                                rightColumn.appendChild(symbolIsinDiv);
                            }
                            if (item.price !== undefined && item.price !== null) {
                                const priceDiv = document.createElement('div');
                                let priceText = item.price;
                                if (typeof item.price === 'number') {
                                    priceText = item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                }
                                priceDiv.textContent = `${priceText} €`;
                                priceDiv.classList.add('price-detail');
                                rightColumn.appendChild(priceDiv);
                            }
                            suggestionMainLine.appendChild(rightColumn);
                        }
                        itemLink.appendChild(suggestionMainLine);
                        groupDiv.appendChild(itemLink);
                    }
                });
                if (groupDiv.children.length > 1) {
                    suggestionsBox.appendChild(groupDiv);
                }
            }
        });

        if (hasContentToDisplay && suggestionsBox.children.length > 0) {
            suggestionsBox.classList.add('visible');
        } else {
            if (!suggestionsBox.querySelector('.loading-message') && !suggestionsBox.querySelector('.error-message')) {
                 if (!suggestionsBox.querySelector('.info-message')) { // Ne pas écraser un message d'erreur existant
                    suggestionsBox.innerHTML = '<p class="info-message">Aucun résultat trouvé.</p>';
                    suggestionsBox.classList.add('visible');
                 }
            } else if (suggestionsBox.children.length === 0) { // Si seulement message chargement/erreur et rien d'autre
                 suggestionsBox.classList.remove('visible');
            }
        }
    };

    const hideSuggestions = () => {
        if (!suggestionsBox.querySelector('.error-message')) { // Ne pas cacher si message d'erreur important
            suggestionsBox.classList.remove('visible');
        }
    };

    const clearSuggestionsOrMessage = () => {
        suggestionsBox.innerHTML = '';
        suggestionsBox.classList.remove('visible');
    };

    const fetchSuggestionsFromServer = async (query) => {
        console.log(`Workspaceing suggestions for query: "${query}"`);
        suggestionsBox.innerHTML = '<p class="loading-message">Chargement...</p>';
        suggestionsBox.classList.add('visible');
        try {
            const response = await fetch(`${SERVER_SEARCH_ENDPOINT}?term=${encodeURIComponent(query)}`);
            if (!response.ok) {
                let errorText = `Erreur du serveur : ${response.status}`;
                try {
                    const errorData = await response.json(); // Ou response.text()
                    errorText += ` - ${errorData.message || JSON.stringify(errorData)}`;
                } catch (e) { /* ignore si la réponse d'erreur n'est pas JSON */ }
                throw new Error(errorText);
            }
            const suggestionsData = await response.json();
            console.log('Suggestions reçues du serveur:', suggestionsData);
            if (suggestionsData && suggestionsData.length > 0) {
                displaySuggestions(suggestionsData);
            } else {
                suggestionsBox.innerHTML = '<p class="info-message">Aucun résultat trouvé pour votre recherche.</p>';
                if (!suggestionsBox.classList.contains('visible')) {
                     suggestionsBox.classList.add('visible');
                }
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des suggestions du serveur:', error);
            suggestionsBox.innerHTML = `<p class="error-message">Erreur: ${error.message}. Veuillez réessayer.</p>`;
            if (!suggestionsBox.classList.contains('visible')) {
                 suggestionsBox.classList.add('visible');
            }
        }
    };

    searchInput.addEventListener('input', debounce((e) => {
        const query = e.target.value.trim();
        if (query.length >= 3) {
            fetchSuggestionsFromServer(query);
        } else {
            clearSuggestionsOrMessage();
        }
    }, 500));

    suggestionsBox.addEventListener('click', function(event) {
        let targetElement = event.target;
        while (targetElement && targetElement !== this && targetElement.tagName !== 'A') {
            targetElement = targetElement.parentNode;
        }
        if (targetElement && targetElement.tagName === 'A' && targetElement.dataset.symbol) {
            event.preventDefault();
            const symbol = targetElement.dataset.symbol;
            const name = targetElement.dataset.name || '';
            const price = targetElement.dataset.price;
            handleSuggestionItemClick(symbol, name, price);
        }
    });

    document.addEventListener('click', (e) => {
        const searchContainer = document.querySelector('.search-container');
        if (searchContainer && !searchContainer.contains(e.target) && e.target !== searchInput) {
            if (!suggestionsBox.querySelector('.error-message')) {
                 hideSuggestions();
            }
        }
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideSuggestions();
        }
    });

    searchInput.addEventListener('focus', () => {
        const query = searchInput.value.trim();
        const hasErrorOrLoadingMessage = suggestionsBox.querySelector('.error-message') || suggestionsBox.querySelector('.loading-message');
        const hasInfoMessage = suggestionsBox.querySelector('.info-message');

        if (query.length >= 3 && suggestionsBox.children.length > 0 && 
            !hasErrorOrLoadingMessage && !hasInfoMessage &&
            // S'assurer qu'il y a de vrais groupes de suggestions et pas juste un message "aucun résultat" précédent
            suggestionsBox.querySelector('.suggestion-group')) {
            if (!suggestionsBox.classList.contains('visible')) {
                suggestionsBox.classList.add('visible');
            }
        } else if (query.length < 3) {
            if(!hasErrorOrLoadingMessage) {
                hideSuggestions();
            }
        }
    });
    console.log("Advanced search script (server-side) initialized.");
});
