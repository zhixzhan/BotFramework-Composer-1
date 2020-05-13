// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Template } from 'botbuilder-lg';

export function normalizeLgBody(text: string): string {
  const templateTexts = text.split('\n').map(line => (line.startsWith('-') ? line.substring(1) : line));
  let showText = '';

  if (templateTexts[0] && templateTexts[0].trim() === '[Activity') {
    showText = templateTexts.find(text => text.includes('Text = '))?.split('Text = ')[1] || '';
  } else {
    showText = templateTexts.join('\n');
  }
  return showText;
}

export function normalizeLgTemplate(template: Template): string {
  return normalizeLgBody(template.body);
}
