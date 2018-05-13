/*
Copyright (C) 2018
Developed at University of Toronto

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

// common colour varianles
const colours = Object.freeze({
    green: 'green',
    orangeDark: 'orange accent-4',
    red: 'red',
    redDark: 'red darken-4',
    yellow: 'yellow'
});

const snack = Object.freeze({
    success: '<i class="material-icons">check</i>&nbsp&nbsp&nbsp',
    warning: '<i class="material-icons">warning</i>&nbsp&nbsp&nbsp',
    fail: '<i class="material-icons">cancel</i>&nbsp&nbsp&nbsp',
    close: '&nbsp&nbsp&nbsp<i id=closeSnack class="material-icons pointer">close</i>'
});

/* This function slides down a success snakbar */
function successSnackbar(msg) {
    // runs the toast function for 5s with given msg and colour
    Materialize.toast(`${snack.success}${msg}${snack.close}`, 5000, colours.green);
}

/* This function slides down a warning snakbar */
function warningSnackbar(msg) {
    // runs the toast function for 5s with given msg and colour
    Materialize.toast(`${snack.warning}${msg}${snack.close}`, 5000, colours.orangeDark);
}

/* This function slides down a fail snakbar */
function failSnackbar(msg) {
    // runs the toast function for 5s with given msg and colour
    Materialize.toast(`${snack.fail}${msg}${snack.close}`, 5000, colours.redDark);
}

/* Listener for the `x` on the snackbar/toasts */
$(document).on('click', '#closeSnack', function () {
    $(this).parent().fadeOut();
});

/*
UI Translations for user display

1000 -> user errors
2000 -> system errors
3000 -> settings errors
4000 -> custom file system errors
8000 -> comments
9000 -> notifications
10000 -> sprints
11000 -> releases
12000 -> tags
13000 -> feedback
*/
const translations = Object.freeze({
    en: {
        //1000 system errors
        1000: 'Invalid request',
        1009: 'Failed to parse csv file',
        1010: 'Website setup is not complete',

        //2000 user errors
        2000: 'Invalid username or password',
        2001: 'User already exists',
        2002: 'Invalid username or password',
        2003: 'Invalid username or password',
        2004: 'Invalid username or password',
        2005: 'Account is not active',
        2006: 'Session timed out',
        2007: 'Failed to update user, missing information',
        2008: 'Invalid profile picture extension',
        2009: 'Invalid users import file extension',
        2010: 'Permission denied',
        2011: 'Password and confirm password do not match',
        2012: 'Project is already active',
        2013: 'Project is already closed',
        2014: 'Project is not in draft',
        2015: 'Cant update team, invalid action',
        2016: 'You are already in a team, leave it to join a new one',
        2017: 'User is not in a team',
        2020: 'Cant exceed team size',
        2021: 'Mismatching team names',
        2022: 'Permission denied',
        2023: 'Permission denied',
        2024: 'Permission denied',
        2025: 'Permission denied',
        2026: 'Permission denied',
        2027: 'Permission denied',
        2028: 'Permission denied',
        2029: 'Permission denied',
        2030: 'Permission denied',
        2031: 'Permission denied',
        2032: 'Permission denied',
        2033: 'Permission denied',
        2034: 'Permission denied',
        2035: 'Permission denied',
        2036: 'Permission denied',
        2037: 'Permission denied',
        2038: 'Permission denied',
        2039: 'Permission denied',
        2040: 'Permission denied',
        2041: 'Permission denied',
        2042: 'Cant update project, project is in terminal status',
        2043: 'Project is not active',
        2044: 'Project is not active or closed',

        //3000 settings errors
        3005: 'could not update the selected mode',
        3006: 'Invalid mode',
        3007: 'Website is not active',

        //4000 custom file system errors
        4010: 'Permission denied',

        //5000 projects
        5001: 'Failed to add a project',
        5002: 'Failed to get projects list',
        5003: 'Failed to get a project',
        5004: 'Project not found',
        5005: 'Failed to update projects',
        5006: 'Failed to update project',
        5007: 'Project already exists',

        //6000 teams
        6001: 'Failed to add a team',
        6002: 'Failed to get teams list',
        6003: 'Failed to get a team',
        6004: 'Team not found',
        6005: 'Failed to update team',
        6006: 'Failed to create a team',
        6007: 'Failed to update a team',

        //7000 tickets
        7001: 'Failed to add a ticket',
        7002: 'Failed to get tickets list',
        7003: 'Failed to get a ticket',
        7004: 'Ticket not found',
        7005: 'Failed to update ticket',
        7006: 'Failed to create a ticket',
        7007: 'Failed to update a ticket',

        //8000 comment
        8001: 'Failed to add a comment',
        8005: 'Failed to update comment',
        8006: 'Failed to create a comment',
        8007: 'Failed to update a comment',

        //9000 notifications
        9001: 'Failed to add a notification',
        9002: 'Failed to get notifications list',
        9003: 'Failed to get a notification',
        9004: 'Notification not found',
        9005: 'Failed to update notification',
        9006: 'Failed to create a notification',
        9007: 'Failed to update a notification',
        9008: 'Failed to delete a notification',
        9009: 'Failed to delete a notification',
        9010: 'Failed to delete a notification',

        //10,000 sprints
        10001: 'Failed to add a sprint',
        10002: 'Failed to get sprints list',
        10003: 'Failed to get a sprint',
        10004: 'Sprint not found',
        10005: 'Failed to update sprint',
        10006: 'Failed to create a sprint',
        10007: 'Failed to update a sprint',

        //11,000 releases
        11001: 'Failed to add a release',
        11002: 'Failed to get releases list',
        11003: 'Failed to get a release',
        11004: 'Release not found',
        11005: 'Failed to update release',
        11006: 'Failed to create a release',
        11007: 'Failed to update a release',

        //12,000 tags
        12001: 'Failed to add a tag',
        12002: 'Failed to get tags list',
        12003: 'Failed to get a tag',
        12004: 'Tag not found',
        12005: 'Failed to update tag',
        12006: 'Failed to create a tag',
        12007: 'Failed to update a tag',

        //13,000 feedback
        13005: 'Failed to submit feedback',
        13006: 'Can not access feedback page',

        activatedProject: 'Project has been activated',
        closedProject: 'Project has been closed',
        activateProjectPrompt: 'Are you sure you want to activate this project?',
        adminConfigurationSuccess: 'Admins have been saved successfully',
        alreadyInGroup: 'This user is already in this group',
        backlog: 'Backlog',
        closeProjectPrompt: 'Are you sure you want to close this project?',
        defaultError: 'Something went wrong, please try again!',
        deleteAllGroupsWarning: 'Are you sure you would like to delete all created groups?',
        deletedProject: 'Project has been deleted',
        deleteProjectPrompt: 'Are you sure you want to delete this project?',
        deletePremadeGroups: 'Would you like to delete the groups that are already made?',
        doneTickets: 'Done Tickets',
        emptyProjectDescription: 'Please enter your description in the editor.',
        groupConfigurationSuccess: 'Groups have been saved successfully',
        groupMembersDelete: 'This group has members, deleting it will make all members go to the unassigned list',
        groupNameAlreadyExists: 'Group name already exists',
        groupNameCantBeEmpty: 'Group name can\'t be empty',
        groupSelectionConfigurationSuccess: 'Group selection has been saved successfully',
        groupSizeCantBeZero: 'Group size must be a positive integer',
        issuesFound: 'issues found',
        members: 'Members',
        mustBeCsv: 'File format must be csv!',
        mustBeVelocity: 'File format must be velocity!',
        mustImportOneFile: 'You can only import one file!',
        na: 'N/A',
        newTickets: 'New Tickets',
        noassignee: 'No Assignee',
        noMembers: 'No Members',
        noResultsFoundBasedOnSearch: 'No results found based on your search',
        notInGroup: 'You are currently not in a group',
        passwordsDontMatch: 'Passwords do not match',
        points: 'Points',
        progressTickets: 'In Development Tickets',
        randomize: 'Randomize',
        randomizeRemainingWarning: 'Are you sure you would like to randomize all unassigned users in new groups?',
        selectGroup: 'Select Group',
        size: 'Size',
        successfulFileUpload: 'File uploaded successfully',
        successfulFileDownload: 'File downloaded successfully',
        tickets: 'Tickets',
        total: 'total',
        uploadOnlyPicture: 'You can only upload one picture!',
        updatedProject: 'Project has been updated',
        updateProjectPrompt: 'Are you sure you want to update the project with this new configuration?',
        alreadyInGroup: 'This user is already in this group',
        groupNameCantBeEmpty: 'Group name can\'t be empty',
        groupNamealreadyExists: 'Group name already exists',
        groupMembersDelete: 'This group has members, deleting it will make all members go to the unassigned list',
        groupSizeCantBeZero: 'Group size must be a positive integer',
        deletePremadeGroups: 'Would you like to delete the groups that are already made?',
        randomizeRemainingWarning: 'Are you sure you would like to randomize all unassigned users in new groups?',
        randomize: 'Randomize',
        saveProjectPrompt: 'Are you sure you want to save the project with the current configurations?',
        groupSelectionConfigurationSuccess: 'Group selection has been saved successfully',
        groupConfigurationSuccess: 'Groups have been saved successfully',
        adminConfigurationSuccess: 'Admins have been saved successfully',
        notInGroup: 'You are currently not in a group',
        deleteAllGroupsWarning: 'Are you sure you would like to delete all created groups?',
        closeReleaseWarning: 'Are you sure you want to close this release?',
        deleteReleaseWarning: 'Are you sure you want to delete this release?',
        activateSprintWarning: 'Are you sure you would like to activate this sprint? It will close any currently active sprint',
        closeSprintWarning: 'Are you sure you would like to close this sprint?',
        deleteSprintWarning: 'Are you sure you would like to delete this sprint?',
        deleteTagWarning: 'Are you sure you would like to delete this tag?',
        titleCanNotBeEmpty: 'Title can not be empty!',
        descriptionCanNotBeEmpty: 'Description can not be empty!',
        commentCanNotBeEmpty: 'Comment can not be empty!',
        saveBoardType: 'BE CAREFUL, this can NOT be changed!',
        updatedTicket: 'Ticket has been updated',
        startDate: 'Start Date: ',
        endDate: 'End Date: ',
        emptyRelease: 'Release field cannot be empty',
        emptyTag: 'Tag field cannot be empty',
        emptySprint: 'Sprint field cannot be empty',
        emptySprintStart: 'Start date cannot be empty',
        emptySprintEnd: 'End date cannot be empty',
        emptyDeadlineDate: 'Deadline Date can not be empty',
        emptyDeadlineTime: 'Deadline Time can not be empty',

        todoTitle: 'TODO',
        inProgressTitle: 'IN DEVELOPMENT',
        codeReviewTitle: 'CODE REVIEW',
        readyForTestTitle: 'READY FOR TEST',
        inTestTitle: 'IN TEST',
        doneTitle: 'DONE',

        user0: 'Mode Selector',
        user1: 'Collaborator Admin',
        user2: 'Collaborator',
        user3: 'Professor',
        user4: 'Teaching Assistant',
        user5: 'Student',

        state0: 'New',
        state1: 'In Development',
        state2: 'Code Review',
        state3: 'Ready For Test',
        state4: 'In Test',
        state5: 'Done',

        projectStatus0: 'Closed',
        projectStatus1: 'Draft',
        projectStatus2: 'Active',

        ok: 'Ok',
        close: 'Close',
        clear: 'Clear',
        cancel: 'Cancel',
        activate: 'Activate',
        delete: 'Delete',
        save: 'Save',
        update: 'Update',

        today: 'Today',
        now: 'Now'
    },
    fr: {
        1000: "Requête invalide",
        1009: "Échec de l'analyse du fichier csv",
        1010: "La configuration du site Web n'est pas complète",
        2000: "Nom d'utilisateur ou mot de passe invalide",
        2001: "L'utilisateur existe déjà",
        2002: "Nom d'utilisateur ou mot de passe invalide",
        2003: "Nom d'utilisateur ou mot de passe invalide",
        2004: "Nom d'utilisateur ou mot de passe invalide",
        2005: "Le compte n'est pas actif",
        2006: "session expirée",
        2007: "Échec de la mise à jour de l'utilisateur, informations manquantes",
        2008: "Extension d'image de profil non valide",
        2009: "Les utilisateurs non valides importent l'extension de fichier",
        2010: "Permission refusée",
        2011: "Mot de passe et confirmez le mot de passe ne correspond pas",
        2012: "Le projet est déjà actif",
        2013: "Le projet est déjà fermé",
        2014: "Le projet n'est pas en projet",
        2015: "Ne doit pas mettre à jour l'équipe, action non valide",
        2016: "Vous êtes déjà dans une équipe, laissez-le en rejoindre un nouveau",
        2017: "L'utilisateur n'est pas dans une équipe",
        2020: "Ne doit pas dépasser la taille de l'équipe",
        2021: "Noms d'équipe non concordants",
        2022: "Permission refusée",
        2023: "Permission refusée",
        2024: "Permission refusée",
        2025: "Permission refusée",
        2026: "Permission refusée",
        2027: "Permission refusée",
        2028: "Permission refusée",
        2029: "Permission refusée",
        2030: "Permission refusée",
        2031: "Permission refusée",
        2032: "Permission refusée",
        2033: "Permission refusée",
        2034: "Permission refusée",
        2035: "Permission refusée",
        2036: "Permission refusée",
        2037: "Permission refusée",
        2038: "Permission refusée",
        2039: "Permission refusée",
        2040: "Permission refusée",
        2041: "Permission refusée",
        2042: "ne doit pas mettre à jour le projet, le projet est en statut terminal",
        2043: "Le projet n'est pas actif",
        2044: "Le projet n'est pas actif ou fermé",
        3005: "n'a pas pu mettre à jour le mode sélectionné",
        3006: "Mode invalide",
        3007: "Le site Web n'est pas actif",
        4010: "Permission refusée",
        5001: "Échec de l'ajout d'un projet",
        5002: "Impossible d'obtenir la liste des projets",
        5003: "Impossible d'obtenir un projet",
        5004: "Projet non trouvé",
        5005: "Échec de la mise à jour des projets",
        5006: "Échec de la mise à jour du projet",
        5007: "Le projet existe déjà",
        6001: "Échec de l'ajout d'une équipe",
        6002: "Échec d'obtention de la liste des équipes",
        6003: "Échec de l'obtention d'une équipe",
        6004: "Équipe introuvable",
        6005: "Impossible de mettre à jour l'équipe",
        6006: "Échec de la création d'une équipe",
        6007: "Échec de la mise à jour d'une équipe",
        7001: "Échec de l'ajout d'un ticket",
        7002: "Impossible d'obtenir la liste des tickets",
        7003: "Impossible d'obtenir un ticket",
        7004: "Ticket non trouvé",
        7005: "Échec de la mise à jour du ticket",
        7006: "Impossible de créer un ticket",
        7007: "Échec de la mise à jour d'un ticket",
        8001: "Impossible d'ajouter un commentaire",
        8005: "Échec de la mise à jour du commentaire",
        8006: "Impossible de créer un commentaire",
        8007: "Échec de la mise à jour d'un commentaire",
        9001: "Échec de l'ajout d'une notification",
        9002: "Impossible d'obtenir la liste des notifications",
        9003: "Impossible d'obtenir une notification",
        9004: "Notification non trouvée",
        9005: "Impossible de mettre à jour la notification",
        9006: "Impossible de créer une notification",
        9007: "Échec de la mise à jour d'une notification",
        9008: "Échec de la suppression d'une notification",
        9009: "Échec de la suppression d'une notification",
        9010: "Échec de la suppression d'une notification",
        10001: "Impossible d'ajouter un sprint",
        10002: "Impossible d'obtenir la liste des sprints",
        10003: "Échec de l'obtention d'un sprint",
        10004: "Sprint introuvable",
        10005: "Échec de la mise à jour du sprint",
        10006: "Impossible de créer un sprint",
        10007: "Échec de la mise à jour d'un sprint",
        11001: "Échec de l'ajout d'une version",
        11002: "Impossible d'obtenir la liste des releases",
        11003: "Échec de l'obtention d'une version",
        11004: "Version non trouvée",
        11005: "Échec de mise à jour de la version",
        11006: "Échec de la création d'une version",
        11007: "Échec de la mise à jour d'une version",
        12001: "Échec de l'ajout d'un tag",
        12002: "Impossible d'obtenir la liste des tags",
        12003: "Impossible d'obtenir un tag",
        12004: "Tag introuvable",
        12005: "Échec de la mise à jour du tag",
        12006: "Échec de la création d'un tag",
        12007: "Échec de la mise à jour d'un tag",
        13005: "Échec de la soumission des commentaires",
        13006: "Impossible d'accéder à la page de commentaires",
        activatedProject: "Le projet a été activé",
        closedProject: "Le projet a été fermé",
        activateProjectPrompt: "Êtes-vous sûr de vouloir activer ce projet?",
        adminConfigurationSuccess: "Les administrateurs ont été enregistrés avec succès",
        alreadyInGroup: "Cet utilisateur est déjà dans ce groupe",
        backlog: "Arriéré",
        closeProjectPrompt: "Êtes-vous sûr de vouloir clôturer ce projet?",
        defaultError: "Une erreur s'est produite. Veuillez réessayer!",
        deleteAllGroupsWarning: "Êtes-vous sûr de vouloir supprimer tous les groupes créés?",
        deletedProject: "Le projet a été supprimé",
        deleteProjectPrompt: "Êtes-vous sûr de vouloir supprimer ce projet?",
        deletePremadeGroups: "Voulez-vous supprimer les groupes déjà créés?",
        doneTickets: "Terminé Billets",
        emptyProjectDescription: "Veuillez entrer votre description dans l'éditeur",
        groupConfigurationSuccess: "Les groupes ont été enregistrés avec succès",
        groupMembersDelete: "Ce groupe a des membres, le supprimer fera que tous les membres iront à la liste non assignée",
        groupNameAlreadyExists: "Le nom du groupe existe déjà",
        groupNameCantBeEmpty: "Le nom du groupe ne doit pas être vide",
        groupSelectionConfigurationSuccess: "La sélection de groupe a été enregistrée avec succès",
        groupSizeCantBeZero: "La taille du groupe doit être un nombre entier positif",
        issuesFound: "questions trouvé",
        members: "Membres",
        mustBeCsv: "Le format de fichier doit être csv!",
        mustBeVelocity: "Le format de fichier doit être vélocité!",
        mustImportOneFile: "Vous ne pouvez importer qu'un seul fichier!",
        na: "N / A",
        newTickets: "Nouveaux billets",
        noassignee: "Aucun cessionnaire",
        noMembers: "Aucun membre",
        noResultsFoundBasedOnSearch: "Aucun résultat trouvé en fonction de votre recherche",
        notInGroup: "Vous n'êtes actuellement pas dans un groupe",
        passwordsDontMatch: "Les mots de passe ne correspondent pas",
        points: "Points",
        progressTickets: "Dans les billets de développement",
        randomize: "Randomiser",
        randomizeRemainingWarning: "Êtes-vous sûr de vouloir randomiser tous les utilisateurs non assignés dans de nouveaux groupes?",
        selectGroup: "Sélectionner un groupe",
        size: "Taille",
        successfulFileUpload: "Fichier téléchargé avec succès",
        successfulFileDownload: "Fichier téléchargé avec succès",
        tickets: "Des billets",
        total: "total",
        uploadOnlyPicture: "Vous ne pouvez télécharger qu'une image!",
        updatedProject: "Le projet a été mis à jour",
        updateProjectPrompt: "Êtes-vous sûr de vouloir mettre à jour le projet avec cette nouvelle configuration?",
        alreadyInGroup: "Cet utilisateur est déjà dans ce groupe",
        groupNameCantBeEmpty: "Le nom du groupe ne doit pas être vide",
        groupNamealreadyExists: "Le nom du groupe existe déjà",
        groupMembersDelete: "Ce groupe a des membres, le supprimer fera que tous les membres iront à la liste non assignée",
        groupSizeCantBeZero: "La taille du groupe doit être un nombre entier positif",
        deletePremadeGroups: "Voulez-vous supprimer les groupes déjà créés?",
        randomizeRemainingWarning: "Êtes-vous sûr de vouloir randomiser tous les utilisateurs non assignés dans de nouveaux groupes?",
        randomize: "Randomiser",
        saveProjectPrompt: "Êtes-vous sûr de vouloir sauvegarder le projet avec les configurations actuelles?",
        groupSelectionConfigurationSuccess: "La sélection de groupe a été enregistrée avec succès",
        groupConfigurationSuccess: "Les groupes ont été enregistrés avec succès",
        adminConfigurationSuccess: "Les administrateurs ont été enregistrés avec succès",
        notInGroup: "Vous n'êtes actuellement pas dans un groupe",
        deleteAllGroupsWarning: "Êtes-vous sûr de vouloir supprimer tous les groupes créés?",
        closeReleaseWarning: "Êtes-vous sûr de vouloir fermer cette version?",
        deleteReleaseWarning: "Êtes-vous sûr de vouloir supprimer cette version?",
        activateSprintWarning: "Êtes-vous sûr de vouloir activer ce sprint? Il fermera tout sprint actif",
        closeSprintWarning: "Êtes-vous sûr de vouloir fermer ce sprint?",
        deleteSprintWarning: "Êtes-vous sûr de vouloir supprimer ce sprint?",
        deleteTagWarning: "Êtes-vous sûr de vouloir supprimer ce tag?",
        titleCanNotBeEmpty: "Le titre ne doit pas être vide!",
        descriptionCanNotBeEmpty: "La description ne doit pas être vide!",
        commentCanNotBeEmpty: "Le commentaire ne doit pas être vide!",
        saveBoardType: "Faites attention, cela ne doit pas être changé!",
        updatedTicket: "Le billet a été mis à jour",
        startDate: "Date de début:",
        endDate: "Date de fin:",
        emptyRelease: "Le champ de publication ne doit pas être vide",
        emptyTag: "Le champ de tag ne doit pas être vide",
        emptySprint: "Le champ Sprint ne doit pas être vide",
        emptySprintStart: "La date de début ne doit pas être vide",
        emptySprintEnd: "La date de fin ne doit pas être vide",
        emptyDeadlineDate: "La date limite ne doit pas être vide",
        emptyDeadlineTime: "L'heure limite ne doit pas être vide",
        todoTitle: "TOUT",
        inProgressTitle: "EN DÉVELOPPEMENT",
        codeReviewTitle: "CODE D'EXAMEN",
        readyForTestTitle: "PRÊT POUR TEST",
        inTestTitle: "EN TEST",
        doneTitle: "TERMINÉ",
        user0: "Sélecteur de mode",
        user1: "Collaborateur Admin",
        user2: "Collaborateur",
        user3: "Professeur",
        user4: "Assistant d'enseignement",
        user5: "Étudiant",
        state0: "Nouveau",
        state1: "En développement",
        state2: "Révision de code",
        state3: "Prêt pour Test",
        state4: "En test",
        state5: "Terminé",
        projectStatus0: "Fermé",
        projectStatus1: "Brouillon",
        projectStatus2: "actif",
        ok: "D'accord",
        close: "Fermer",
        clear: "Clair",
        cancel: "Annuler",
        activate: "Activer",
        delete: "Effacer",
        save: "sauvegarder",
        update: "Mettre à jour",
        today: "Aujourd'hui",
        now: "À présent"
    },
    es: {
        1000: "Solicitud no válida",
        1009: "Error al analizar el archivo csv",
        1010: "La configuración del sitio web no está completa",
        2000: "usuario o contraseña invalido",
        2001: "El usuario ya existe",
        2002: "usuario o contraseña invalido",
        2003: "usuario o contraseña invalido",
        2004: "usuario o contraseña invalido",
        2005: "La cuenta no está activa",
        2006: "Tiempo de espera de la sesión",
        2007: "Error al actualizar al usuario, falta información",
        2008: "Extensión de imagen de perfil inválida",
        2009: "Usuarios no válidos importan extensión de archivo",
        2010: "Permiso denegado",
        2011: "La contraseña y la contraseña no coinciden",
        2012: "El proyecto ya está activo",
        2013: "El proyecto ya está cerrado",
        2014: "El proyecto no está en borrador",
        2015: "No debe actualizar el equipo, acción no válida",
        2016: "Ya estás en un equipo, déjalo para unirte a uno nuevo",
        2017: "El usuario no está en un equipo",
        2020: "No debe exceder el tamaño del equipo",
        2021: "Nombres de equipo no coincidentes",
        2022: "Permiso denegado",
        2023: "Permiso denegado",
        2024: "Permiso denegado",
        2025: "Permiso denegado",
        2026: "Permiso denegado",
        2027: "Permiso denegado",
        2028: "Permiso denegado",
        2029: "Permiso denegado",
        2030: "Permiso denegado",
        2031: "Permiso denegado",
        2032: "Permiso denegado",
        2033: "Permiso denegado",
        2034: "Permiso denegado",
        2035: "Permiso denegado",
        2036: "Permiso denegado",
        2037: "Permiso denegado",
        2038: "Permiso denegado",
        2039: "Permiso denegado",
        2040: "Permiso denegado",
        2041: "Permiso denegado",
        2042: "no debe actualizar el proyecto, el proyecto está en estado de terminal",
        2043: "El proyecto no está activo",
        2044: "El proyecto no está activo o cerrado",
        3005: "no pudo actualizar el modo seleccionado",
        3006: "Modo inválido",
        3007: "El sitio web no está activo",
        4010: "Permiso denegado",
        5001: "Error al agregar un proyecto",
        5002: "Error al obtener la lista de proyectos",
        5003: "Error al obtener un proyecto",
        5004: "Proyecto no encontrado",
        5005: "Error al actualizar proyectos",
        5006: "Error al actualizar el proyecto",
        5007: "El proyecto ya existe",
        6001: "Error al agregar un equipo",
        6002: "Error al obtener la lista de equipos",
        6003: "No se pudo obtener un equipo",
        6004: "Equipo no encontrado",
        6005: "Error al actualizar el equipo",
        6006: "Error al crear un equipo",
        6007: "Error al actualizar un equipo",
        7001: "Error al agregar un ticket",
        7002: "Error al obtener la lista de boletos",
        7003: "Error al obtener un boleto",
        7004: "Ticket no encontrado",
        7005: "Error al actualizar el ticket",
        7006: "Error al crear un ticket",
        7007: "Error al actualizar un ticket",
        8001: "Error al agregar un comentario",
        8005: "Error al actualizar el comentario",
        8006: "Error al crear un comentario",
        8007: "Error al actualizar un comentario",
        9001: "Error al agregar una notificación",
        9002: "Error al obtener la lista de notificaciones",
        9003: "Error al obtener una notificación",
        9004: "Notificación no encontrada",
        9005: "Error al actualizar la notificación",
        9006: "Error al crear una notificación",
        9007: "Error al actualizar una notificación",
        9008: "Error al eliminar una notificación",
        9009: "Error al eliminar una notificación",
        9010: "Error al eliminar una notificación",
        10001: "Error al agregar un sprint",
        10002: "Error al obtener la lista de sprints",
        10003: "Error al obtener un sprint",
        10004: "Sprint no encontrado",
        10005: "Error al actualizar el sprint",
        10006: "Error al crear un sprint",
        10007: "Error al actualizar un sprint",
        11001: "Error al agregar un lanzamiento",
        11002: "Error al obtener la lista de lanzamientos",
        11003: "Error al obtener un lanzamiento",
        11004: "Lanzamiento no encontrado",
        11005: "Error al actualizar la versión",
        11006: "Error al crear una publicación",
        11007: "Error al actualizar un lanzamiento",
        12001: "Error al agregar una etiqueta",
        12002: "Error al obtener la lista de etiquetas",
        12003: "Error al obtener una etiqueta",
        12004: "Etiqueta no encontrada",
        12005: "Error al actualizar la etiqueta",
        12006: "Error al crear una etiqueta",
        12007: "Error al actualizar una etiqueta",
        13005: "Error al enviar comentarios",
        13006: "No debe acceder a la página de comentarios",
        activatedProject: "El proyecto ha sido activado",
        closedProject: "El proyecto ha sido cerrado",
        activateProjectPrompt: "¿Seguro que quieres activar este proyecto?",
        adminConfigurationSuccess: "Los administradores se han guardado con éxito",
        alreadyInGroup: "Este usuario ya está en este grupo",
        backlog: "Reserva",
        closeProjectPrompt: "¿Seguro que quieres cerrar este proyecto?",
        defaultError: "¡Algo salió mal. Por favor, vuelva a intentarlo!",
        deleteAllGroupsWarning: "¿Estás seguro de que deseas eliminar todos los grupos creados?",
        deletedProject: "Proyecto ha sido eliminado",
        deleteProjectPrompt: "¿Seguro que quieres eliminar este proyecto?",
        deletePremadeGroups: "¿Te gustaría eliminar los grupos que ya están hechos?",
        doneTickets: "Entradas hechas",
        emptyProjectDescription: "Por favor ingrese su descripción en el editor.",
        groupConfigurationSuccess: "Los grupos se han guardado con éxito",
        groupMembersDelete: "Este grupo tiene miembros, eliminarlo hará que todos los miembros vayan a la lista no asignada",
        groupNameAlreadyExists: "El nombre del grupo ya existe",
        groupNameCantBeEmpty: "El nombre del grupo no debe estar vacío",
        groupSelectionConfigurationSuccess: "La selección grupal se ha guardado con éxito",
        groupSizeCantBeZero: "El tamaño del grupo debe ser un entero positivo",
        issuesFound: "problemas encontrados",
        members: "Miembros",
        mustBeCsv: "El formato de archivo debe ser csv!",
        mustBeVelocity: "¡El formato del archivo debe ser la velocidad!",
        mustImportOneFile: "¡Solo puedes importar un archivo!",
        na: "N / A",
        newTickets: "Nuevos boletos",
        noassignee: "Sin asignatario",
        noMembers: "Sin miembros",
        noResultsFoundBasedOnSearch: "No se encontraron resultados basados ​​en su búsqueda",
        notInGroup: "Actualmente no estás en un grupo",
        passwordsDontMatch: "Las contraseñas no coinciden",
        points: "Puntos",
        progressTickets: "En las entradas de desarrollo",
        randomize: "Aleatorizar",
        randomizeRemainingWarning: "¿Estás seguro de que deseas aleatorizar a todos los usuarios no asignados en grupos nuevos?",
        selectGroup: "Selecciona grupo",
        size: "tamaño",
        successfulFileUpload: "El archivo ha subido correctamente",
        successfulFileDownload: "Archivo descargado con éxito",
        tickets: "Entradas",
        total: "total",
        uploadOnlyPicture: "¡Solo puedes subir una foto!",
        updatedProject: "Proyecto ha sido actualizado",
        updateProjectPrompt: "¿Seguro que quieres actualizar el proyecto con esta nueva configuración?",
        alreadyInGroup: "Este usuario ya está en este grupo",
        groupNameCantBeEmpty: "El nombre del grupo no debe estar vacío",
        groupNamealreadyExists: "El nombre del grupo ya existe",
        groupMembersDelete: "Este grupo tiene miembros, eliminarlo hará que todos los miembros vayan a la lista no asignada",
        groupSizeCantBeZero: "El tamaño del grupo debe ser un entero positivo",
        deletePremadeGroups: "¿Te gustaría eliminar los grupos que ya están hechos?",
        randomizeRemainingWarning: "¿Estás seguro de que deseas aleatorizar a todos los usuarios no asignados en grupos nuevos?",
        randomize: "Aleatorizar",
        saveProjectPrompt: "¿Seguro que quieres guardar el proyecto con las configuraciones actuales?",
        groupSelectionConfigurationSuccess: "La selección grupal se ha guardado con éxito",
        groupConfigurationSuccess: "Los grupos se han guardado con éxito",
        adminConfigurationSuccess: "Los administradores se han guardado con éxito",
        notInGroup: "Actualmente no estás en un grupo",
        deleteAllGroupsWarning: "¿Estás seguro de que deseas eliminar todos los grupos creados?",
        closeReleaseWarning: "¿Seguro que quieres cerrar esta versión?",
        deleteReleaseWarning: "¿Seguro que quieres eliminar esta versión?",
        activateSprintWarning: "¿Estás seguro de que te gustaría activar este sprint? Cerrará cualquier sprint activo actualmente",
        closeSprintWarning: "¿Estás seguro de que te gustaría cerrar este sprint?",
        deleteSprintWarning: "¿Estás seguro de que deseas eliminar este sprint?",
        deleteTagWarning: "¿Seguro que quieres eliminar esta etiqueta?",
        titleCanNotBeEmpty: "¡El título no debe estar vacío!",
        descriptionCanNotBeEmpty: "La descripción no debe estar vacía.",
        commentCanNotBeEmpty: "¡El comentario no debe estar vacío!",
        saveBoardType: "¡TEN CUIDADO, esto NO debe ser cambiado!",
        updatedTicket: "Ticket ha sido actualizado",
        startDate: "Fecha de inicio:",
        endDate: "Fecha final:",
        emptyRelease: "El campo de lanzamiento no debe estar vacío",
        emptyTag: "El campo de etiqueta no debe estar vacío",
        emptySprint: "El campo Sprint no debe estar vacío",
        emptySprintStart: "La fecha de inicio no debe estar vacía",
        emptySprintEnd: "La fecha de finalización no debe estar vacía",
        emptyDeadlineDate: "La fecha límite no debe estar vacía",
        emptyDeadlineTime: "El tiempo límite no debe estar vacío",
        todoTitle: "TODO",
        inProgressTitle: "EN DESARROLLO",
        codeReviewTitle: "REVISIÓN DE CÓDIGO",
        readyForTestTitle: "LISTO PARA LA PRUEBA",
        inTestTitle: "EN PRUEBA",
        doneTitle: "HECHO",
        user0: "Selector de modo",
        user1: "Administrador colaborador",
        user2: "Colaborador",
        user3: "Profesor",
        user4: "Asistente de enseñanza",
        user5: "Estudiante",
        state0: "Nuevo",
        state1: "En desarrollo",
        state2: "Revisión de código",
        state3: "Listo para la prueba",
        state4: "En prueba",
        state5: "Hecho",
        projectStatus0: "Cerrado",
        projectStatus1: "Borrador",
        projectStatus2: "Activo",
        ok: "De acuerdo",
        close: "Cerca",
        clear: "Claro",
        cancel: "Cancelar",
        activate: "Activar",
        delete: "Borrar",
        save: "Salvar",
        update: "Actualizar",
        today: "Hoy",
        now: "Ahora"
    },
    ru: {
        1000: "Неверный запрос",
        1009: "Не удалось проанализировать файл csv",
        1010: "Настройка сайта не завершена",
        2000: "неправильное имя пользователя или пароль",
        2001: "Пользователь уже существует",
        2002: "неправильное имя пользователя или пароль",
        2003: "неправильное имя пользователя или пароль",
        2004: "неправильное имя пользователя или пароль",
        2005: "Аккаунт не активен",
        2006: "Время ожидания сеанса",
        2007: "Не удалось обновить пользователя, отсутствует информация",
        2008: "Недопустимое расширение профиля профиля",
        2009: "Недопустимое расширение файла импорта пользователей",
        2010: "Доступ запрещен",
        2011: "Пароль и пароль подтверждения не совпадают",
        2012: "Проект уже активен",
        2013: "Проект уже закрыт",
        2014: "Проект не в проекте",
        2015: "Не нужно обновлять команду, недействительные действия",
        2016: "Вы уже в команде, оставьте его, чтобы присоединиться к новой",
        2017: "Пользователь не в команде",
        2020: "Не должно превышать размер команды",
        2021: "Несовпадение имен команд",
        2022: "Доступ запрещен",
        2023: "Доступ запрещен",
        2024: "Доступ запрещен",
        2025: "Доступ запрещен",
        2026: "Доступ запрещен",
        2027: "Доступ запрещен",
        2028: "Доступ запрещен",
        2029: "Доступ запрещен",
        2030: "Доступ запрещен",
        2031: "Доступ запрещен",
        2032: "Доступ запрещен",
        2033: "Доступ запрещен",
        2034: "Доступ запрещен",
        2035: "Доступ запрещен",
        2036: "Доступ запрещен",
        2037: "Доступ запрещен",
        2038: "Доступ запрещен",
        2039: "Доступ запрещен",
        2040: "Доступ запрещен",
        2041: "Доступ запрещен",
        2042: "не должен обновлять проект, проект находится в состоянии терминала",
        2043: "Проект неактивен",
        2044: "Проект неактивен или закрыт",
        3005: "не удалось обновить выбранный режим",
        3006: "Неверный режим",
        3007: "Веб-сайт неактивен",
        4010: "Доступ запрещен",
        5001: "Не удалось добавить проект",
        5002: "Не удалось получить список проектов",
        5003: "Не удалось получить проект",
        5004: "Проект не найден",
        5005: "Не удалось обновить проекты",
        5006: "Не удалось обновить проект",
        5007: "Проект уже существует",
        6001: "Не удалось добавить команду",
        6002: "Не удалось получить список команд",
        6003: "Не удалось получить команду",
        6004: "Команда не найдена",
        6005: "Не удалось обновить команду",
        6006: "Не удалось создать команду",
        6007: "Не удалось обновить команду",
        7001: "Не удалось добавить билет",
        7002: "Не удалось получить список билетов",
        7003: "Не удалось получить билет",
        7004: "Билет не найден",
        7005: "Не удалось обновить билет",
        7006: "Не удалось создать билет",
        7007: "Не удалось обновить билет",
        8001: "Не удалось добавить комментарий",
        8005: "Не удалось обновить комментарий.",
        8006: "Не удалось создать комментарий",
        8007: "Не удалось обновить комментарий",
        9001: "Не удалось добавить уведомление",
        9002: "Не удалось получить список уведомлений",
        9003: "Не удалось получить уведомление",
        9004: "Уведомление не найдено",
        9005: "Не удалось обновить уведомление",
        9006: "Не удалось создать уведомление",
        9007: "Не удалось обновить уведомление",
        9008: "Не удалось удалить уведомление",
        9009: "Не удалось удалить уведомление",
        9010: "Не удалось удалить уведомление",
        10001: "Не удалось добавить спринт",
        10002: "Не удалось получить список спринтов",
        10003: "Не удалось получить спринт",
        10004: "Спринт не найден",
        10005: "Не удалось обновить спринт",
        10006: "Не удалось создать спринт",
        10007: "Не удалось обновить спринт",
        11001: "Не удалось добавить выпуск",
        11002: "Не удалось получить список выпусков",
        11003: "Не удалось получить выпуск",
        11004: "Релиз не найден",
        11005: "Не удалось обновить выпуск",
        11006: "Не удалось создать выпуск",
        11007: "Не удалось обновить выпуск",
        12001: "Не удалось добавить тег",
        12002: "Не удалось получить список тегов",
        12003: "Не удалось получить тег",
        12004: "Тег не найден",
        12005: "Не удалось обновить тег",
        12006: "Не удалось создать тег",
        12007: "Не удалось обновить тег",
        13005: "Не удалось отправить отзыв",
        13006: "Нельзя получить доступ к странице отзывов",
        activatedProject: "Проект активирован",
        closedProject: "Проект закрыт",
        activateProjectPrompt: "Вы действительно хотите активировать этот проект?",
        adminConfigurationSuccess: "Админы успешно сохранены",
        alreadyInGroup: "Этот пользователь уже в этой группе",
        backlog: "отставание",
        closeProjectPrompt: "Вы действительно хотите закрыть этот проект?",
        defaultError: "Что-то пошло не так. Пожалуйста, попробуйте еще раз!",
        deleteAllGroupsWarning: "Вы уверены, что хотите удалить все созданные группы?",
        deletedProject: "Проект удален",
        deleteProjectPrompt: "Вы действительно хотите удалить этот проект?",
        deletePremadeGroups: "Вы хотите удалить группы, которые уже сделаны?",
        doneTickets: "Готовые билеты",
        emptyProjectDescription: "Введите свое описание в редакторе.",
        groupConfigurationSuccess: "Группы успешно сохранены",
        groupMembersDelete: "В этой группе есть члены, удаляющие ее, чтобы все участники перешли в неназначенный список",
        groupNameAlreadyExists: "Название группы уже существует",
        groupNameCantBeEmpty: "Имя группы не должно быть пустым.",
        groupSelectionConfigurationSuccess: "Групповой выбор сохранен успешно",
        groupSizeCantBeZero: "Размер группы должен быть положительным целым числом",
        issuesFound: "обнаружены проблемы",
        members: "члены",
        mustBeCsv: "Формат файла должен быть csv!",
        mustBeVelocity: "Формат файла должен быть скоростью!",
        mustImportOneFile: "Вы можете импортировать только один файл!",
        na: "N / A",
        newTickets: "Новые билеты",
        noassignee: "Нет назначенного лица",
        noMembers: "Нет участников",
        noResultsFoundBasedOnSearch: "По вашему запросу ничего не найдено",
        notInGroup: "Вы сейчас не в группе",
        passwordsDontMatch: "Пароли не совпадают",
        points: "Точки",
        progressTickets: "В разработке Билеты",
        randomize: "Перемешайте",
        randomizeRemainingWarning: "Вы уверены, что хотите рандомизировать всех неназначенных пользователей в новых группах?",
        selectGroup: "Выбрать группу",
        size: "Размер",
        successfulFileUpload: "Файл успешно загружен",
        successfulFileDownload: "Файл успешно загружен",
        tickets: "Билеты",
        total: "Всего",
        uploadOnlyPicture: "Вы можете загружать только одно изображение!",
        updatedProject: "Проект обновлен",
        updateProjectPrompt: "Вы уверены, что хотите обновить проект с помощью этой новой конфигурации?",
        alreadyInGroup: "Этот пользователь уже в этой группе",
        groupNameCantBeEmpty: "Имя группы не должно быть пустым.",
        groupNamealreadyExists: "Название группы уже существует",
        groupMembersDelete: "В этой группе есть члены, удаляющие ее, чтобы все участники перешли в неназначенный список",
        groupSizeCantBeZero: "Размер группы должен быть положительным целым числом",
        deletePremadeGroups: "Вы хотите удалить группы, которые уже сделаны?",
        randomizeRemainingWarning: "Вы уверены, что хотите рандомизировать всех неназначенных пользователей в новых группах?",
        randomize: "Перемешайте",
        saveProjectPrompt: "Вы действительно хотите сохранить проект с текущими конфигурациями?",
        groupSelectionConfigurationSuccess: "Групповой выбор сохранен успешно",
        groupConfigurationSuccess: "Группы успешно сохранены",
        adminConfigurationSuccess: "Админы успешно сохранены",
        notInGroup: "Вы сейчас не в группе",
        deleteAllGroupsWarning: "Вы уверены, что хотите удалить все созданные группы?",
        closeReleaseWarning: "Вы действительно хотите закрыть этот выпуск?",
        deleteReleaseWarning: "Вы действительно хотите удалить этот выпуск?",
        activateSprintWarning: "Вы уверены, что хотите активировать этот спринт? Он закроет любой активный активный спринт",
        closeSprintWarning: "Вы уверены, что хотите закрыть этот спринт?",
        deleteSprintWarning: "Вы уверены, что хотите удалить этот спринт?",
        deleteTagWarning: "Вы уверены, что хотите удалить этот тег?",
        titleCanNotBeEmpty: "Название не должно быть пустым!",
        descriptionCanNotBeEmpty: "Описание не должно быть пустым!",
        commentCanNotBeEmpty: "Комментарий не должен быть пустым!",
        saveBoardType: "БУДЬТЕ ОСТОРОЖНЫ, это НЕ МОЖЕТ быть изменено!",
        updatedTicket: "Билет обновлен",
        startDate: "Дата начала:",
        endDate: "Дата окончания:",
        emptyRelease: "Поле освобождения не должно быть пустым",
        emptyTag: "Поле тега не должно быть пустым.",
        emptySprint: "Поле Sprint не должно быть пустым",
        emptySprintStart: "Дата начала не должна быть пустой",
        emptySprintEnd: "Дата окончания не должна быть пустой",
        emptyDeadlineDate: "Крайний срок не должен быть пустым",
        emptyDeadlineTime: "Крайний срок не должен быть пустым",
        todoTitle: "ВСЕ",
        inProgressTitle: "В РАЗВИТИЕ",
        codeReviewTitle: "ОБЗОР КОДА",
        readyForTestTitle: "ГОТОВНОСТЬ К ТЕСТУ",
        inTestTitle: "IN TEST",
        doneTitle: "СДЕЛАННЫЙ",
        user0: "Выбор режима",
        user1: "Администратор соавторов",
        user2: "коллаборационист",
        user3: "Профессор",
        user4: "Помощник по обучению",
        user5: "Студент",
        state0: "новый",
        state1: "В развитие",
        state2: "Обзор кода",
        state3: "Готовы к тестированию",
        state4: "В тесте",
        state5: "Готово",
        projectStatus0: "Закрыто",
        projectStatus1: "Проект",
        projectStatus2: "активный",
        ok: "ОК",
        close: "Закрыть",
        clear: "Очистить",
        cancel: "Отмена",
        activate: "активировать",
        delete: "Удалить",
        save: "Сохранить",
        update: "Обновить",
        today: "Cегодня",
        now: "Теперь"
    }
});

const userIcons = Object.freeze({
    0: 'security',
    1: 'security',
    2: 'people',
    3: 'security',
    4: 'people',
    5: 'person'
});

var meObject;

$(function () {
    getMeObject();
});

/**
 * get the me object
 */
function getMeObject() {
    $.ajax({
        type: 'GET',
        url: '/me',
        async: false,
        success: function (data) {
            meObject = data;
        },
        error: function (data) {
        }
    });
}

/**
 * Returns the correct error message to use, if no errors match returns
 * the default error message
 *
 * @param {Object} data
 * @returns {String} Error message
 */
function getErrorMessageFromResponse(data) {
    return data ? translations[meObject && meObject.language ? meObject.language : 'en'][data['code']] || translations[meObject && meObject.language ? meObject.language : 'en']['defaultError'] : translations[meObject && meObject.language ? meObject.language : 'en']['defaultError'];
}

/**
 * Returns the correct translation based on the passed parameter
 *
 * @param {String} data
 * @returns {String} translated text
 */
function translate(data) {
    return translations[meObject && meObject.language ? meObject.language : 'en'][data];
}

/**
 * Returns the HTML for a new notification
 *
 * @param {Object} notification
 * @returns {String} HTML of notification
 */
function getNotification(notification) {
    return `<span>
                <li>
                    <a class="navbarLinkHidden waves-effect padding-right-0 truncate" href="${notification.link}">
                        <i class="material-icons margin-right-10">${notification.type}</i>
                        ${notification.name}
                    </a>
                    <span class="right right-icons">
                        <i class="pointer padding-right-5 material-icons md-22 visibility-icon" onclick="viewFullNotificationToggle($(this), '${notification._id}')">keyboard_arrow_down</i>
                        <span class="pointer clear-notification padding-right-10" id="${notification._id}-clear" onclick="clearNotification($(this), '${notification._id}')">X</span>
                    </span>
                </li>
                <li class="full-description hidden" id="${notification._id}-desc">
                    ${notification.name}
                </li>
            </span>`;
}

/**
 * Returns the HTML for an error pill
 *
 * @param {String} text
 * @returns {String} HTML of error pill
 */
function getErrorPill(text) {
    return `<div class="chip white-text red darken-4">${text}<i class="close material-icons">close</i></div>`
}

/**
 * Returns the HTML for the loading animation
 *
 * @returns {String} HTML of loading animation
 */
function getLoading() {
    return '<div class="progress loaderBackgroundColour-background-colour"><div class="indeterminate primaryColour-background-colour"></div></div>';
}

/**
 * starts the loader
 *
 * @param {String} loading id of loader
 * @param {String} hiding section to be loaded
 */
function startLoad(loading, hiding) {
    $(loading).html(getLoading());
    $(hiding).addClass('hidden');
}

/**
 * ends the loader
 *
 * @param {String} loading id of loader
 * @param {String} showing section to be loaded
 */
function endLoad(loading, showing) {
    $(loading).html('');
    $(showing).removeClass('hidden');
}

/**
 * Allows us to call an animate function with a callback
 */
$.fn.extend({
    animateCss: function (animationName, callback) {
        var animationEnd = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';
        this.addClass('animated ' + animationName).one(animationEnd, function () {
            $(this).removeClass('animated ' + animationName);
            if (callback) {
                callback();
            }
        });
        return this;
    }
});

/**
 * handle 401 and 404 erros
 *
 * @param {String} data response data
 */
function handle401And404(data) {
    if (data['status'] === 401) {
        window.location.href = '/';
    } else if (data['status'] === 404) {
        window.location.href = '/pageNotFound';
    }
}


/**
 * toggle visibility
 *
 * @param {Object} element element
 */
function toggleVisibility(element) {
    if (element.hasClass('hidden')) {
        element.removeClass('hidden');
        element.animateCss('fadeIn');
    } else {
        element.addClass('hidden');
    }
}

/**
 * Initialize the summernote and all its sub modal
 *
 * @param {Object} element element
 */
const initSummernote = function (descriptionId) {
    if ($(descriptionId) && $(descriptionId)[0]) {
        $(descriptionId).summernote({ height: 200 });
        $('div.note-btn-group.btn-group button').unbind('mouseenter mouseleave').addClass('customSummernoteButton');
        $('div.note-btn-group.btn-group.note-insert button').unbind();
        $('div.note-btn-group.btn-group.note-view button:nth-child(3)').unbind();
        $('div.note-btn-group.btn-group.note-insert button:nth-child(1) i').removeClass('note-icon-link');
        $('div.note-btn-group.btn-group.note-insert button:nth-child(1) i').addClass('material-icons');
        $('div.note-btn-group.btn-group.note-insert button:nth-child(1) i').html('cloud_upload');
        $('div.note-btn-group.btn-group.note-insert button:nth-child(1)').click(function () {
            $('#uploadModal').modal('open');
        });
        $('div.note-btn-group.btn-group.note-insert button:nth-child(3)').remove();
        $('div.note-btn-group.btn-group.note-insert button:nth-child(2)').remove();
        $('div.note-btn-group.btn-group.note-view button:nth-child(3)').remove();
        $('.modal').modal({
            dismissible: false
        });
        $(descriptionId).summernote('code', $(descriptionId)[0].textContent);
    }
}
