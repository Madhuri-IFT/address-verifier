# Deployment Guide: Vercel

Vercel is a platform for frontend developers that provides an excellent and seamless deployment experience for projects like this one. The platform is designed to recognize the structure of your application (a static frontend with a serverless backend in an `api/` directory) and handle all the configuration automatically.

This is the recommended and simplest deployment method for this application.

### Prerequisites

1.  **GitHub Account**: Your code must be in a GitHub repository.
2.  **Vercel Account**: Sign up for a free Vercel account using your GitHub account.
3.  **New Gemini API Key**: Ensure you have a valid, secret Gemini API Key. **Do not commit this key to your code.**

---

### Step-by-Step Deployment

#### Step 1: Push Your Project to GitHub

If you haven't already, create a new repository on GitHub and push your entire project, including the `src/`, `api/`, and all root files (`index.html`, `index.tsx`, etc.).

#### Step 2: Import Your Project in Vercel

1.  Log in to your Vercel dashboard.
2.  Click **"Add New..."** and select **"Project"**.
3.  In the "Import Git Repository" section, find and select your project's repository. Vercel will automatically connect to it.

#### Step 3: Configure the Project

Vercel is very smart and should automatically detect that you have an Angular project.

1.  **Framework Preset**: It should automatically select "Angular". If not, you can choose it from the dropdown.
2.  **Build and Output Settings**: You can leave the default settings for an Angular project. Vercel knows how to build it.
3.  **Environment Variables**: This is the most important step for security.
    *   Expand the "Environment Variables" section.
    *   Add a new variable with the following details:
        *   **Name**: `API_KEY`
        *   **Value**: Paste your secret Gemini API key here.
    *   Click **"Add"**.

![Vercel Environment Variable Setup](https://vercel.com/docs/storage/vercel-kv/env-var.png)

*The Vercel UI for adding environment variables. Ensure the name is exactly `API_KEY`.*

#### Step 4: Deploy

1.  Click the **"Deploy"** button.
2.  Vercel will now pull your code from GitHub, build the Angular application, deploy the serverless function from `api/verify.ts`, and configure everything.
3.  Wait for the deployment process to complete. You'll see a "Congratulations!" screen with a link to your live site.

### How It Works

-   **Frontend**: Vercel builds your Angular app into static files (HTML, CSS, JS) and serves them on its global CDN for high performance.
-   **Backend**: Vercel finds the `api/verify.ts` file, recognizes it as a Node.js Serverless Function, and deploys it. When your frontend makes a request to `/api/verify`, Vercel automatically routes it to this function.
-   **API Key**: The environment variable you set is securely injected into the backend function at runtime, so it's never exposed to the public.

Your application is now live and secure! Vercel will also automatically redeploy your site every time you push a new commit to your main branch on GitHub.
