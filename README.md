# Torneatron 2000 🏆♟️

> **Gestor de Torneos Profesional Mobile-First con Motor Especializado de Ajedrez FIDE**  
> Diseñado para directores de torneos, árbitros, clubes y organizadores deportivos. Funciona 100% en el navegador de tu celular y sin necesidad de conexión a internet.

---

## 📱 Demostración y Despliegue en GitHub Pages

Para ver la aplicación en vivo desde tu propio repositorio de GitHub:

1. Ve a los **Settings** de tu repositorio en GitHub (`https://github.com/maximoGs/Torneatron2000/settings/pages`).
2. En la sección **Pages**, selecciona:
   - **Source**: `GitHub Actions` (o rama `main` / `root`).
3. ¡Tu app estará disponible públicamente en `https://maximogs.github.io/Torneatron2000/`!

---

## ♟️ Características Especiales de Ajedrez

- **Sistema Suizo Oficial (FIDE)**:
  - Emparejamiento por grupos de puntuación.
  - Prevención estricta de repetición de enfrentamientos.
  - Alternancia y balance de colores Blancas / Negras (evita 3 colores iguales consecutivos).
  - Gestión automática de Byes (1.0 pt) para torneos con número impar de participantes.
- **Cálculo Automático de Desempates FIDE**:
  - **Buchholz Cut-1** (Media Buchholz)
  - **Buchholz Total**
  - **Sonneborn-Berger (SB)**
  - **Puntaje Progresivo**
  - **Cantidad de Victorias**
  - **ARO** (Average Rating of Opponents / Rating Promedio de Rivales)
- **Round Robin (Liga)**: Cuadrantes y tablas de Berger balanceadas.
- **Eliminación Directa (Playoffs / Brackets)**: Cuadro de llaves interactivo con avance automático de ganadores.
- **Reloj de Ronda Integrado**: Temporizador con campanilla acústica (Web Audio API) y avisos para control de tiempos de ronda.

---

## 📲 Optimizado para Celulares (Mobile-First)

- **Botones de puntuación rápida**: Asigna `1-0`, `½-½`, `0-1` con un solo toque desde tu mano.
- **Compartir por WhatsApp**: Envía con 1 toque la tabla de posiciones y las mesas de juego con formato elegante y emojis a tus grupos de chat.
- **Modo Offline & PWA**: Guarda automáticamente el progreso en `LocalStorage` y permite exportar/importar copias de seguridad en archivos `.json`.
- **Vista de Impresión / PDF**: Listo para imprimir las planillas de mesas en hoja A4/Carta.

---

## 🚀 Tecnologías

- **HTML5 Semántico** & **CSS3 Moderno** (Glassmorphism, Dark/Light Mode, CSS Custom Properties).
- **Vanilla JavaScript (ES6 Modules)**: Cero dependencias externas pesadas, carga instantánea.
- **GitHub Actions**: Despliegue continuo automatizado.

---

Hecho con ⚡ para la comunidad de ajedrez y deportes.
