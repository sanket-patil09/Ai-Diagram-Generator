import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { parseGithubUrl, fetchRepoContext } from '@/lib/github';

export async function POST(req) {
  try {
    const body = await req.json();
    const { repoUrl, diagramType } = body;

    const parsedUrl = parseGithubUrl(repoUrl);
    if (!parsedUrl) {
      return NextResponse.json({ error: 'Invalid GitHub URL format.' }, { status: 400 });
    }

    const { owner, repo } = parsedUrl;
    
    // Check if API key exists
    if (!process.env.GEMINI_API_KEY) {
      // Return a very realistic mock diagram if no API key is present for demo purposes
      console.warn("No GEMINI_API_KEY found, returning mock diagram.");
      let mockMermaid = '';
      if (diagramType === 'er') {
        mockMermaid = `erDiagram\n    USER ||--o{ POST : "creates"\n    USER ||--o{ COMMENT : "writes"\n    POST ||--o{ COMMENT : "has"\n    USER {\n        int id PK\n        string username\n        string email\n    }\n    POST {\n        int id PK\n        int user_id FK\n        string content\n    }`;
      } else if (diagramType === 'sequence') {
        mockMermaid = `sequenceDiagram\n    actor User\n    participant Frontend\n    participant Backend\n    participant DB\n    User->>Frontend: Request Data\n    Frontend->>Backend: API Call /get-data\n    Backend->>DB: Query Database\n    DB-->>Backend: Result Set\n    Backend-->>Frontend: JSON Response\n    Frontend-->>User: Render View\n`;
      } else {
        mockMermaid = `graph TD\n    A[Client] -->|HTTP GET| B(API Gateway)\n    B --> C{Load Balancer}\n    C -->|Reroutes| D[Service 1]\n    C -->|Reroutes| E[Service 2]\n    D --> F[(Database)]`;
      }
      // Simulate delay
      await new Promise(r => setTimeout(r, 2000));
      return NextResponse.json({ mermaidString: mockMermaid });
    }

    // 1. Fetch contextual repo data
    const repoContext = await fetchRepoContext(owner, repo);

    // 2. Setup Gemini
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `
You are a software architecture expert. Based on the following GitHub repository file structure and vital file contents, generate a valid, structured Mermaid.js code for a ${diagramType} diagram.
Repository Description: ${repoContext.description}
Primary Language: ${repoContext.language}

File Structure:
${repoContext.paths}

Vital Files Content:
${repoContext.vitalFiles}

Rules:
1. Output ONLY the raw Mermaid code inside markdown formatting (e.g. \`\`\`mermaid). I will extract it.
2. Ensure relationships are proper and standard Mermaid syntax is followed perfectly.
3. For ER Diagrams: DO NOT use quotes, constraints, or descriptions inside the Entity attribute definitions. Only use strict 'type name' syntax (e.g., 'string id PK', 'int user_id').
4. CRITICAL FOR ER: EACH attribute MUST be on its own separate newline. The opening '{' and closing '}' MUST be on their own separate newlines. Never write attributes on the same line as the braces.
5. For Sequence/Architecture/Deployment: Map the inferred components based on package files, docker-compose, or folder layers. ALWAYS use 'flowchart TD' or 'graph TD' as the root declaration. Do NOT hallucinate types like 'deploymentDiagram'.
6. CRITICAL: Node and Subgraph IDs MUST be strictly alphanumeric with no spaces. If you need spaces for display names, use label syntax (e.g. ClientEnv["Client Environment"]). 
7. ALL flowchart connections MUST use standard arrows (e.g., '-->') and be placed on their own separate lines. Do not write multiple disconnected nodes on the same line. Do not apologize or return conversational text.

Generate the ${diagramType} diagram Mermaid syntax now.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.2,
      }
    });

    const aiText = response.text;
    
    // Extract string between markdown code blocks if present
    let finalMermaid = aiText;
    const mermaidMatch = aiText.match(/\`\`\`(mermaid)?\s*([\s\S]*?)\`\`\`/);
    if (mermaidMatch) {
      finalMermaid = mermaidMatch[2].trim();
    }

    return NextResponse.json({ mermaidString: finalMermaid });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error while analyzing repo' },
      { status: 500 }
    );
  }
}
