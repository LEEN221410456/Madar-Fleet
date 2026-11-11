# Madar Fleet Part 1 connected React frontend

This React frontend connects to the Spring Boot project in [`../backend`](../backend/). Both projects are configured to work together locally. See the [repository setup guide](../README.md).

## Run both projects

1. Clone the repository and locate its `backend` and `frontend` folders.
2. In NetBeans, choose **File → Open Project** and select `backend` (the folder with `pom.xml`). Right-click the project and choose **Run**. Alternatively, run `mvn spring-boot:run` in `backend`. Leave it running on port 8080.
3. With Node.js 22.12 or newer, open a terminal in the `frontend` folder (the one with `package.json`). Run:

   ```sh
   npm ci
   npm run dev
   ```

   Run `npm ci` after cloning the project. The first Maven and npm installs need internet access to download dependencies.
4. Open the frontend URL printed by Vite, normally **http://127.0.0.1:5173**. The header says **Connected to Spring** once the server responds. Use the URL printed by Vite if port 5173 was already taken.

No API key, database installation, CORS changes, or manual integration edits are needed. The included Vite development proxy sends `/api` requests to Spring Boot at `http://127.0.0.1:8080`. Use `npm run dev` for the paired local demo. If you intentionally run Spring on another port, set `MADAR_BACKEND_URL` to that server's local origin before starting Vite.

## Try the connected demo

- Open **Vehicles**, then use **Next** and **Previous** to browse server pages.
- **Add vehicle** and note the ID that Spring assigns. The registry shows the newly saved record; click **Clear** to return to the full list.
- Expand **Find by asset ID**, enter the ID, and click **Find vehicle**. Edit the mileage and save.
- Refresh and find the same ID again. Its updated mileage is still in the Spring database.
- The overview totals cover the whole fleet. Filters and service views apply before pagination. **Export** includes all matching rows across pages. **Delete vehicle** removes a record from the active registry; **Undo** restores it on the server.

If the app says the server is unavailable, confirm you are running this repository's `backend` project, and that `http://127.0.0.1:8080/api/vehicles/summary` returns JSON. Then select **Try again** in React.

## Verify the frontend

```sh
npm test
npm run build
```

The tests use a mock HTTP boundary. The paired application was also tested with real Spring HTTP requests and in a browser. See [verification](docs/CONNECTED-VERIFICATION.md). The [original Part 1 documents](docs/part-1-original/) describe the earlier standalone, in-memory frontend and are retained for reference.
