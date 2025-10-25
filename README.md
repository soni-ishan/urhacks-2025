NavigatUR
=========

Lost in a big building or on a complex campus? NavigatUR finds the shortest route. Just pick your start and end points, and it draws the path on a floor plan. Staff can even update the map live from a secure admin panel.

Features
--------
### User Features
-   **Simple Interface:** A clean, mobile-friendly card with two dropdowns: "Start Location" and "End Location".
-   **Instant Pathfinding:** Uses Dijkstra's algorithm to find the shortest path between any two "Room" nodes.
-   **Visual Guidance:** Draws the calculated path clearly in green on top of the campus floor plan.
-   **Clean Map:** Hides all the complex graph data (nodes and edges) from the user. They only see the map and their path.

### Admin Features
-   **Secure Admin Panel:** A separate admin page (`/admin.html`) for managing the navigation graph.
-   **Live Visual Editor:** Admins can click directly on the map to:
    -   **Add Room Nodes:** Create destinations (like "Room 101") that appear in the user's dropdown.
    -   **Add Corridor Nodes:** Create the hidden "junction" points of the navigation network.
    -   **Add Edges:** Visually connect corridor nodes to build the path network.
    -   **Remove Items:** Click any node or edge to delete it.
-   **Cloud-Based:** All graph data is saved directly to a **Firebase Firestore** database in real-time. Any changes made by an admin are instantly live for all users.

Tech Stack
----------
-   **Languages:** HTML5, CSS3, JavaScript (ES6+ Modules)
-   **Build Tool / Dev Server:** [Vite](https://vitejs.dev/ "null")
-   **Database:** [Firebase Firestore](https://firebase.google.com/products/firestore "null") (as a live NoSQL backend)
-   **Hosting:** [Firebase Hosting](https://firebase.google.com/products/hosting "null")
-   **Authentication:** [Firebase Authentication](https://firebase.google.com/products/auth "null") (for Anonymous sign-in to secure the database connection)
-   **Core Logic:**
    -   **HTML Canvas API:** Used to draw the map, all nodes, edges, and the final path.
    -   **Dijkstra's Algorithm:** A custom implementation (in `src/dijkstra.js`) for shortest path calculation.

How to Run This Project Locally
-------------------------------
### 1\. Prerequisite: Create Your Firebase Project
Before you can run this project, you must set up your own Firebase backend.
1.  Go to the [Firebase Console](https://console.firebase.google.com/ "null") and create a new project.
2.  **Enable Firestore:** Click **"Firestore Database"** > **"Create database"**. Start in **"Test mode"**.
3.  **Enable Authentication:** Click **"Authentication"** > **"Sign-in method"** > **"Anonymous"** and **Enable** it.
4.  **Enable Identity Toolkit API:** This is required for auth.
    -   Go to the [Google Cloud API Library](https://console.cloud.google.com/apis/library "null").
    -   Select your new Firebase project.
    -   Search for **"Identity Toolkit API"** and **Enable** it.
### 2\. Local Installation
1.  Clone this repository:
    ```
    git clone [https://github.com/your-username/navigatur.git](https://github.com/your-username/navigatur.git)
    cd navigatur
    ```
2.  Install all `npm` dependencies:
    ```
    npm install
    ```
3.  Create your environment file:
    -   In the project's root folder, create a new file named `.env`
    -   Go to your **Firebase Project Settings** > **General** > **Your apps**.
    -   Click the **</>** (Web) icon to register a new web app.
    -   Copy the `firebaseConfig` object and paste its values into your `.env` file, **adding `VITE_` to the start of each key**:
    ```
    VITE_FIREBASE_API_KEY=AIza...
    VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
    VITE_FIREBASE_PROJECT_ID=your-project-id
    VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
    VITE_FIREBASE_MESSAGING_SENDER_ID=...
    VITE_FIREBASE_APP_ID=...
    ```
4.  Add your map file:
    -   Place your floor plan image (e.g., `blueprint.png`) inside the `public/` folder.
    -   Make sure the filename matches the one in `src/admin.js` and `src/main.js`.
### 3\. Authorize Your `localhost` (Crucial!)
Firebase will block connections from `localhost` by default.
1.  Go to the [Google Cloud API Credentials](https://console.cloud.google.com/apis/credentials "null").
2.  Select your Firebase project.
3.  Click the name of the **"Browser key (auto created by Firebase)"**.
4.  Under **"Application restrictions"**, select **"Websites"**.
5.  Under **"Website restrictions"**, click **"ADD"** and enter: `http://localhost:5173/*`
6.  Under **"API restrictions"**, select **"Don't restrict key"**.
7.  Click **Save**. (It may take 5 minutes to take effect).
### 4\. Run the Development Server
You're all set!
```
npm run dev
```
-   **User App:** Open `http://localhost:5173/`
-   **Admin Panel:** Open `http://localhost:5173/admin.html`

Deployment
----------
This project is configured for one-click deployment with Firebase Hosting.
1.  **Authorize Your Live Domain:**
    -   Just like you did for `localhost`, go back to your Google Cloud API key's **"Website restrictions"**.
    -   Click **"ADD"** and add your live Firebase URL: `https://your-project-id.web.app/*`
    -   Click **Save**.
2.  **Install Firebase Tools (if you haven't):**
    ```
    npm install -g firebase-tools
    ```
3.  **Login and Initialize:**
    ```
    firebase login
    firebase init hosting
    ```
    -   Select your Firebase project.
    -   What do you want to use as your public directory? **dist**
    -   Configure as a single-page app? **Yes**

4.  **Build and Deploy:**
    ```
    # 1. Create the optimized production build
    npm run build

    # 2. Deploy that build to the cloud
    firebase deploy --only hosting

    ```

Your app will be live at the "Hosting URL" provided in the terminal.