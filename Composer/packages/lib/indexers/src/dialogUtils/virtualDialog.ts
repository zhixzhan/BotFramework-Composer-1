// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import has from 'lodash/has';
import get from 'lodash/get';
import set from 'lodash/set';
import cloneDeep from 'lodash/cloneDeep';
import {
  extractLgTemplateRefs,
  SDKKinds,
  LgType,
  LgTemplate,
  LgMetaData,
  LuIntentSection,
  LgTemplateRef,
} from '@bfc/shared';

import { JsonWalk, VisitorFunc } from '../utils/jsonWalk';
import { getBaseName } from '../utils/help';

import { DialogDiff } from './dialogDiff';
import { ExtractLgTemplates, ExtractLuIntents } from './extractResources';

export const VPropsPrefix = '_virtual_';

export const LGTemplateFields = ['prompt', 'unrecognizedPrompt', 'invalidPrompt', 'defaultValueResponse', 'activity']; // fields may contains lg
export const LUIntentFields = ['intent']; // fields aby contains lu, TODO: more fields

const VirtualLGFields = LGTemplateFields.map(f => `${VPropsPrefix}${f}`);
const VirtualLUFields = LUIntentFields.map(f => `${VPropsPrefix}${f}`);

export const getVPropsByField = (data, field) => {
  const virtualField = `${VPropsPrefix}${field}`;
  return data[virtualField];
};

export const setVPropsByField = (data, field, fieldValue) => {
  const virtualField = `${VPropsPrefix}${field}`;
  data[virtualField] = fieldValue;
  return data;
};

const getFeildLgRefName = (data, field): string => {
  const $kind = data?.$kind;
  const designerId = get(data, '$designer.id');
  if (!$kind || !designerId) return '';
  const lgType = new LgType($kind, field).toString();
  return new LgMetaData(lgType, designerId).toString();
};

const serilizeLgRefByDesignerId = value => {
  if (has(value, '$kind')) {
    // serilize lg ref
    LGTemplateFields.forEach(field => {
      if (has(value, field)) {
        const lgName = getFeildLgRefName(value, field);
        value[field] = new LgTemplateRef(lgName).toString();
      }
    });
  }
};

// const getFeildLuRefName = (data, field): string => {
//   const $kind = data?.$kind;
//   const designerId = get(data, '$designer.id');
//   if (!$kind || !designerId) return '';
//   const lgType = new LgType($kind, field).toString();
//   return new LgMetaData(lgType, designerId).toString();
// };

/**
 * compare two dialog node, find virtual property changes in it.
 * @param dialog1
 * {
 *   $designer: {id: "003038"}
 *   $kind: "Microsoft.SendActivity"
 *   activity: "${SendActivity_003038()}"
 *   _virtual_activity: "- hi"
 * }
 *
 * @param dialog2
 * {
 *   $designer: {id: "003038"}
 *   $kind: "Microsoft.SendActivity"
 *   activity: "${SendActivity_003038()}"
 *   _virtual_activity: "- hi, updated!"
 * }
 *
 * => update lg: [{ SendActivity_003038: "- hi, updated!" }]
 */

export function DialogResourceChanges(
  dialog1,
  dialog2
): {
  lg: {
    adds: LgTemplate[];
    deletes: string[];
    updates: LgTemplate[];
  };
  lu: {
    adds: LuIntentSection[];
    deletes: string[];
    updates: LuIntentSection[];
  };
} {
  const diffs = DialogDiff(dialog1, dialog2);
  const { adds, deletes, updates } = diffs;
  const deleteTemplateNames: string[] = []; // lg need to delete
  const deleteLuIntentNames: string[] = []; // lu need to delete

  const addTemplates: LgTemplate[] = []; // lg need to add
  const addIntents: LuIntentSection[] = []; // lu need to add

  const updateTemplates: LgTemplate[] = []; // lg need to update
  const updateIntents: LuIntentSection[] = []; // lu need to update

  for (const item of updates) {
    const patharr = item.path.split('.');
    patharr.shift();
    const vPropName = patharr.pop() || '';
    const nodePath = patharr.join('.');
    // eslint-disable-next-line security/detect-non-literal-regexp
    const propName = vPropName.replace(new RegExp(`^${VPropsPrefix}`), '');
    const propValue = get(dialog2, `${nodePath}.${propName}`);
    const vPropValue = item.value;

    if (VirtualLGFields.includes(vPropName)) {
      const lgTemplateRef = extractLgTemplateRefs(propValue);
      let lgName = '';
      if (lgTemplateRef.length === 0) {
        const dialogItem = get(dialog2, nodePath);
        lgName = getFeildLgRefName(dialogItem, propName);
      }

      // length 0 means activity is initial value, havent slot with ${SendActivity_12355},
      if (lgTemplateRef.length === 1) {
        lgName = lgTemplateRef[0].name;
      }

      const lgBody = vPropValue;
      const lgTemplate: LgTemplate = { name: lgName, body: lgBody, parameters: [] };
      updateTemplates.push(lgTemplate);
    } else if (VirtualLUFields.includes(vPropName)) {
      const luName = propValue;
      const luBody = vPropValue;
      const luIntent: LuIntentSection = { Name: luName, Body: luBody };
      updateIntents.push(luIntent);
    }
  }

  for (const item of deletes) {
    deleteTemplateNames.push(...ExtractLgTemplates('', item.value).map(({ name }) => name)); // if delete dialog node, delete lg template it contains
    deleteLuIntentNames.push(...ExtractLuIntents('', item.value).map(({ name }) => name)); // if delete dialog node, delete lu intent it contains
  }

  // create lg template if added dialog node needs
  for (const item of adds) {
    const dialogItem = item.value;
    const kind = item.value.$kind;
    const designerId = get(item.value, '$designer.id');

    Object.keys(dialogItem).forEach(propName => {
      const propValue = dialogItem[propName];
      const vPropValue = getVPropsByField(dialogItem, propName);
      if (vPropValue) {
        if (LGTemplateFields.includes(propName)) {
          const lgType = new LgType(kind, '').toString();
          const lgName = new LgMetaData(lgType, designerId || '').toString();
          const lgBody = vPropValue;
          const lgTemplate: LgTemplate = { name: lgName, body: lgBody, parameters: [] };
          addTemplates.push(lgTemplate);
        } else if (LUIntentFields.includes(propName)) {
          const luName = propValue;
          const luBody = vPropValue;
          const luIntent: LuIntentSection = { Name: luName, Body: luBody };
          addIntents.push(luIntent);
        }
      }
    });
  }

  return {
    lg: {
      adds: addTemplates,
      deletes: deleteTemplateNames,
      updates: updateTemplates,
    },
    lu: {
      adds: addIntents,
      deletes: deleteLuIntentNames,
      updates: updateIntents,
    },
  };
}

export function DialogConverter(
  dialog: {
    [key: string]: any;
  },
  lgFileResolver,
  luFileResolver
): {
  [key: string]: any;
} {
  const luFileName = typeof dialog.recognizer === 'string' ? dialog.recognizer : '';
  const lgFileName = typeof dialog.generator === 'string' ? dialog.generator : '';
  const luFileId = getBaseName(luFileName, '.lu');
  const lgFileId = getBaseName(lgFileName, '.lg');

  const lgFile = lgFileResolver(lgFileId);
  const luFile = luFileResolver(luFileId);

  const deDialog = cloneDeep(dialog);
  /**
   *
   * @param path , jsonPath string
   * @param value , current node value    *
   * @return boolean, true to stop walk    */
  const visitor: VisitorFunc = (_path: string, value: any): boolean => {
    // it's a valid schema dialog node.
    if (has(value, '$kind')) {
      if (lgFile) {
        // find lg templates in [prop], add _virtial_[prop]
        LGTemplateFields.forEach(field => {
          if (has(value, field)) {
            const propValue = value[field];
            let vPropValue = '';
            let lgName = '';
            const lgTemplateRef = extractLgTemplateRefs(propValue);

            // activity: '' is empty, slot default
            if (lgTemplateRef.length === 0) {
              lgName = getFeildLgRefName(value, field);
              value[field] = new LgTemplateRef(lgName).toString();
            }
            // activity: "${SendActivity_34235}"
            else if (lgTemplateRef.length === 1) {
              lgName = lgTemplateRef[0].name;
            }

            const lgTemplate = lgFile.templates.find(t => t.name === lgName);
            // refered lg is in same name lg File.
            if (lgTemplate) {
              vPropValue = lgTemplate.body;
            }
            setVPropsByField(value, field, vPropValue);
          }
        });
      }

      if (luFile) {
        // find lu
        if (value.$kind === SDKKinds.OnIntent) {
          const field = 'intent';
          const intentName = value[field];
          const intent = luFile ? luFile.intents.find(t => t.Name === intentName) : undefined; // else find in trigger
          if (intent) {
            setVPropsByField(value, field, intent.Body);
          }
        }
      }
    }
    return false;
  };
  JsonWalk('$', deDialog, visitor);

  return deDialog;
}

/**
 *
 * @param dialog
 * 1. remove vProps
 * 2. serilize ref: ${SendActivity-designerId}
 *
 */
export function DialogConverterReverse(dialog: {
  [key: string]: any;
}): {
  [key: string]: any;
} {
  const deDialog = cloneDeep(dialog);
  /**
   *
   * @param path , jsonPath string
   * @param value , current node value    *
   * @return boolean, true to stop walk    */
  const visitor: VisitorFunc = (_path: string, value: any): boolean => {
    // it's a valid schema dialog node.

    if (typeof value === 'object' && !Array.isArray(value)) {
      Object.keys(value).forEach(key => {
        if (key.startsWith(VPropsPrefix)) {
          delete value[key];
        }
      });
      serilizeLgRefByDesignerId(value);
    }
    return false;
  };
  JsonWalk('$', deDialog, visitor);

  return deDialog;
}

const IActivityVirtualTemplate = {
  title: 'Microsoft ActivityTemplates',
  description:
    'Components which are ActivityTemplate, which is string template, an activity, or a implementation of ActivityTemplate',
  $role: 'interface',
  oneOf: [
    {
      type: 'string',
    },
  ],
};

export function VirtualSchemaConverter(schema: {
  [key: string]: any;
}): {
  [key: string]: any;
} {
  const deSchema = cloneDeep(schema);
  deSchema.definitions[SDKKinds.IActivityVirtualTemplate] = IActivityVirtualTemplate;
  /**
   *
   * @param path , jsonPath string
   * @param value , current node value    *
   * @return boolean, true to stop walk    */
  const visitor: VisitorFunc = (_path: string, value: any): boolean => {
    // extend sdk schema properties with virtual properties
    const properties = get(value, 'properties');
    if (properties && typeof properties === 'object') {
      const vProperties: any = [];

      for (const [propName, propValue] of Object.entries(properties)) {
        if (typeof propValue !== 'object') continue;

        if (LGTemplateFields.includes(propName)) {
          const vPropName = `${VPropsPrefix}${propName}`;
          const vPropValue = {
            ...propValue,
            $kind: SDKKinds.IActivityVirtualTemplate,
            $ref: `#/definitions/${SDKKinds.IActivityVirtualTemplate}`,
          };
          vProperties.push({ vPropName, vPropValue });
        }
      }

      for (const { vPropName, vPropValue } of vProperties) {
        set(properties, vPropName, vPropValue);
      }

      set(value, 'properties', properties);
    }
    return false;
  };
  JsonWalk('$', deSchema, visitor);

  return deSchema;
}
