// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import expressions from '@bfc/ui-plugin-expressions';
import selectDialog from '@bfc/ui-plugin-select-dialog';
import selectSkillDialog from '@bfc/ui-plugin-select-skill-dialog';
import prompts from '@bfc/ui-plugin-virtual-prompts';
import lg from '@bfc/ui-plugin-virtual-lg';
import lu from '@bfc/ui-plugin-virtual-luis';

export default [prompts, selectDialog, selectSkillDialog, lg, lu, expressions];
