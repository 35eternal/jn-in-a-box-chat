# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/7fd5a25d-88b8-437a-8d32-4a6b932b41af

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/7fd5a25d-88b8-437a-8d32-4a6b932b41af) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## Operational Guardrails

The screenshot provided defines the core guardrails for day-to-day work on this codebase:

- Do not override any working backend logic unless explicitly asked to do so.
- Do not remove or rename any existing Supabase fields, even if they appear unused.
- Do not modify database schemas, edge functions, or RLS policies unless the task explicitly requires it.
- Do not assume something is broken without validating it against the live database or function logs.
- Do not delete UI components or styles unless they are explicitly marked as “Deprecated”.

Keep these constraints in mind when proposing or reviewing changes, especially when working outside of Lovable’s automated scaffolding.

## Git Workflow (Production & Development)

To support reliable deployments, adopt a two-branch workflow in GitHub:

1. `production` (protected): Only deployable, reviewed code should land here. Require pull requests, status checks, and code review before merging.
2. `development`: Integrate day-to-day work here. Feature branches (e.g., `feature/private-chat-fix`) branch off `development` and merge back via pull requests after review and automated checks.

Deployment flow:
- Merge feature branches into `development` once they pass CI.
- After validation in staging, open a pull request from `development` into `production` for the release.
- Tag production releases (e.g., `v1.3.0`) after merging to simplify rollbacks.

Automations to consider:
- Enable branch protection rules for both branches (require PR reviews, status checks).
- Configure CI to run on pull requests targeting either branch.
- Optionally, auto-deploy `production` to your live environment while `development` deploys to staging.

## GitHub Configuration Checklist

To make the most of the new branching model, apply these settings in the repository:

- **Branch protection**  
  - `production`: require pull requests, at least one approving review, and passing status checks.  
  - `development`: require pull requests and passing status checks; allow auto-merge for green PRs if desired.  
  - Enable branch auto-deletion for merged feature branches.

- **Default branch**  
  - Keep `main` as legacy baseline or switch the repo default to `development` if you want new PRs to target it automatically.

- **Feature and hotfix branches**  
  - Use short-lived branches named `feature/<scope>` or `fix/<ticket>` off `development`.  
  - For emergencies, create `hotfix/<issue>` from `production`, then merge the fix back into both `production` and `development`.

- **Environments & secrets**  
  - Define GitHub environments (`staging`, `production`) with required reviewers before deploys.  
  - Store environment-specific secrets (Supabase keys, AI credentials) per environment.

- **Automation ideas**  
  - GitHub Actions workflow to run lint/test/build on every PR.  
  - Release tagging Action when merging `development` into `production`.  
  - Dependabot or Renovate for keeping dependencies up to date.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/7fd5a25d-88b8-437a-8d32-4a6b932b41af) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
