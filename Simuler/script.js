document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const dureeRange = document.getElementById('duree');
    const dureeText = document.getElementById('dureeText');
    const dureeValueDisplay = document.getElementById('dureeValue');

    const montantPourcentageRange = document.getElementById('montantPourcentage');
    const montantPourcentageText = document.getElementById('montantPourcentageText');
    const montantPourcentageValueDisplay = document.getElementById('montantPourcentageValue');

    const salaireInitialRange = document.getElementById('salaireInitial');
    const salaireInitialText = document.getElementById('salaireInitialText');
    const salaireInitialValueDisplay = document.getElementById('salaireInitialValue');

    const augmentationSalaireRange = document.getElementById('augmentationSalaire');
    const augmentationSalaireText = document.getElementById('augmentationSalaireText');
    const augmentationSalaireValueDisplay = document.getElementById('augmentationSalaireValue');

    const tauxLivretRange = document.getElementById('tauxLivret');
    const tauxLivretText = document.getElementById('tauxLivretText');
    const tauxLivretValueDisplay = document.getElementById('tauxLivretValue');

    const tauxSimulationRange = document.getElementById('tauxSimulation');
    const tauxSimulationText = document.getElementById('tauxSimulationText');
    const tauxSimulationValueDisplay = document.getElementById('tauxSimulationValue');

    // Summary elements
    const totalInvestiDisplay = document.getElementById('totalInvesti');
    const interetsGagnesDisplay = document.getElementById('interetsGagnes');
    const montantFinalDisplay = document.getElementById('montantFinal');
    const montantFinalLivretDisplay = document.getElementById('montantFinalLivret');

    // Canvas for chart
    const chartCanvasId = 'simulationChart'; // ID du canvas défini dans index.html

    // --- Sync Input Fields (Range and Text) ---
    function syncInputs(rangeInput, textInput, valueDisplay, isCurrency = false, isPercent = false) {
        const updateDisplay = (value) => {
            let displayVal = value;
            if (isCurrency) displayVal ;
            if (isPercent && !isCurrency) displayVal; // Avoid double % if currency is also percent (not typical)
             if (valueDisplay) valueDisplay.textContent = displayVal;
        };

        rangeInput.addEventListener('input', () => {
            textInput.value = rangeInput.value;
            updateDisplay(rangeInput.value);
            triggerUpdate();
        });
        textInput.addEventListener('input', () => {
            // Basic validation to keep text input within range min/max
            let value = parseFloat(textInput.value);
            const min = parseFloat(rangeInput.min);
            const max = parseFloat(rangeInput.max);
            if (isNaN(value)) value = min; // Or some other default
            if (value < min) value = min;
            if (value > max) value = max;
            textInput.value = value; // Corrected value
            rangeInput.value = value;
            updateDisplay(value);
            triggerUpdate();
        });
        // Initial sync
        updateDisplay(rangeInput.value);
    }

    syncInputs(dureeRange, dureeText, dureeValueDisplay);
    syncInputs(montantPourcentageRange, montantPourcentageText, montantPourcentageValueDisplay, false, true);
    syncInputs(salaireInitialRange, salaireInitialText, salaireInitialValueDisplay, true);
    syncInputs(augmentationSalaireRange, augmentationSalaireText, augmentationSalaireValueDisplay, false, true);
    syncInputs(tauxLivretRange, tauxLivretText, tauxLivretValueDisplay, false, true);
    syncInputs(tauxSimulationRange, tauxSimulationText, tauxSimulationValueDisplay, false, true);

    // --- Calculation Logic ---
    function calculateSimulation() {
        const duree = parseInt(dureeRange.value);
        const pourcentageInvesti = parseFloat(montantPourcentageRange.value) / 100;
        const salaireInitial = parseFloat(salaireInitialRange.value);
        const augmentationAnnuelleSalaire = parseFloat(augmentationSalaireRange.value) / 100;
        const tauxLivretRef = parseFloat(tauxLivretRange.value) / 100;
        const tauxInteretSimulation = parseFloat(tauxSimulationRange.value) / 100; // Utilisation du nouvel input

        let currentSalaire = salaireInitial;
        let totalInvesti = 0;
        let capitalAvecInterets = 0;
        let capitalLivretRef = 0;

        const annees = [];
        const salairesData = [];
        const investissementGlobalData = [];
        const investissementAvecInteretsData = [];
        const livretRefData = [];

        for (let an = 1; an <= duree; an++) {
            annees.push(an);

            // Calcul du salaire pour l'année en cours (augmentation à partir de l'année 2)
            if (an > 1) {
                currentSalaire *= (1 + augmentationAnnuelleSalaire);
            }
            salairesData.push(currentSalaire);

            const investissementAnnuel = currentSalaire * pourcentageInvesti;
            totalInvesti += investissementAnnuel;
            investissementGlobalData.push(totalInvesti);

            // Calcul pour la simulation principale
            capitalAvecInterets += investissementAnnuel; // Versement de l'année
            capitalAvecInterets *= (1 + tauxInteretSimulation); // Intérêts sur le capital existant + nouveau versement

            // Calcul pour le livret de référence
            capitalLivretRef += investissementAnnuel; // Versement de l'année
            capitalLivretRef *= (1 + tauxLivretRef); // Intérêts sur le capital existant + nouveau versement

            investissementAvecInteretsData.push(capitalAvecInterets);
            livretRefData.push(capitalLivretRef);
        }

        const interetsGagnesSimulation = capitalAvecInterets - totalInvesti;

        return {
            annees,
            salairesData,
            investissementGlobalData,
            investissementAvecInteretsData,
            livretRefData,
            summary: {
                totalInvesti,
                interetsGagnesSimulation,
                montantFinalSimulation: capitalAvecInterets,
                montantFinalLivretRef: capitalLivretRef
            }
        };
    }

    // --- Display Summary ---
    function displaySummary(summaryData) {
        totalInvestiDisplay.textContent = summaryData.totalInvesti.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        interetsGagnesDisplay.textContent = summaryData.interetsGagnesSimulation.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        montantFinalDisplay.textContent = summaryData.montantFinalSimulation.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        montantFinalLivretDisplay.textContent = summaryData.montantFinalLivretRef.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }

    // --- Render Chart ---
    let chartInstance = null;

    function renderChart(data) {
        const chartData = {
            labels: data.annees.map(an => `Année ${an}`),
            datasets: [
                {
                    label: 'Salaire (€)',
                    values: data.salairesData,
                    borderColor: '#3498db', // Bleu
                    backgroundColor: 'rgba(52, 152, 219, 0.1)', // Bleu clair transparent pour le remplissage
                    type: 'line',
                    fill: true, // Activer le remplissage sous la ligne
                    tension: 0.1 // Légère courbure
                },
                {
                    label: 'Montant Global Investi (€)',
                    values: data.investissementGlobalData,
                    borderColor: '#2ecc71', // Vert
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    type: 'line',
                    fill: true,
                    tension: 0.1
                },
                {
                    label: 'Investi + Intérêts (Simu) (€)',
                    values: data.investissementAvecInteretsData,
                    borderColor: '#e74c3c', // Rouge
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    type: 'line',
                    fill: true,
                    tension: 0.1
                },
                {
                    label: 'Investi + Intérêts (Livret Réf.) (€)',
                    values: data.livretRefData,
                    borderColor: '#f39c12', // Orange
                    backgroundColor: 'rgba(243, 156, 18, 0.1)',
                    type: 'line',
                    fill: true,
                    tension: 0.1
                }
            ]
        };

        const chartOptions = {
            type: 'line', // Type de graphique global
            theme: 'light', // ou 'dark'
            options: {
                title: {
                    display: true,
                    text: 'Simulation d\'Investissement sur la Durée',
                    font: '16px Arial bold',
                },
                legend: {
                    display: true,
                    position: 'bottom', // 'top' ou 'bottom'
                },
                yAxes: [{ // Configuration de l'axe Y principal (gauche par défaut)
                    id: 'left', // Important pour associer les datasets si plusieurs axes Y
                    beginAtZero: true,
                    title: 'Montant (€)',
                    displayTitle: true,
                }],
                xAxis: {
                    title: 'Années',
                    displayTitle: true,
                },
                tooltip: {
                    enabled: true,
                    // La fonction formatter par défaut de PureChart devrait bien fonctionner ici
                },
                autosize: true // Permet au graphique de s'adapter à la taille du conteneur canvas
            }
        };

        if (chartInstance) {
            // Si l'instance existe, essayons de mettre à jour les données et de redessiner.
            // PureChart.js (version 0.13) redessine automatiquement après _mergeDeep sur this.config
            // et n'a pas de méthode publique `updateData` ou `update`.
            // La méthode la plus sûre est de détruire et recréer, ou de modifier directement this.config.data et appeler _draw().
            // Pour la robustesse et en se basant sur l'API de la v0.13, détruire et recréer est plus simple.
            chartInstance.destroy();
            chartInstance = new PureChart(chartCanvasId, { ...chartOptions, data: chartData });
        } else {
            chartInstance = new PureChart(chartCanvasId, { ...chartOptions, data: chartData });
        }
         if (!chartInstance.isValid) {
            console.error("Erreur lors de la création ou de la mise à jour du graphique PureChart.");
        }
    }

    // --- Trigger Update ---
    function triggerUpdate() {
        const simulationData = calculateSimulation();
        displaySummary(simulationData.summary);
        renderChart({
            annees: simulationData.annees,
            salairesData: simulationData.salairesData,
            investissementGlobalData: simulationData.investissementGlobalData,
            investissementAvecInteretsData: simulationData.investissementAvecInteretsData,
            livretRefData: simulationData.livretRefData,
        });
    }

    // --- Initial Load ---
    triggerUpdate(); // Calculate and display on page load
});
