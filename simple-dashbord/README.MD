Application de Création de Dashboard
À Propos du Projet

Cette application est un outil web complet et autonome, contenu dans un unique fichier demo.html. Elle permet de créer des tableaux de bord personnalisés de manière visuelle et intuitive, en utilisant uniquement du JavaScript "vanilla", HTML5 et CSS3, sans aucune dépendance externe.

Le projet met l'accent sur une interface claire, une expérience utilisateur fluide et une gestion de la disposition basée sur une grille flexible.
Fichier Principal

    demo.html : C'est le seul fichier dont vous avez besoin. Il contient le HTML, le CSS et tout le code JavaScript nécessaire pour faire fonctionner l'application.

Comment l'utiliser ?

C'est très simple : ouvrez simplement le fichier demo.html dans n'importe quel navigateur web moderne (Chrome, Firefox, Edge, Safari).
Fonctionnalités Clés

L'application offre une gamme complète de fonctionnalités pour construire et gérer vos tableaux de bord :
Gestion du Dashboard

    Nouveau Dashboard : Un bouton pour effacer complètement l'espace de travail et recommencer à zéro.

    Sauvegarder : Exporte la configuration actuelle de votre tableau de bord (l'ordre, le contenu et la taille de chaque widget) dans un fichier dashboard-layout.json que vous pouvez télécharger.

    Importer : Permet de charger un fichier dashboard-layout.json précédemment sauvegardé pour restaurer instantanément une configuration.

Gestion des Widgets

    Ajout de Widgets : Des boutons dédiés permettent d'ajouter 4 types de widgets :

        Texte : Pour afficher un titre et un paragraphe.

        Image : Pour afficher une image à partir d'une URL.

        Lien : Pour créer un lien hypertexte cliquable.

        Graphique : Pour générer un diagramme en barres simple à partir de données JSON.

    Déplacement (Drag & Drop) : Vous pouvez réorganiser les widgets en les glissant-déposant simplement dans l'espace de travail. Ils s'inséreront intelligemment entre les autres éléments.

    Redimensionnement : Chaque widget peut être redimensionné à l'aide de la poignée située dans son coin inférieur droit. Sa taille s'ajustera automatiquement pour s'aligner sur la grille sous-jacente, garantissant un agencement propre.

    Suppression : Une icône de corbeille (croix) apparaît au survol de chaque widget pour le supprimer.

    Édition : Un double-clic sur un widget ouvre une fenêtre modale permettant de modifier son contenu (texte, URL, données du graphique, etc.).

Structure du Code (interne à demo.html)

Pour ceux qui souhaitent explorer le code, le fichier est organisé comme suit :

    <head> : Contient une balise <style> avec toutes les règles CSS nécessaires pour l'interface.

    <body> : Contient la structure HTML de l'application (en-tête, zone de travail, modales).

    <script> : Située à la fin du <body>, cette balise contient tout le code JavaScript encapsulé dans un module Dashboard pour éviter de polluer l'espace de nom global. Le script s'initialise automatiquement une fois la page chargée.