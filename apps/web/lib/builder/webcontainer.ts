"use client";

import { WebContainer } from "@webcontainer/api";

let webcontainerInstance: WebContainer | null = null;

export async function getWebContainer() {
  if (webcontainerInstance) {
    return webcontainerInstance;
  }

  if (!window.crossOriginIsolated) {
    throw new Error(
      "Cross-Origin Isolation is not enabled. Check next.config.js headers."
    );
  }

  webcontainerInstance = await WebContainer.boot();

  return webcontainerInstance;
}