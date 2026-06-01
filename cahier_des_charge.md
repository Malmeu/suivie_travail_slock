Oui — voici un cahier des charges complet sous forme de prompt prêt à coller dans Antigravity pour générer ta web app hospitalière, en tenant compte de ton besoin de messagerie type Slack, de groupes de travail, de suivi de projet, de PV de réunion, et de Supabase comme backend. Pour une app hospitalière, il faut aussi prévoir sécurité, rôles, traçabilité, et cloisonnement des données dès la conception.

Prompt Antigravity
**Agis comme un architecte logiciel senior, product designer senior, expert SaaS B2B, expert Supabase/PostgreSQL, et développeur full-stack senior.
Ta mission est de concevoir puis générer une web app professionnelle d’organisation interne pour un hôpital.
L’application doit centraliser la communication interne, la gestion des groupes de travail, le suivi des projets, et les procès-verbaux de réunion.
Le résultat attendu est un produit moderne, propre, sécurisé, extensible, orienté usage terrain hospitalier.**

1. Contexte métier
Cette application est destinée à un usage interne hospitalier pour améliorer l’organisation entre les équipes administratives, techniques, médicales et de coordination projet. Elle ne doit pas être pensée comme un simple chat, mais comme une plateforme de coordination opérationnelle combinant communication, suivi d’avancement, comptes-rendus de réunion et gestion d’actions.

Le contexte hospitalier impose des besoins spécifiques : communication rapide, hiérarchisation de l’urgence, circulation d’information fiable, historisation, attribution claire des responsabilités, et contrôle strict des accès selon le rôle et le service. Les bonnes pratiques de communication en santé recommandent des règles de canalisation des messages, une séparation des usages urgents et non urgents, ainsi qu’un cadre sécurisé et structuré.

2. Objectif produit
Créer une web app responsive permettant :

d’échanger via une messagerie interne type Slack,

de créer des groupes/canaux de travail par service, projet ou thème,

de piloter des projets avec statut, tâches, responsables et échéances,

de rédiger, stocker et suivre les PV de réunion,

de transformer les décisions de réunion en actions assignées,

d’avoir une traçabilité claire de qui a dit quoi, décidé quoi, et fait quoi.

L’application doit être pensée pour réduire les pertes d’information, éviter les échanges dispersés sur WhatsApp ou verbalement, et fournir un cadre unique pour les échanges internes et le pilotage organisationnel.

3. Stack technique imposée
Utiliser impérativement :

Frontend : React ou Next.js App Router.

UI : design moderne type SaaS pro, sobre, rapide, lisible.

Backend : Supabase.

Base de données : PostgreSQL via Supabase.

Authentification : Supabase Auth.

Temps réel : Supabase Realtime pour messagerie, notifications et mises à jour live.

Stockage fichiers : Supabase Storage pour pièces jointes, documents et PV exportés.

Sécurité : Row Level Security activé sur toutes les tables.

Journalisation : audit logs métier applicatifs.

4. Utilisateurs cibles
Prévoir les profils suivants :

Administrateur global.

Direction / management.

Chef de projet.

Responsable de service.

Agent / collaborateur.

Lecteur / observateur si nécessaire.

Chaque utilisateur peut appartenir à un ou plusieurs services, à plusieurs projets, et à plusieurs groupes de discussion. Les droits doivent dépendre du rôle global et du contexte local, par exemple un utilisateur peut être simple membre dans un projet et chef dans un autre.

5. Modules fonctionnels
A. Authentification et gestion des accès
Fonctionnalités attendues :

Connexion sécurisée.

Réinitialisation de mot de passe.

Gestion de session.

Profil utilisateur.

Rôles globaux et permissions fines.

Appartenance à services, équipes, groupes et projets.

Gestion des accès par canal, par projet et par document.

Contraintes :

Toute donnée doit être protégée par RLS.

Aucun accès ne doit être fondé uniquement sur la logique frontend.

Les clés sensibles ne doivent jamais être exposées côté client.

B. Annuaire interne
Créer un annuaire interne avec :

nom, prénom,

fonction,

service,

rôle,

photo/avatar,

coordonnées internes,

disponibilité/statut,

rattachement aux groupes et projets.

L’annuaire doit servir de base pour mentionner des collègues, les ajouter à des groupes, les assigner à des tâches et les inviter à des réunions.

C. Messagerie interne type Slack
Créer un module de messagerie temps réel avec :

messages directs entre deux utilisateurs,

canaux publics,

canaux privés,

groupes de travail,

fils de discussion/réponses,

pièces jointes,

accusé visuel de lecture si souhaité,

recherche dans les messages,

messages épinglés,

mentions @utilisateur,

notifications in-app,

possibilité de marquer un message comme important,

différenciation entre message d’information, action, alerte, rappel.

Prévoir une structure proche de Slack mais adaptée à l’hôpital :

canaux par service,

canaux par projet,

canaux transverses,

canal annonces officielles,

canal urgence opérationnelle si retenu.

Inclure des règles métier :

les messages urgents doivent être visuellement distincts,

les messages normaux ne doivent pas être confondus avec les alertes,

les canaux doivent avoir un propriétaire ou modérateur,

les historiques doivent être consultables selon autorisation.

D. Gestion des groupes de travail
Permettre de créer des groupes de travail avec :

nom,

description,

type de groupe (service, projet, comité, temporaire),

membres,

propriétaire,

règles d’accès,

canaux associés,

documents associés,

projets associés.

Chaque groupe doit avoir :

un espace de discussion,

une liste de membres,

une liste d’actions en cours,

un espace documents,

un calendrier ou au moins la liste des réunions passées et futures.

E. Suivi de projet
Créer un module projet complet comprenant :

création de projet,

description,

service porteur,

sponsor,

chef de projet,

membres,

objectifs,

périmètre,

date de début,

date de fin prévisionnelle,

statut,

priorité,

avancement global,

indicateurs clés.

Pour chaque projet, prévoir :

tableau de bord,

liste des tâches,

jalons,

risques,

blocages,

décisions,

documents,

fil d’activité,

réunions liées,

actions ouvertes issues des réunions.

Statuts de projet recommandés :

brouillon,

en préparation,

en cours,

en attente,

bloqué,

terminé,

archivé.

F. Gestion des tâches et actions
Chaque projet ou réunion doit pouvoir générer des actions/tâches avec :

titre,

description,

projet lié,

réunion source éventuelle,

assigné à,

créé par,

date d’échéance,

priorité,

statut,

commentaires,

historique de modification.

Statuts de tâche :

à faire,

en cours,

en attente,

terminé,

annulé.

Règles importantes :

une action doit toujours avoir un responsable nominatif,

une action doit idéalement avoir une échéance,

le suivi doit afficher retard, imminent, terminé, bloqué.

G. PV de réunion
Créer un module de gestion des réunions et procès-verbaux avec :

création d’une réunion,

date, heure, lieu ou mode visio,

organisateur,

participants,

ordre du jour,

notes,

décisions,

actions,

risques ou points bloquants,

prochaine réunion,

validation du PV,

export PDF ou impression.

Le format de PV doit inclure au minimum :

informations de réunion,

participants,

points abordés,

décisions prises,

actions attribuées avec responsables et dates,

risques / problèmes,

prochaines étapes. Cela correspond aux composantes essentielles d’un PV exploitable et orienté action.

Prévoir aussi :

brouillon de PV,

validation par responsable,

versionnage,

historique des modifications,

lien direct entre décisions et tâches générées.

H. Notifications
Créer un centre de notifications avec :

nouvelle mention,

nouveau message,

ajout à un groupe,

assignation de tâche,

tâche proche de l’échéance,

retard,

nouvelle réunion,

PV validé,

changement de statut d’un projet.

Prévoir :

notifications en temps réel,

filtres par type,

lu / non lu,

redirection vers l’élément concerné.

I. Recherche globale
Créer une recherche transversale permettant de retrouver :

utilisateurs,

messages,

groupes,

projets,

tâches,

réunions,

PV,

documents.

J. Documents et pièces jointes
Prévoir :

dépôt de fichiers,

classement par projet, réunion ou groupe,

aperçu si possible,

téléchargement,

droits d’accès,

métadonnées,

historique minimum.

6. Exigences UX/UI
L’interface doit être :

moderne,

sobre,

professionnelle,

rapide à comprendre,

adaptée aux utilisateurs non techniques,

responsive desktop/tablette/mobile.

Inspirations fonctionnelles :

Slack pour la messagerie,

Notion/ClickUp/Linear pour la clarté,

Trello/Asana/Jira simplifiés pour le projet,

interface hospitalière sobre, non gadget.

Principes UX :

navigation latérale claire,

accès rapide à “Messages”, “Groupes”, “Projets”, “Réunions”, “Actions”, “Documents”,

dashboard d’accueil personnalisé,

peu de friction,

formulaires courts,

code couleur discret pour urgences, retards et statuts,

historique visible,

excellent moteur de filtre.

7. Écrans à produire
Demander à l’IA de générer au minimum les écrans suivants :

login,

dashboard,

annuaire,

liste des conversations,

vue conversation/canal,

création de groupe,

liste des groupes,

liste des projets,

fiche projet,

tableau des tâches,

vue calendrier ou échéances,

liste des réunions,

fiche réunion,

éditeur de PV,

centre de notifications,

recherche globale,

paramètres,

administration utilisateurs et rôles.

8. Dashboard principal
Le tableau de bord d’accueil doit afficher :

messages non lus,

tâches en retard,

tâches à échéance proche,

projets en cours,

prochaines réunions,

dernières décisions importantes,

activité récente.

Le dashboard doit être contextualisé selon le rôle de l’utilisateur. Un chef de projet voit surtout ses projets et actions, alors qu’un agent voit plutôt ses messages, groupes et tâches.

9. Modèle de données Supabase
Conçois un schéma Supabase propre, normalisé et évolutif avec tables suggérées :

profiles

roles

departments

user_departments

groups

group_members

channels

channel_members

direct_conversations

direct_conversation_members

messages

message_reads

message_attachments

projects

project_members

project_status_history

tasks

task_comments

task_history

meetings

meeting_participants

meeting_minutes

meeting_decisions

meeting_actions

documents

notifications

audit_logs

Pour chaque table, générer :

colonnes,

types,

clés primaires,

clés étrangères,

contraintes,

timestamps,

soft delete si pertinent,

index.

Exiger aussi :

conventions de nommage cohérentes,

colonnes created_at, updated_at,

relation claire entre réunions, décisions, actions et projets,

relation claire entre groupes, canaux et membres.

10. Règles de sécurité Supabase
Implémente une sécurité sérieuse :

RLS activé sur chaque table,

politiques par rôle et par appartenance,

accès limité aux membres concernés,

séparation stricte entre données privées et publiques internes,

stockage sécurisé des fichiers,

audit minimal des actions critiques.

Exemples de règles attendues :

un utilisateur ne voit que les canaux dont il est membre,

un message direct n’est visible que par ses participants,

un projet est visible uniquement par ses membres ou rôles autorisés,

un PV de réunion est visible uniquement par les participants autorisés,

seuls certains rôles peuvent archiver, supprimer ou valider.

11. Règles métier importantes
Prendre en compte les règles suivantes :

un utilisateur peut appartenir à plusieurs groupes et projets,

un message peut contenir une pièce jointe,

une réunion peut générer plusieurs décisions,

une décision peut générer plusieurs actions,

une action a toujours un propriétaire,

un projet a un statut et un historique,

les documents doivent être liés à un contexte métier,

toute modification importante doit être historisée.

Ajouter un système de priorité :

basse,

normale,

haute,

critique.

Ajouter un système de statut pour messages/alertes si nécessaire :

normal,

important,

urgent.

12. Fonctionnalités avancées souhaitables
Si possible, ajouter :

épinglage de messages,

réactions emoji simples,

templates de PV,

duplication de projet,

tableau Kanban pour les tâches,

vue liste et vue calendrier,

export PDF des PV,

export Excel/CSV des actions,

fil d’activité par projet,

tableau des décisions ouvertes,

rappels automatiques d’échéance.

13. Hors périmètre initial
Ne pas développer dans la V1 sauf structure prévue pour évolution :

dossier patient,

données médicales sensibles,

prescription,

imagerie,

connexion EHR complexe,

téléconsultation,

biométrie,

signature électronique avancée. La messagerie hospitalière doit rester orientée coordination interne, avec forte sécurité, mais sans basculer d’emblée dans un SI clinique complet.

14. Non-fonctionnel
Exiger :

application rapide,

architecture modulaire,

code propre,

composants réutilisables,

types forts si TypeScript,

bonne gestion d’erreurs,

accessibilité correcte,

logs,

pagination sur listes lourdes,

recherche optimisée,

design system cohérent.

15. Livrables demandés à Antigravity
Je veux que tu me génères :

une vision produit structurée,

l’architecture fonctionnelle complète,

les user stories par module,

le schéma de base de données Supabase,

les scripts SQL de création des tables,

les politiques RLS,

l’architecture frontend,

l’arborescence du projet,

les pages et composants à développer,

un MVP clair puis une roadmap V2/V3,

des données de démonstration seed,

le design UX/UI de l’app,

un plan d’implémentation étape par étape,

les conventions de code,

les flux utilisateur principaux.

16. Format de réponse attendu
Structure ta réponse en sections claires :

Vision produit

Personas et rôles

Modules fonctionnels

User stories

Schéma de données

Sécurité et RLS

Parcours utilisateurs

UX/UI

Architecture technique

Roadmap MVP

SQL Supabase

Recommandations de mise en production

17. Niveau de qualité attendu
Je veux une réponse exploitable comme un vrai cahier des charges de production, pas une simple idée générale. Chaque module doit être assez détaillé pour qu’un développeur puisse coder l’application sans ambiguïté. Je veux une logique métier réaliste, cohérente avec un environnement hospitalier, avec forte emphase sur sécurité, rôles, traçabilité, messagerie structurée, réunions, décisions et suivi d’actions.