Bibliothèque de Mind Mapping "MindMeld.js"

MindMeld.js est une bibliothèque JavaScript pure (vanilla JS) et légère pour créer des cartes mentales interactives dans n'importe quelle page web. Elle ne nécessite aucune dépendance externe (framework) et utilise SVG pour un rendu de haute qualité.
Fonctionnalités

    Gestion complète des nœuds : Créer, éditer, supprimer et déplacer les nœuds.

    Déplacement libre : Déplacez n'importe quel nœud (et ses enfants) librement sur le canevas.

    Alignement sur grille : Les nœuds s'alignent automatiquement sur une grille pour un agencement propre.

    Prévention des collisions : Les nœuds ne se superposent pas lorsqu'ils sont déplacés.

    Personnalisation : Changez la couleur et le texte de chaque nœud, avec prise en charge des liens Markdown.

    Navigation intuitive : Zoom (molette et boutons) et panoramique (glisser-déposer le fond).

    Sauvegarde locale : L'état de la carte est automatiquement sauvegardé dans le localStorage du navigateur.

    Import/Export : Sauvegardez et chargez vos cartes mentales au format JSON.

Installation et Utilisation

Pour utiliser MindMeld.js, vous devez inclure les fichiers mindmeld.css et mindmeld.js dans votre page HTML, et préparer la structure HTML nécessaire.
1. Structure HTML

Placez cette structure dans le <body> de votre page. La bibliothèque s'attachera automatiquement à ces éléments grâce à leurs IDs.

<!-- Conteneur principal de l'application -->
<div id="app-container">
    <!-- Barre d'outils (optionnelle mais recommandée pour la démo) -->
    <div id="toolbar">
        <span class="toolbar-title">MindMeld</span>
        <!-- ... autres boutons ... -->
    </div>

    <!-- Conteneur du canevas (obligatoire) -->
    <div id="mindmap-container">
        <!-- Le SVG sera généré ici par la bibliothèque -->
    </div>
</div>

<!-- Modales (obligatoires pour les fonctionnalités d'édition/confirmation) -->
<div id="edit-modal" class="modal-overlay">
    <!-- ... contenu de la modale d'édition ... -->
</div>
<div id="confirm-modal" class="modal-overlay">
    <!-- ... contenu de la modale de confirmation ... -->
</div>

<!-- Menu contextuel (obligatoire pour le clic droit) -->
<div id="context-menu">
    <!-- ... contenu du menu ... -->
</div>

(Pour une structure complète, référez-vous au fichier demo.html)
2. Lier les fichiers

Dans votre fichier HTML, juste avant la fin de la balise </body>, liez les fichiers CSS et JavaScript.

<head>
    <!-- ... autres balises meta et title ... -->
    <link rel="stylesheet" href="mindmeld.css">
</head>
<body>
    <!-- ... votre structure HTML ... -->

    <script src="mindmeld.js"></script>
</body>

3. Initialisation

La bibliothèque s'initialise automatiquement au chargement du script. Elle cherchera les IDs par défaut (#app-container, #toolbar, etc.) pour fonctionner. Aucune étape d'initialisation manuelle n'est requise pour la démo de base.