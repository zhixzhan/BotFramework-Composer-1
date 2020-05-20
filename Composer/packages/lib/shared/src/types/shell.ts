// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/* eslint-disable @typescript-eslint/no-explicit-any */

import { DialogInfo, LuFile, LgFile, LuIntentSection } from './indexers';
import { UserSettings } from './settings';
import { OBISchema } from './schema';

/** Recursively marks all properties as optional. */
type AllPartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[] ? AllPartial<U>[] : T[P] extends object ? AllPartial<T[P]> : T[P];
};

export interface EditorSchema {
  content?: {
    fieldTemplateOverrides: any;
    SDKOverrides?: any;
  };
}

export interface BotSchemas {
  default?: OBISchema;
  sdk?: any;
  diagnostics?: any[];
}

export interface ShellData {
  locale: string;
  botName: string;
  currentDialog: DialogInfo;
  projectId: string;
  data: {
    $kind: string;
    [key: string]: any;
  };
  designerId: string;
  dialogId: string;
  dialogs: DialogInfo[];
  focusedEvent: string;
  focusedActions: string[];
  focusedSteps: string[];
  focusedTab?: string;
  focusPath: string;
  clipboardActions: any[];
  hosted: boolean;
  lgFiles: LgFile[];
  luFiles: LuFile[];
  userSettings: UserSettings;
  skills: any[];
  // TODO: remove
  schemas: BotSchemas;
}

export interface ShellApi {
  getDialog: (dialogId: string) => any;
  saveDialog: (dialogId: string, newDialogData: any) => any;
  saveData: <T = any>(newData: T, updatePath?: string) => void;
  navTo: (path: string, rest?: any) => void;
  onFocusSteps: (stepIds: string[], focusedTab?: string) => void;
  onFocusEvent: (eventId: string) => void;
  onSelect: (ids: string[]) => void;
  updateLuIntent: (id: string, intentName: string, intent: LuIntentSection) => Promise<void>;
  updateRegExIntent: (id: string, intentName: string, pattern: string) => void;
  createDialog: (actions: any) => Promise<string | null>;
  addCoachMarkRef: (ref: { [key: string]: any }) => void;
  onCopy: (clipboardActions: any[]) => void;
  undo: () => void;
  redo: () => void;
  updateUserSettings: (settings: AllPartial<UserSettings>) => void;
  addSkillDialog: () => Promise<{ manifestUrl: string } | null>;
  announce: (message: string) => void;
  displayManifestModal: (manifestId: string) => void;
}
