import { getArray, getString } from "../answers";
import type { Answers, ProjectPlan, ScaffoldFile } from "../types";

/**
 * The Scaffold Agent turns answers + the project plan into concrete files.
 * File content (YAML/Dockerfile/HCL syntax) needs to stay valid, so this
 * agent is template-driven rather than free-form LLM generation - the
 * templates are assembled from the same answers the Planner Agent used.
 */
export function scaffoldProject(answers: Answers, plan: ProjectPlan): ScaffoldFile[] {
    const projectName = getString(answers, "project_name") || "my-project";
    const containerization = getString(answers, "containerization");
    const iacTool = getString(answers, "iac_tool");
    const ciCdTool = getString(answers, "ci_cd_tool");
    const cloud = getString(answers, "cloud_provider");
    const environments = getString(answers, "environments");

    const files: ScaffoldFile[] = [];

    files.push({
        path: "README.md",
        description: "תיעוד ראשוני של הפרויקט, נוצר על ידי DevOps Hub",
        content: buildReadme(projectName, plan)
    });

    files.push({
        path: ".env.example",
        description: "תבנית משתני סביבה",
        content: buildEnvExample(cloud)
    });

    if (containerization === "docker_only" || containerization === "kubernetes") {
        files.push({
            path: "Dockerfile",
            description: "בניית קונטיינר לאפליקציה",
            content: buildDockerfile()
        });
        files.push({
            path: "docker-compose.yml",
            description: "הרצה מקומית עם docker compose",
            content: buildDockerCompose(projectName)
        });
    }

    if (containerization === "kubernetes") {
        files.push({
            path: "k8s/deployment.yaml",
            description: "Deployment + Service בסיסיים ל-Kubernetes",
            content: buildK8sManifest(projectName)
        });
    }

    if (iacTool === "terraform") {
        files.push({
            path: "infra/main.tf",
            description: "שלד Terraform לתשתית",
            content: buildTerraformSkeleton(projectName, cloud)
        });
    }

    const ciFile = buildCiPipeline(ciCdTool, projectName, environments, containerization);
    if (ciFile) files.push(ciFile);

    return files;
}

function buildReadme(projectName: string, plan: ProjectPlan): string {
    return `# ${projectName}

${plan.summary}

## סטאק מומלץ

${plan.recommendedStack.map((s) => `- ${s}`).join("\n")}

## אבני דרך

${plan.milestones.map((m, i) => `${i + 1}. ${m}`).join("\n")}

---
נוצר אוטומטית על ידי DevOps Hub.
`;
}

function buildEnvExample(cloud: string): string {
    const cloudVars: Record<string, string> = {
        aws: "AWS_ACCESS_KEY_ID=\nAWS_SECRET_ACCESS_KEY=\nAWS_REGION=",
        gcp: "GOOGLE_APPLICATION_CREDENTIALS=\nGCP_PROJECT_ID=",
        azure: "AZURE_CLIENT_ID=\nAZURE_CLIENT_SECRET=\nAZURE_TENANT_ID=",
        on_prem: "# הגדירו כאן משתני חיבור לתשתית ה-on-prem",
        none: "# הגדירו כאן משתני סביבה לפי הצורך"
    };

    return `NODE_ENV=development
PORT=3000

${cloudVars[cloud] ?? cloudVars.none}
`;
}

function buildDockerfile(): string {
    return `FROM node:20-alpine AS base
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 3000
CMD ["npm", "start"]
`;
}

function buildDockerCompose(projectName: string): string {
    return `services:
  ${projectName}:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env
`;
}

function buildK8sManifest(projectName: string): string {
    return `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${projectName}
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ${projectName}
  template:
    metadata:
      labels:
        app: ${projectName}
    spec:
      containers:
        - name: ${projectName}
          image: ${projectName}:latest
          ports:
            - containerPort: 3000
---
apiVersion: v1
kind: Service
metadata:
  name: ${projectName}
spec:
  selector:
    app: ${projectName}
  ports:
    - port: 80
      targetPort: 3000
`;
}

function buildTerraformSkeleton(projectName: string, cloud: string): string {
    const providerBlock: Record<string, string> = {
        aws: `provider "aws" {\n  region = var.region\n}\n\nvariable "region" {\n  default = "us-east-1"\n}`,
        gcp: `provider "google" {\n  project = var.project_id\n  region  = var.region\n}\n\nvariable "project_id" {}\nvariable "region" {\n  default = "us-central1"\n}`,
        azure: `provider "azurerm" {\n  features {}\n}`,
        on_prem: `# הגדירו כאן provider מותאם לתשתית ה-on-prem שלכם`,
        none: `# בחרו provider בהמשך`
    };

    return `terraform {
  required_version = ">= 1.5.0"
}

${providerBlock[cloud] ?? providerBlock.none}

# TODO: הוסיפו כאן את משאבי התשתית עבור ${projectName}
`;
}

function buildCiPipeline(
    ciCdTool: string,
    projectName: string,
    environments: string,
    containerization: string
): ScaffoldFile | null {
    const deployStages = environments === "dev_staging_prod"
        ? ["dev", "staging", "production"]
        : environments === "dev_prod"
            ? ["dev", "production"]
            : ["production"];

    if (ciCdTool === "github_actions") {
        return {
            path: ".github/workflows/ci.yml",
            description: "GitHub Actions pipeline: build, test ופריסה",
            content: `name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm test
${containerization !== "none" ? `      - name: Build container image\n        run: docker build -t ${projectName}:${"$"}{{ github.sha }} .\n` : ""}
${deployStages.map((stage) => `  deploy-${stage}:\n    needs: build-and-test\n    runs-on: ubuntu-latest\n    environment: ${stage}\n    steps:\n      - run: echo "Deploying ${projectName} to ${stage}"\n`).join("\n")}`
        };
    }

    if (ciCdTool === "gitlab_ci") {
        return {
            path: ".gitlab-ci.yml",
            description: "GitLab CI pipeline",
            content: `stages:
  - build
  - test
${deployStages.map((s) => `  - deploy-${s}`).join("\n")}

build:
  stage: build
  script:
    - npm ci

test:
  stage: test
  script:
    - npm test

${deployStages.map((stage) => `deploy-${stage}:\n  stage: deploy-${stage}\n  script:\n    - echo "Deploying ${projectName} to ${stage}"\n  environment: ${stage}\n`).join("\n")}`
        };
    }

    if (ciCdTool === "jenkins") {
        return {
            path: "Jenkinsfile",
            description: "Jenkins pipeline",
            content: `pipeline {
    agent any
    stages {
        stage('Build') {
            steps { sh 'npm ci' }
        }
        stage('Test') {
            steps { sh 'npm test' }
        }
${deployStages.map((stage) => `        stage('Deploy ${stage}') {\n            steps { sh 'echo Deploying ${projectName} to ${stage}' }\n        }`).join("\n")}
    }
}
`
        };
    }

    if (ciCdTool === "azure_pipelines") {
        return {
            path: "azure-pipelines.yml",
            description: "Azure Pipelines definition",
            content: `trigger:
  - main

pool:
  vmImage: ubuntu-latest

steps:
  - task: NodeTool@0
    inputs:
      versionSpec: '20.x'
  - script: npm ci
  - script: npm test
${deployStages.map((stage) => `  - script: echo "Deploying ${projectName} to ${stage}"`).join("\n")}
`
        };
    }

    if (ciCdTool === "circleci") {
        return {
            path: ".circleci/config.yml",
            description: "CircleCI pipeline",
            content: `version: 2.1

jobs:
  build-and-test:
    docker:
      - image: cimg/node:20.0
    steps:
      - checkout
      - run: npm ci
      - run: npm test

workflows:
  build-test-deploy:
    jobs:
      - build-and-test
`
        };
    }

    return null;
}
