# Deployment Guide: Google Cloud Platform (GCP)

Deploying this application to Google Cloud Platform involves a two-part process that mirrors the application's architecture:

1.  **Backend API**: The serverless function in `api/verify.ts` will be deployed using **Google Cloud Functions**.
2.  **Frontend App**: The static Angular application will be hosted using **Google Cloud Storage**.

This approach is highly scalable and cost-effective. It requires more manual steps than Vercel but offers deep integration with the GCP ecosystem.

### Prerequisites

1.  **Google Cloud Account**: You need a GCP account with an active billing account (a free tier is available).
2.  **Google Cloud SDK**: Install and initialize the `gcloud` command-line tool on your local machine.
3.  **New Gemini API Key**: Ensure you have a valid, secret Gemini API Key.

---

### Part 1: Deploying the Backend to Cloud Functions

First, we'll deploy our secure backend proxy.

#### Step 1: Prepare the Function

Your `api/` directory contains the function code (`verify.ts`) and a `package.json` to define its dependencies. The function is ready for deployment.

#### Step 2: Deploy the Cloud Function

1.  Open your terminal and navigate to the root directory of your project.
2.  Run the following `gcloud` command. Be sure to replace `[YOUR_FUNCTION_NAME]` and `[YOUR_PROJECT_ID]` with your own values.

    ```bash
    gcloud functions deploy [YOUR_FUNCTION_NAME] \
      --project=[YOUR_PROJECT_ID] \
      --runtime=nodejs20 \
      --trigger-http \
      --allow-unauthenticated \
      --source=./api \
      --entry-point=handler \
      --set-env-vars=API_KEY=[PASTE_YOUR_SECRET_API_KEY_HERE] \
      --region=us-central1
    ```

    **Command Breakdown:**
    -   `gcloud functions deploy`: The command to deploy a function.
    -   `[YOUR_FUNCTION_NAME]`: Give your function a name, e.g., `address-verifier-api`.
    -   `--runtime=nodejs20`: Specifies the Node.js version.
    -   `--trigger-http`: Makes the function accessible via an HTTP URL.
    -   `--allow-unauthenticated`: Allows public access so your frontend can call it.
    -   `--source=./api`: Tells GCP that your function's code is in the `api/` directory.
    -   `--entry-point=handler`: Specifies that the exported `handler` function in `verify.ts` is the one to execute.
    -   `--set-env-vars=API_KEY=...`: **This is the secure way to set your API key.** It becomes available as `process.env.API_KEY` in your function.
    -   `--region`: The GCP region where your function will be hosted.

3.  After the command finishes, GCP will provide you with a **Trigger URL**. It will look something like `https://us-central1-your-project-id.cloudfunctions.net/your-function-name`. **Copy this URL.**

---

### Part 2: Deploying the Frontend to Cloud Storage

Now we'll configure and deploy the Angular application.

#### Step 1: Update the API URL in Your Code

Your frontend needs to know the URL of your deployed Cloud Function.

1.  Open `src/services/gemini.service.ts`.
2.  Find the `backendUrl` constant.
3.  **Replace** the relative path `'/api/verify'` with the full **Trigger URL** you copied from the previous step.

    ```typescript
    // src/services/gemini.service.ts

    // BEFORE
    private readonly backendUrl = '/api/verify'; 

    // AFTER - USE YOUR COPIED URL
    private readonly backendUrl = 'https://us-central1-your-project-id.cloudfunctions.net/your-function-name'; 
    ```

#### Step 2: Build the Angular App

This project is set up in an environment that builds automatically. To deploy manually, you would typically run a build command like `ng build`. This command compiles your Angular app into a `dist/` folder containing static HTML, CSS, and JS files.

For this guide, we will assume you have a local Angular environment set up and can generate this `dist/` folder.

#### Step 3: Create a Cloud Storage Bucket

1.  Run this command to create a globally unique bucket to host your files. Replace `[YOUR_UNIQUE_BUCKET_NAME]` with a name, e.g., `address-verifier-webapp-yourname`.

    ```bash
    gsutil mb gs://[YOUR_UNIQUE_BUCKET_NAME]
    ```

2.  Make the bucket publicly readable so visitors can see your website.

    ```bash
    gsutil iam ch allUsers:objectViewer gs://[YOUR_UNIQUE_BUCKET_NAME]
    ```

#### Step 4: Upload Your App

Upload the contents of your build folder (`dist/your-project-name/browser/`) to the bucket.

```bash
# The path to your build output may vary slightly
gsutil -m rsync -r ./dist/your-project-name/browser gs://[YOUR_UNIQUE_BUCKET_NAME]
```

#### Step 5: Configure the Website Index Page

Tell Cloud Storage which file to serve as the main page.

```bash
gsutil web set -m index.html gs://[YOUR_UNIQUE_BUCKET_NAME]
```

### Accessing Your Application

Your application is now live! You can access it via the public URL for your Cloud Storage bucket:

`https://storage.googleapis.com/[YOUR_UNIQUE_BUCKET_NAME]/index.html`

For a custom domain and HTTPS, you would typically set up a Google Cloud Load Balancer in front of your bucket.
