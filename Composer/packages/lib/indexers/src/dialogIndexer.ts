// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { DialogInfo, FileInfo, Diagnostic } from '@bfc/shared';

import { getBaseName } from './utils/help';
import ExtractIntentTriggers from './dialogUtils/extractIntentTriggers';
import {
  ExtractLgTemplates,
  ExtractLuIntents,
  ExtractReferredDialogs,
  ExtractTriggers,
  ExtractLGFile,
  ExtractLUFile,
} from './dialogUtils/extractResources';

function parse(id: string, content: any) {
  const diagnostics: Diagnostic[] = [];
  return {
    id,
    content,
    diagnostics,
    referredDialogs: ExtractReferredDialogs(content),
    lgTemplates: ExtractLgTemplates(id, content),
    referredLuIntents: ExtractLuIntents(id, content),
    luFile: ExtractLUFile(content),
    lgFile: ExtractLGFile(content),
    triggers: ExtractTriggers(content),
    intentTriggers: ExtractIntentTriggers(content),
  };
}

function index(files: FileInfo[], botName: string): DialogInfo[] {
  const dialogs: DialogInfo[] = [];
  if (files.length !== 0) {
    for (const file of files) {
      try {
        if (file.name.endsWith('.dialog') && !file.name.endsWith('.lu.dialog')) {
          const dialogJson = JSON.parse(file.content);
          const id = getBaseName(file.name, '.dialog');
          const isRoot = file.relativePath.includes('/') === false; // root dialog should be in root path
          const dialog = {
            isRoot,
            displayName: isRoot ? `${botName}` : id,
            ...parse(id, dialogJson),
          };
          dialogs.push(dialog);
        }
      } catch (e) {
        throw new Error(`parse failed at ${file.name}, ${e}`);
      }
    }
  }
  return dialogs;
}

export const dialogIndexer = {
  index,
  parse,
};
