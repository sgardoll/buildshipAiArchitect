
import { GoogleGenAI, Type } from '@google/genai';
import { PromptRequest, GeneratedFile } from '../types';
import { SYSTEM_INSTRUCTION } from '../constants';

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async refinePrompt(currentPrompt: string): Promise<string> {
    const prompt = `
      You are an expert BuildShip Architect. The user has provided a rough idea for a low-code node or workflow.
      
      Rewrite their input to be highly detailed, technical, and specific.
      - Specify inputs (types, required/optional).
      - Specify outputs (structure).
      - Mention error handling (timeouts, API failures).
      - Suggest specific libraries or logic steps if applicable (e.g. using 'axios' for requests).
      
      Keep the tone direct and the format as a clear instruction paragraph or list that can be fed into a code generator.
      
      USER INPUT: "${currentPrompt}"
      
      Refined Prompt:
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response.text.trim();
    } catch (error) {
      console.error("Refine Error", error);
      throw new Error("Failed to refine prompt.");
    }
  }

  async generateBuildShipFiles(request: PromptRequest): Promise<{ files: GeneratedFile[], summary: string }> {
    const { userPrompt, context } = request;

    const contextString = `
      CURRENT REPO CONTEXT:
      Package.json:
      ${context.packageJson || 'Not found (assume standard)'}

      Flow ID Mapping:
      ${context.flowIdMapping || 'Not found'}

      Existing Nodes (Use this to match naming convention like camelCase vs kebab-case):
      ${context.existingNodes.length > 0 ? context.existingNodes.join(', ') : 'None found, default to kebab-case'}
    `;

    const prompt = `
      USER REQUEST: "${userPrompt}"

      ${contextString}

      Generate the necessary files to fulfill this request adhering strictly to BuildShip architecture (index.ts + node.json).
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                files: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      path: { 
                        type: Type.STRING,
                        description: "The relative file path, e.g., 'nodes/my-node/1.0.0/index.ts'"
                      },
                      content: { 
                        type: Type.STRING, 
                        description: "The full text content of the file."
                      }
                    },
                    required: ['path', 'content']
                  }
                },
                summary: { 
                  type: Type.STRING,
                  description: "A short summary of the changes for the PR body."
                }
              },
              required: ['files', 'summary']
            }
        }
      });

      let responseText = response.text;
      if (!responseText) throw new Error("No response from AI");

      // Cleanup markdown code blocks if the model includes them despite schema
      responseText = responseText.trim();
      if (responseText.startsWith('```')) {
        responseText = responseText.replace(/^```(?:json)?\n?|\n?```$/g, '');
      }

      const parsed = JSON.parse(responseText);
      
      // Map to strict types
      const files: GeneratedFile[] = parsed.files.map((f: any) => ({
        path: f.path,
        content: f.content,
        type: f.path.includes('workflows/') ? 'workflow' : (f.path.includes('nodes/') ? 'node' : 'config')
      }));

      return {
        files,
        summary: parsed.summary || 'Automated BuildShip Update'
      };

    } catch (error) {
      console.error("Gemini Generation Error:", error);
      throw new Error("Failed to generate code. " + (error as any).message);
    }
  }
}
