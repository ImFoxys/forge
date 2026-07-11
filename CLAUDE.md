# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projet

Forge est un programme de musculation sur-mesure : il doit permettre de suivre ses séances d'entraînement et l'évolution de ses performances dans le temps (charges, séries, répétitions, progression).

Le projet est au stade initial : c'est actuellement le scaffold par défaut de Vite (React + TypeScript), aucune logique métier (séances, exercices, progression) n'a encore été implémentée. `src/App.tsx` contient encore la démo par défaut de Vite/React.

## Commandes

- `npm run dev` — serveur de développement Vite avec HMR
- `npm run build` — vérifie les types (`tsc -b`) puis build de production (`vite build`)
- `npm run lint` — ESLint sur tout le repo
- `npm run preview` — sert le build de production en local
- `npm run deploy` — build (`tsc && vite build`) puis publie `dist/` sur GitHub Pages via `gh-pages`

Il n'y a pas encore de framework de tests configuré.

## Stack et points d'attention

- React 19 + TypeScript + Vite, config ESLint flat (`eslint.config.js`) avec `typescript-eslint`, `eslint-plugin-react-hooks` et `eslint-plugin-react-refresh`.
- `tsconfig.json` référence deux projets séparés : `tsconfig.app.json` (code applicatif dans `src/`) et `tsconfig.node.json` (config Node, ex. `vite.config.ts`).
- Déploiement sur GitHub Pages : `vite.config.ts` fixe `base: '/forge/'`. Toute référence à un asset ou route absolue doit rester cohérente avec ce base path.
