export async function loadHtml(path: string): Promise<string> {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    console.error(`Failed to load HTML from ${path}:`, error);
    return `<div>Error loading content from ${path}</div>`;
  }
}
