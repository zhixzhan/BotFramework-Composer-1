// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import has from 'lodash/has';
import get from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';
import {
  extractLgTemplateRefs,
  SDKKinds,
  LgType,
  LgTemplate,
  LgMetaData,
  LuIntentSection,
  LgTemplateRef,
  LuType,
  LuMetaData,
} from '@bfc/shared';

import { JsonWalk, VisitorFunc } from '../utils/jsonWalk';
import { getBaseName } from '../utils/help';

import { DialogDiff } from './dialogDiff';

export const VPropsPrefix = '_virtual_';
export const VLUPropName = '_virtual_luis_name';
export const VLUPropBody = '_virtual_luis_body';

export const LGTemplateFields = ['prompt', 'unrecognizedPrompt', 'invalidPrompt', 'defaultValueResponse', 'activity']; // fields may contains lg
export const LUIntentFields = ['intent']; // fields aby contains lu, TODO: more fields

export const getVPropsByField = (data, field) => {
  const virtualField = `${VPropsPrefix}${field}`;
  return data[virtualField];
};

/**
 *
 * @param data
 * @param field
 * @param vPropValue
 *
 * {
 *   activity: '${SendActivity_12345}'
 * }
 *  swap prop value =>
 *
 * {
 *   activity: '- hello'
 *   _virtual_activity: '${SendActivity_12345}'
 * }
 *
 */
export const setVPropsByField = (data, field, vPropValue) => {
  const propValue = data[field];
  const virtualField = `${VPropsPrefix}${field}`;
  data[virtualField] = propValue;
  data[field] = vPropValue;
};

export const unsetVPropsByField = (data, field) => {
  const virtualField = `${VPropsPrefix}${field}`;
  const vPropValue = data[virtualField];
  delete data[virtualField];
  data[field] = vPropValue;
};

const getFeildLgRefName = (data, field): string => {
  const $kind = data?.$kind;
  const designerId = get(data, '$designer.id');
  if (!$kind || !designerId) return '';
  const lgType = new LgType($kind, field).toString();
  return new LgMetaData(lgType, designerId).toString();
};

const getContainsLuName = (data): string | undefined => {
  const $kind = data?.$kind;
  const designerId = get(data, '$designer.id');
  if (!$kind || !designerId) return;

  if ($kind === SDKKinds.OnIntent) {
    return data.intent;
  } else if ($kind === SDKKinds.TextInput) {
    const relatedLuIntentType = new LuType($kind).toString();
    return new LuMetaData(relatedLuIntentType, designerId).toString();
  }
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
 *   activity: "- hi ${sdfsdf} ${sfsdf_123145}"
//  *   _virtual_activity: "${SendActivity_003038()}"
 * }
 *
 * @param dialog2
 * {
 *   $designer: {id: "003038"}
 *   $kind: "Microsoft.SendActivity"
 *   activity: "- hi, updated!"
 *   _virtual_activity: "${SendActivity_003038()}"
 * }
 *
 * => lg.updates: [{ SendActivity_003038: "- hi, updated!" }]
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
    const propName = patharr.pop() || '';
    const nodePath = patharr.join('.');
    const propValue = item.value;
    // const vPropName = `${VPropsPrefix}${propName}`;
    // const vPropValue = get(dialog2, `${nodePath}.${vPropName}`);
    const dialogItem = get(dialog2, nodePath);

    if (LGTemplateFields.includes(propName)) {
      const lgName = getFeildLgRefName(dialogItem, propName); // or extract from vPropValue
      const lgBody = propValue;
      const lgTemplate: LgTemplate = { name: lgName, body: lgBody, parameters: [] };
      updateTemplates.push(lgTemplate);
    }
    // TODO: acctually current not handle lu update
    // else if (LUIntentFields.includes(propName)) {
    //   const luName = dialogItem[VLUPropName];
    //   const luBody = propValue;
    //   const luIntent: LuIntentSection = { Name: luName, Body: luBody };
    //   updateIntents.push(luIntent);
    // }
  }

  for (const item of deletes) {
    const dialogItem = item.value;
    Object.keys(dialogItem).forEach(propName => {
      if (LGTemplateFields.includes(propName)) {
        const lgName = getFeildLgRefName(dialogItem, propName); // or extract from vPropValue
        deleteTemplateNames.push(lgName);
      }
    });

    const luName = getContainsLuName(dialogItem);
    if (luName) {
      deleteLuIntentNames.push(luName);
    }
  }

  // create lg template if added dialog node needs
  for (const item of adds) {
    const dialogItem = item.value;

    Object.keys(dialogItem).forEach(propName => {
      const propValue = dialogItem[propName];
      if (propValue) {
        if (LGTemplateFields.includes(propName)) {
          const kind = dialogItem.$kind;
          const designerId = get(dialogItem, '$designer.id');
          const lgType = new LgType(kind, propName).toString();
          const lgName = new LgMetaData(lgType, designerId || '').toString();
          const lgBody = propValue;
          const lgTemplate: LgTemplate = { name: lgName, body: lgBody, parameters: [] };
          addTemplates.push(lgTemplate);
        }
      }
    });

    const luName = getContainsLuName(dialogItem);
    if (luName) {
      const luBody = dialogItem[VLUPropBody];
      const luIntent: LuIntentSection = { Name: luName, Body: luBody };
      addIntents.push(luIntent);
    }
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
            let vPropValue = '- ';
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
        const luName = getContainsLuName(value);
        const luBody = luFile && luName && luFile.intents.find(t => t.Name === luName)?.Body; // else find in trigger
        value[VLUPropName] = luName;
        value[VLUPropBody] = luBody;
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
        if (LGTemplateFields.includes(key)) {
          unsetVPropsByField(value, key);
        } else if ([VLUPropName, VLUPropBody].includes(key)) {
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
