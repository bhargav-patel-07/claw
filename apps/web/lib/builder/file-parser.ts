import { Step, StepType } from "@/types/builder";

export function parseXml(response: string): Step[] {
  if (!response) {
    console.error("Empty AI response");
    return [];
  }

  // Find the artifact block
  const artifactMatch = response.match(/<boltArtifact[\s\S]*?<\/boltArtifact>/i);

  if (!artifactMatch) {
    console.error("No <boltArtifact> found in AI response");
    console.log("RAW AI RESPONSE:\n", response);
    return [];
  }

  const artifactXml = artifactMatch[0];

  const steps: Step[] = [];
  let stepId = 1;

  // Extract title
  const titleMatch = artifactXml.match(/title="([^"]*)"/i);
  const artifactTitle = titleMatch ? titleMatch[1] : "Project Files";

  // Initial project step
  steps.push({
    id: stepId++,
    title: artifactTitle,
    description: "",
    type: StepType.CreateFolder,
    status: "pending",
  });

  // Match all boltAction tags
  const actionRegex =
    /<boltAction\s+type="([^"]+)"(?:\s+filePath="([^"]+)")?>([\s\S]*?)<\/boltAction>/gi;

  let match;

  while ((match = actionRegex.exec(artifactXml)) !== null) {
    const type = match[1];
    const filePath = match[2];
    const content = match[3]?.trim() || "";

    // FILE CREATION
    if (type === "file") {
      steps.push({
        id: stepId++,
        title: `Create ${filePath || "file"}`,
        description: "",
        type: StepType.CreateFile,
        status: "pending",
        code: content,
        path: filePath,
      });
    }

    // SHELL COMMAND
    if (type === "shell") {
      steps.push({
        id: stepId++,
        title: "Run command",
        description: "",
        type: StepType.RunScript,
        status: "pending",
        code: content,
      });
    }
  }

  if (steps.length === 1) {
    console.warn("Artifact found but no actions parsed");
    console.log("Artifact XML:\n", artifactXml);
  }

  return steps;
}