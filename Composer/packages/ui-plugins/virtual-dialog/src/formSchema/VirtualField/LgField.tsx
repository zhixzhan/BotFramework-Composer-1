// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/** @jsx jsx */
import { jsx } from '@emotion/core';
import React from 'react';
import { LgEditor } from '@bfc/code-editor';
import { FieldProps, useShellApi } from '@bfc/extension';
import { FieldLabel } from '@bfc/adaptive-form';
import { LgMetaData, LgTemplateRef, LgType, CodeEditorSettings } from '@bfc/shared';
import { filterTemplateDiagnostics } from '@bfc/indexers';

const lspServerPath = '/lg-language-server';

const tryGetLgMetaDataType = (lgText: string): string | null => {
  const lgRef = LgTemplateRef.parse(lgText);
  if (lgRef === null) return null;

  const lgMetaData = LgMetaData.parse(lgRef.name);
  if (lgMetaData === null) return null;

  return lgMetaData.type;
};

const getInitialTemplate = (fieldName: string, formData?: string): string => {
  const lgText = formData || '';

  // Field content is already a ref created by composer.
  if (tryGetLgMetaDataType(lgText) === fieldName) {
    return '';
  }
  return lgText.startsWith('-') ? lgText : `- ${lgText}`;
};

const LgField: React.FC<FieldProps<string>> = props => {
  const { label, id, description, value, name, uiOptions, required, onChange } = props;
  const { designerId, currentDialog, lgFiles, shellApi, projectId, locale, userSettings, data } = useShellApi();
  const lgBody = value || getInitialTemplate(name, value);

  console.log('value', value);
  console.log('data', data);

  let lgType = name;
  const $kind = data?.$kind;
  if ($kind) {
    lgType = new LgType($kind, name).toString();
  }

  const lgName = new LgMetaData(lgType, designerId || '').toString();
  const lgFileId = `${currentDialog.lgFile}.${locale}`;
  const lgFile = lgFiles && lgFiles.find(file => file.id === lgFileId);

  const diagnostics = lgFile ? filterTemplateDiagnostics(lgFile, lgName) : [];

  const lgOption = {
    projectId,
    fileId: lgFileId,
    templateId: lgName,
  };

  const handleSettingsChange = (settings: Partial<CodeEditorSettings>) => {
    shellApi.updateUserSettings({ codeEditor: settings });
  };

  return (
    <React.Fragment>
      <FieldLabel id={id} label={label} description={description} helpLink={uiOptions?.helpLink} required={required} />
      <LgEditor
        height={225}
        value={lgBody}
        onChange={onChange}
        diagnostics={diagnostics}
        hidePlaceholder
        languageServer={{
          path: lspServerPath,
        }}
        lgOption={lgOption}
        editorSettings={userSettings.codeEditor}
        onChangeSettings={handleSettingsChange}
      />
    </React.Fragment>
  );
};

export { LgField };
