# Public GitHub submission

The user chose to perform GitHub upload. This package does not claim an existing public repository URL.

## Recommended upload method

1. Create a new **public** GitHub repository, for example `madar-fleet-se411`.
2. Do not initialize it with an extra README if uploading through Git from the prepared project.
3. Upload the **contents of the madar-fleet folder**, preserving `src`, `public`, `docs`, and `.github` directory structure. Include `package.json`, `package-lock.json`, `index.html`, `vite.config.js`, `.gitignore`, and `.npmrc`.
4. Exclude `node_modules`, `dist`, `coverage`, `.git`, `.sites-runtime`, and any `.env` files. The provided .gitignore covers them. `.openai/hosting.json` is optional private-preview hosting metadata; it contains no credentials and is not needed for marking or running the project.
5. Check that the README renders and screenshots appear. Check that the About page’s team information matches the approved team.
6. Let the CI workflow run. It installs dependencies, runs the tests, and builds the frontend. A GitHub CI run has not occurred before uploading.
7. Open the repository while signed out to verify it is public.
8. Have **one student** submit the public repository URL, as the brief specifies.

## Git option

From inside the project folder, when no Git repository has been initialized:

```sh
git init -b main
git add .
git commit -m "Complete Madar Fleet SE411 Part 1"
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

Replace the uppercase placeholders with your real repository. If the folder already contains a Git repository for preview hosting, use a fresh copy from the submission ZIP so private-preview remotes are not reused. Do not upload the ZIP as your only repository file; extract and upload the project files so the source is reviewable.

## Before submitting

- Run `npm ci`, `npm test`, and `npm run build`.
- Confirm all team members and student IDs; only the two supplied members are currently listed.
- The brief asks for three to four students. Obtain approval for two or add the actual remaining members to the About component and documentation.
- Confirm any revised deadline with the instructor; the brief prints 17 October 2026.
- Read the project report and rehearse the demo guide.

A deployed preview URL is optional and does **not** replace the required public GitHub repository URL. A private preview may be accessible only to its owner.
