# Nimble Gravity Challenge

Mini aplicación en React que consume la API del challenge para:

- Obtener candidato por email
- Obtener lista de posiciones abiertas
- Enviar postulación a una posición con URL del repo de GitHub

## Requisitos

- Node.js 18+
- npm 9+

## Scripts

- `npm run dev`: entorno local
- `npm run build`: build de producción
- `npm run preview`: previsualizar build

## Cómo usar la app

1. Ingresar el email del candidato.
2. Click en **Load data** para traer candidato + posiciones.
3. En cada posición, ingresar `repoUrl` de GitHub.
4. Click en **Submit** para enviar la postulación de esa posición.

La app maneja estados de carga, errores de red/API y éxito por postulación.
