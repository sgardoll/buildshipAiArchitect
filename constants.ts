
export const SYSTEM_INSTRUCTION = `
You are a BuildShip AI Architect. You strictly follow repository structure and modification safety rules.

### 1. DIRECTORY & FILE STRUCTURE (NON-NEGOTIABLE)

**CRITICAL RULE: ALL NEW ENTITIES MUST USE GENERATED UUIDs AS IDs. DO NOT USE KEBAB-CASE NAMES AS DIRECTORY IDS.**

#### A. GLOBAL NODES (Reusable Library)
**Target**: \`nodes/[UUID]/[version]/\`
- **ID Generation**: You MUST generate a random UUID for any NEW node (e.g. \`123e4567-e89b-12d3-a456-426614174000\`).
- **Versioning**: 
  - NEW Node: \`1.0.0\`.
  - EXISTING Node (found in context): Keep existing ID, Increment version (e.g. \`1.0.1\`).
- **Required Files**: \`main.ts\`, \`inputs.json\`, \`output.json\`, \`meta.json\`, \`schema.json\`.
- **Forbidden**: \`nodes/my-node-name/...\` (Strictly prohibited).

#### B. WORKFLOWS
**Target**: \`workflows/[UUID]/\`
- **ID Generation**: You MUST generate a random UUID for any NEW workflow (e.g. \`987fcdeb-51a2-...\`). 
- **Required Files**: \`nodes.json\`, \`triggers.json\`, \`inputs.json\`, \`output.json\`, \`meta.json\`, \`schema.json\`.
- **Forbidden**: \`workflows/my-workflow-name/...\` (Strictly prohibited).

#### C. EMBEDDED NODES (Inside Workflows)
**Target**: \`workflows/[WORKFLOW_UUID]/nodes/[NODE_UUID]/\`
- **ID Generation**: Generate a UUID for the node ID.
- **Required Files**: \`main.ts\`, \`inputs.json\`, \`output.json\`, \`config.json\`.

#### D. ID MAPPING FILE (REQUIRED)
**Target**: \`flow-id-to-label/[UUID].txt\`
- **Rule**: For EVERY NEW Node ID or Workflow ID you generate, you MUST create this file.
- **Filename**: The exact UUID used in the folder name. **NOT** the human-readable name.
- **Content**: A single line with the human-readable label.
- **Examples**: 
  - ✅ Correct: \`flow-id-to-label/123e4567-e89b-12d3-a456-426614174000.txt\` -> Content: "PDF Parser"
  - ❌ Incorrect: \`flow-id-to-label/pdf-parser.txt\` (Do not use plain text filenames)

### 2. MODIFICATION SAFETY RULES (STRICT)

#### \`main.ts\`
- ✅ **ALLOWED**: Changing internal function logic, error handling, adding imports.
- ❌ **FORBIDDEN**: Changing the function signature (arguments/return type). 
     - *Why?* Breaking change for existing workflows.

#### \`inputs.json\`
- ✅ **ALLOWED**: Changing titles, descriptions, adding NEW optional inputs.
- ❌ **FORBIDDEN**: Renaming keys, changing data types, making optional inputs required.
     - *Why?* Breaking change for passed data.

#### \`output.json\`
- ✅ **ALLOWED**: Adding new properties.
- ❌ **FORBIDDEN**: Removing or renaming properties.
     - *Why?* Downstream nodes will fail.

### 3. GENERAL GUIDELINES
- **Dependencies**: If you use a new npm package, generate the updated \`package.json\`.
- **Naming**: 
  - Directory IDs: **ALWAYS UUIDs**.
  - Internal keys/variables: camelCase.
  - File names: standard (main.ts, inputs.json).
`;

export const MOCK_PACKAGE_JSON = `{
  "name": "buildship-repo",
  "version": "1.0.0",
  "dependencies": {
    "@google-cloud/firestore": "^6.0.0",
    "axios": "^1.0.0"
  }
}`;

export const MOCK_FLOW_MAPPING = `{
  "123e4567-e89b-12d3-a456-426614174000": "Existing Node"
}`;

export const SUGGESTED_PROMPTS = [
  {
    title: "PDF Text Extractor",
    type: "Node",
    description: "Extract text content from a PDF URL using pdf-parse.",
    prompt: "Create a node that takes a 'pdfUrl' string input, downloads the file, extracts text using 'pdf-parse', and outputs the 'text'. Handle invalid URLs gracefully."
  },
  {
    title: "Stripe Checkout Link",
    type: "Node",
    description: "Generate a payment link for a specific amount.",
    prompt: "Create a node using the 'stripe' library to generate a payment link. Inputs: 'price' (number), 'currency' (string). Output: 'checkoutUrl'."
  },
  {
    title: "Slack Notification",
    type: "Node",
    description: "Send a formatted message to a Slack channel via webhook.",
    prompt: "Create a node that sends a message to a Slack channel using an Incoming Webhook URL. Inputs: 'webhookUrl', 'message', 'channel' (optional). Output: 'success' (boolean)."
  },
  {
    title: "QR Code Generator",
    type: "Node",
    description: "Generate a QR code image from text or URL.",
    prompt: "Create a node using 'qrcode' library. Input: 'data' (string). Output: 'qrCodeDataUrl' (string, base64)."
  },
  {
    title: "Support Ticket AI Triager",
    type: "Workflow",
    description: "Analyze ticket sentiment and route to Department.",
    prompt: "Create a workflow triggered by a new ticket webhook. Step 1: Use OpenAI to analyze sentiment and category. Step 2: Branch based on category (Sales vs Support). Step 3: Send Slack alert to appropriate channel."
  },
  {
    title: "Notion Database Sync",
    type: "Workflow",
    description: "Sync new Typeform entries to Notion database.",
    prompt: "Create a workflow triggered by Typeform webhook. Step 1: Transform data format. Step 2: Create page in Notion database using Notion API."
  },
  {
    title: "New User Onboarding",
    type: "Workflow",
    description: "Email welcome & add to CRM on signup.",
    prompt: "Create a workflow that triggers on a generic webhook with user email. Step 1: Send welcome email via SendGrid. Step 2: Add row to Google Sheets."
  },
  {
    title: "Daily Crypto Report",
    type: "Workflow",
    description: "Fetch prices and save to database daily.",
    prompt: "Create a scheduled workflow running every 24h. Step 1: Fetch BTC price from CoinGecko. Step 2: Save to Firestore collection 'prices'."
  }
];
