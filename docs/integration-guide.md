# Backend & Frontend Integration Guide

This document provides a practical, step-by-step guide for the backend and frontend teams to integrate their work, based on the project's architecture and best practices.

---

## 1. Readiness Checks

Before integration begins, each team should ensure they meet the following readiness criteria.

### **Backend Checklist:**
- [ ] **API Endpoints:** All MVP endpoints (auth, tasks, categories, calendar) are implemented and documented with OpenAPI/Swagger.
- [ ] **Database:** Migrations are applied, and the database is seeded with test data.
- [ ] **Authentication:** JWT-based authentication is working (register, login, protected routes).
- [ ] **CORS:** Cross-Origin Resource Sharing (CORS) is enabled for the frontend origin (`http://localhost:5173` or as configured).
- [ ] **Error Handling:** API returns errors in the consistent format specified in `ARCHITECTURE.md`.
- [ ] **Local Testing:** All endpoints have been verified with tools like Postman or `curl`.

### **Frontend Checklist:**
- [ ] **API Client:** An API service/client (e.g., using Axios, Fetch) is set up to make HTTP requests.
- [ ] **Auth Flow:** UI for login/registration is implemented, and JWTs can be stored securely (e.g., in `localStorage` or an `httpOnly` cookie).
- [ ] **State Management:** Basic state structure for auth, tasks, calendar, etc., is in place.
- [ ] **Error Handling:** The UI can gracefully display errors returned from the backend (e.g., using toast notifications or inline messages).
- [ ] **Component Rendering:** UI components can render correctly using mock data or initial API responses.

---

## 2. How to Verify the Other Party is Ready

-   **Backend → Frontend:**
    -   Share the live OpenAPI/Swagger documentation URL.
    -   Provide a Postman collection for all MVP endpoints.
    -   Confirm the dev server is running and accessible to the frontend team.
    -   Provide a default test user account (`username`/`password`).

-   **Frontend → Backend:**
    -   Demonstrate that the UI can call a public backend endpoint (e.g., `/health`) and display the response.
    -   Show the login form UI and confirm it's ready to be wired up.
    -   Share a link to the frontend's Git repository or a running dev instance.

---

## 3. Step-by-Step Integration Plan

### **Step 1: API Contract Alignment & Initial Connection**
1.  **Backend:** Provides the frontend team with the API base URL and the OpenAPI/Swagger documentation.
2.  **Frontend:** Configures its API client with the correct base URL (ideally from an environment variable).
3.  **Verification:** Frontend makes a request to a public endpoint (like `/health`) to confirm connectivity and CORS configuration.

### **Step 2: Authentication Integration**
1.  **Frontend:** Implements the user registration and login forms to call the backend's `/api/v1/auth/register` and `/api/v1/auth/login` endpoints.
2.  **Frontend:** Upon successful login, stores the received JWT securely and includes it as a Bearer token in the `Authorization` header for all subsequent protected requests.
3.  **Backend:** Ensures protected routes return a `401 Unauthorized` error if the JWT is missing or invalid.
4.  **Verification:** User can register, log in, and the frontend successfully makes an authenticated request to a protected endpoint like `/api/v1/users/me`.

### **Step 3: Core Data Fetching & Display**
1.  **Frontend:** Implements the logic to fetch and display core data models:
    -   Tasks (from `/api/v1/tasks`)
    -   Categories (from `/api/v1/categories`)
    -   Calendar Days (from `/api/v1/calendar/days`)
2.  **Backend:** Ensures endpoints return the correct data structures and handle filtering/pagination parameters as specified.
3.  **Verification:** The frontend UI populates with real data from the backend, replacing any mock data.

### **Step 4: CRUD Operations**
1.  **Frontend:** Implements the UI and logic for Create, Read, Update, and Delete operations for tasks and categories.
2.  **Backend:** Ensures all `POST`, `PUT`, and `DELETE` endpoints function correctly, perform validation, and persist data.
3.  **Verification:** Creating a new task in the UI results in a new record in the database, and the change is reflected back in the UI. The same is verified for updates and deletes.

### **Step 5: Error Handling & UX**
1.  **Frontend:** Implements a global error handler that catches API errors and displays user-friendly notifications based on the standardized error format from the backend.
2.  **Backend:** Ensures that validation errors (e.g., a username that is too short) and server errors return the documented JSON error structure.
3.  **Verification:** Intentionally trigger an API error (e.g., by submitting an invalid form) and confirm the frontend displays a clear and helpful error message.

---

## 4. Troubleshooting Common Issues

| Issue                        | Likely Cause                                                                     | Solution                                                                                                   |
| ---------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **CORS Error**               | Backend has not configured the frontend's origin (`http://localhost:5173`)       | **Backend:** Add the frontend's URL to the `allow_origins` list in the CORS middleware configuration.      |
| **401 Unauthorized**         | Frontend is not sending the JWT, the token is expired, or it's formatted incorrectly. | **Frontend:** Verify the `Authorization: Bearer <token>` header is sent with every authenticated request.  |
| **422 Unprocessable Entity** | Frontend is sending a JSON payload with missing or invalid fields.               | **Frontend:** Check that the request payload matches the Pydantic schema defined in the backend.           |
| **Data Shape Mismatch**      | Frontend's expected data structure doesn't match the backend's actual response.  | **Both:** Compare the API response in the browser's Network tab with the frontend's type definitions. Align with the OpenAPI spec. |
| **Network Error**            | Backend server is down, or the frontend is pointing to the wrong URL/port.       | **Frontend:** Check the API base URL. **Backend:** Ensure the development server is running.               |

---

## 5. Summary Table

| Step                | Backend Responsibility                                  | Frontend Responsibility                                   | How to Verify                                          |
| ------------------- | ------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------ |
| **1. API Contract** | Document & expose endpoints via OpenAPI.                | Read docs, set up API client with the correct base URL.   | Frontend can successfully call a public backend endpoint. |
| **2. Auth**         | Implement JWT auth and protected routes.                | Implement login/register UI, store token, send in headers. | User can log in and access a protected route.           |
| **3. Data Fetching**| Provide endpoints that return correct list/detail data. | Fetch data from endpoints and display it in the UI.       | UI shows real data from the backend.                   |
| **4. CRUD**         | Persist and return changes for `POST`, `PUT`, `DELETE`.   | Implement UI for Create, Update, and Delete operations.   | Changes made in the UI are reflected in the database.  |
| **5. Error Handling**| Return consistent, documented error formats.            | Catch and display backend errors gracefully in the UI.    | UI shows a helpful message when an API error occurs.   |

---
**Key to Success:** Communicate frequently! Use shared channels (like Slack or Discord) and regular, short stand-ups to resolve blockers quickly. When in doubt, refer to the `ARCHITECTURE.md` and the OpenAPI documentation as the source of truth. 