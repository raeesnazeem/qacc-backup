import { supabase } from "../lib/supabase";

export async function bulkDeleteRuns(runIds: string[]) {
  if (!runIds || !Array.isArray(runIds) || runIds.length === 0) {
    return;
  }

  // 1. Gather explicitly linked file paths from Findings & Pages
  const { data: findings } = await supabase
    .from("findings")
    .select("screenshot_url")
    .in("run_id", runIds);
  const { data: pages } = await supabase
    .from("pages")
    .select(
      "screenshot_url_desktop, screenshot_url_tablet, screenshot_url_mobile"
    )
    .in("run_id", runIds);

  const pathsToDelete = new Set<string>();
  const extractPath = (url: string) => {
    if (!url || !url.includes("/storage/v1/object/")) return;
    const match = url.match(
      /\/object\/(?:public|sign)\/(?:screenshots|evidence|public_evidence)\/([^?]+)/
    );
    if (match && match[1]) pathsToDelete.add(decodeURIComponent(match[1]));
  };

  findings?.forEach((f: any) => {
    if (f.screenshot_url) f.screenshot_url.split(",").forEach(extractPath);
  });

  pages?.forEach((p: any) => {
    extractPath(p.screenshot_url_desktop);
    extractPath(p.screenshot_url_tablet);
    extractPath(p.screenshot_url_mobile);
  });

  // 2. Delete explicitly linked files from potential buckets
  if (pathsToDelete.size > 0) {
    const pathArray = Array.from(pathsToDelete);
    await supabase.storage.from("screenshots").remove(pathArray);
    await supabase.storage.from("evidence").remove(pathArray);
    await supabase.storage.from("public_evidence").remove(pathArray);
  }

  // 2.5 Recursively delete all orphaned intermediate run files by runId prefix
  const deleteFolderRecursive = async (
    bucketName: string,
    folderPath: string
  ) => {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(folderPath, { limit: 1000 });
    if (error || !data || data.length === 0) return;

    const filesToRemove: string[] = [];
    for (const item of data) {
      if (!item.name || item.name === ".emptyFolderPlaceholder") continue;
      const itemPath = `${folderPath}/${item.name}`;
      if (!item.id) {
        await deleteFolderRecursive(bucketName, itemPath);
      } else {
        filesToRemove.push(itemPath);
      }
    }
    if (filesToRemove.length > 0) {
      await supabase.storage.from(bucketName).remove(filesToRemove);
    }
  };

  for (const runId of runIds) {
    // Wipe entirely runId-prefixed folders
    await deleteFolderRecursive("screenshots", runId);
    await deleteFolderRecursive("evidence", runId);
    await deleteFolderRecursive("public_evidence", runId);

    // Wipe privacy policy intermediate files prefixed with runId
    const { data: ppData } = await supabase.storage
      .from("evidence")
      .list("privacy_policy", { limit: 1000, search: runId });
    if (ppData && ppData.length > 0) {
      const ppFilesToRemove = ppData
        .filter((item) => item.id && item.name.startsWith(runId))
        .map((item) => `privacy_policy/${item.name}`);

      if (ppFilesToRemove.length > 0) {
        await supabase.storage.from("evidence").remove(ppFilesToRemove);
      }
    }
  }

  // 3. Delete the run
  const { error } = await supabase.from("qa_runs").delete().in("id", runIds);

  if (error) throw error;
}
