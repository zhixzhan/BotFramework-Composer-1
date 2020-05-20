// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/** @jsx jsx */
import { jsx } from '@emotion/core';
import React from 'react';
import { LuEditor, inlineModePlaceholder } from '@bfc/code-editor';
import { FieldProps, useShellApi } from '@bfc/extension';
import { filterSectionDiagnostics } from '@bfc/indexers';
import { VLUPropName, VLUPropBody } from '@bfc/indexers/lib/dialogUtils/virtualDialog';
import { CodeEditorSettings } from '@bfc/shared';

const LuisIntentVirtualEditor: React.FC<FieldProps<string>> = props => {
  const { onChange, placeholder } = props;
  const { currentDialog, luFiles, shellApi, locale, projectId, userSettings, data } = useShellApi();
  const luFile = luFiles.find(f => f.id === `${currentDialog.id}.${locale}`);

  console.log(data);

  /**
   * if props.value is string, it means luName, used by `Trigger phrases` input
   * if props.value is object, it means current dialog item, used by `TextInput`
   *
   * Both scearios, data from useShellApi are same, so here ignore props.value
   */
  const luName = data[VLUPropName];
  const luBody = data[VLUPropBody];

  if (!luFile) {
    return null;
  }

  const commitChanges = newValue => {
    if (!luName) {
      return;
    }

    const newIntent = { Name: luName, Body: newValue };
    shellApi.updateLuIntent(luFile.id, luName, newIntent);
    onChange(luName);
  };

  const handleSettingsChange = (settings: Partial<CodeEditorSettings>) => {
    shellApi.updateUserSettings({ codeEditor: settings });
  };

  const diagnostics = luFile ? filterSectionDiagnostics(luFile, luName) : [];

  return (
    <LuEditor
      height={225}
      luOption={{ fileId: luFile.id, sectionId: luName, projectId }}
      value={luBody}
      onChange={commitChanges}
      diagnostics={diagnostics}
      editorSettings={userSettings.codeEditor}
      onChangeSettings={handleSettingsChange}
      placeholder={placeholder || inlineModePlaceholder}
    />
  );
};

export { LuisIntentVirtualEditor };
