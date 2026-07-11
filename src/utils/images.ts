const exerciceModules = import.meta.glob("../assets/exercices/*", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const machineModules = import.meta.glob("../assets/machines/*", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

function buildMap(modules: Record<string, string>): Record<string, string> {
  const map: Record<string, string> = {};
  for (const path in modules) {
    const filename = path.split("/").pop();
    if (filename) map[filename] = modules[path];
  }
  return map;
}

const exerciceMap = buildMap(exerciceModules);
const machineMap = buildMap(machineModules);

export function resolveImage(path: string): string | undefined {
  const filename = path.split("/").pop();
  if (!filename) return undefined;
  if (path.includes("/machines/")) return machineMap[filename];
  return exerciceMap[filename];
}

export function resolveImages(paths: string[]): string[] {
  return paths
    .map(resolveImage)
    .filter((url): url is string => url !== undefined);
}
