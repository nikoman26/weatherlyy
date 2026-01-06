# AI Rules for Weatherly Aviation Weather Application

This document outlines the core technologies and specific library usage guidelines for the Weatherly application. Adhering to these rules ensures consistency, maintainability, and leverages the strengths of our chosen tech stack.

## 🚀 Tech Stack Overview

*   **Frontend Framework:** React 18 with TypeScript for building robust and type-safe user interfaces.
*   **Build Tooling:** Vite for a fast development experience and optimized production builds.
*   **State Management:** Zustand for simple, scalable, and performant global state management.
*   **Routing:** React Router for declarative client-side navigation.
*   **Styling:** Tailwind CSS for utility-first, highly customizable, and responsive styling.
*   **Icons:** Lucide React for a consistent and lightweight icon set.
*   **Charting:** Recharts for interactive and customizable data visualizations.
*   **Mapping:** Leaflet.js for interactive and customizable maps.
*   **Backend:** Node.js with Express.js for building the RESTful API.
*   **Database & Auth:** Supabase (PostgreSQL) for database services and user authentication.

## 📚 Library Usage Guidelines

To maintain a consistent and efficient codebase, please follow these guidelines for library usage:

*   **UI Components:** All new UI components should be built using **React** and **TypeScript**.
*   **Styling:** Use **Tailwind CSS** exclusively for all styling. Avoid inline styles or custom CSS files unless absolutely necessary for third-party library overrides.
*   **Icons:** Integrate icons using **Lucide React**. Do not introduce other icon libraries.
*   **State Management:** For any application-wide or complex local state, use **Zustand**. Keep component-local state managed with React's `useState`.
*   **Routing:** All client-side navigation must be handled by **React Router**. Keep route definitions centralized in `src/App.tsx`.
*   **Charts & Graphs:** For any data visualization requirements, use **Recharts**.
*   **Interactive Maps:** For displaying maps and geographical data, use **Leaflet.js**.
*   **Backend API:** Develop server-side logic and API endpoints using **Node.js** and **Express.js**.
*   **Database & Authentication:** Interact with the database and manage user authentication through **Supabase**. Use the provided `supabase` client in `src/lib/supabase.ts`.
*   **HTTP Requests (Backend):** Use **Axios** for making external HTTP requests from the Node.js backend.
*   **Environment Variables:** Manage environment variables using `dotenv` in the backend and `VITE_` prefixed variables in the frontend via Vite's `import.meta.env`.