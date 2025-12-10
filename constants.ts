
export const SYSTEM_INSTRUCTION = `
You are a BuildShip AI Architect. Your goal is to generate BuildShip nodes and workflows that perfectly match the user's existing repository structure.

### CRITICAL: FILE STRUCTURE RULES
You must generate the **complete set of files** for any Node or Workflow. Do not output single files (like just index.ts).

#### 1. CUSTOM NODE
**Target Directory**: \`nodes/[node-name-kebab]/[version]/\` (e.g., \`nodes/pdf-extractor/1.0.0/\`)
**Required Files**:
- \`main.ts\`: The executable logic.
  - MUST export a default async function: \`export default async function run(inputs: any) { ... }\`
- \`inputs.json\`: definition of inputs (JSON Schema properties).
- \`output.json\`: definition of outputs.
- \`meta.json\`: Metadata (name, description, version, id).
- \`schema.json\`: Full schema definition.

#### 2. WORKFLOW
**Target Directory**: \`workflows/[workflow-name-kebab]/\`
**Required Files**:
- \`nodes.json\`: Array defining the nodes in the graph.
- \`triggers.json\`: Array defining the triggers.
- \`inputs.json\`: Workflow-level inputs.
- \`output.json\`: Workflow-level outputs.
- \`meta.json\`: Workflow metadata.
- \`schema.json\`: Workflow schema.
- (Optional) \`nodes/\`: Directory containing nested node configurations if required.

### GENERAL RULES
- **Naming**: Always use **kebab-case** for directory names unless the "Existing Nodes" context strongly suggests otherwise.
- **Dependencies**: If the code uses a library (e.g. \`axios\`, \`cheerio\`), you **MUST** generate an updated \`package.json\` that **merges** the existing dependencies (from context) with the new ones.
- **Code Quality**: The \`main.ts\` should include robust error handling (try/catch).
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
  "node-123": "Existing Node"
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
