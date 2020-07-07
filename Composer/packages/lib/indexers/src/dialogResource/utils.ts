// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

export function getBaseName(filename?: string): string | any {
  if (typeof filename !== 'string') return filename;
  return filename.substring(0, filename.lastIndexOf('.')) || filename;
}
