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

const VPropsPrefix = '_virtual_';
const VLUPropName = '_virtual_luis_name';
const VLUPropBody = '_virtual_luis_body';

const LGTemplateFields = ['prompt', 'unrecognizedPrompt', 'invalidPrompt', 'defaultValueResponse', 'activity']; // fields may contains lg

export const getVirtualLuis = (data): LuIntentSection => {
  return {
    Name: data[VLUPropName],
    Body: data[VLUPropBody],
  };
};

const setVPropsByField = (data, field, vPropValue) => {
  const propValue = data[field];
  const virtualField = `${VPropsPrefix}${field}`;
  data[virtualField] = propValue;
  data[field] = vPropValue;
};

const unsetVPropsByField = (data, field) => {
  const virtualField = `${VPropsPrefix}${field}`;
  const vPropValue = data[virtualField];
  delete data[virtualField];
  data[field] = vPropValue;
};

const setVirtualLuis = (data, name, body) => {
  data[VLUPropName] = name;
  data[VLUPropBody] = body;
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
    LGTemplateFields.forEach(field => {
      if (has(value, field)) {
        const lgName = getFeildLgRefName(value, field);
        value[field] = new LgTemplateRef(lgName).toString();
      }
    });
  }
};

export function VirtualDialogResource(
  dialog
): {
  lg: LgTemplate[];
  lu: LuIntentSection[];
} {
  const lg: LgTemplate[] = [];
  const lu: LuIntentSection[] = [];

  const visitor: VisitorFunc = (_path: string, value: any): boolean => {
    if (has(value, '$kind')) {
      const dialogItem = value;
      Object.keys(dialogItem).forEach(propName => {
        const propValue = dialogItem[propName];
        if (propValue) {
          if (LGTemplateFields.includes(propName)) {
            const lgName = getFeildLgRefName(dialogItem, propName); // TODO: double check with vPropValue
            const lgBody = propValue;
            const lgTemplate: LgTemplate = { name: lgName, body: lgBody, parameters: [] };
            lg.push(lgTemplate);
          }
        }
      });

      const luName = getContainsLuName(dialogItem);
      if (luName) {
        const luBody = dialogItem[VLUPropBody];
        const luIntent: LuIntentSection = { Name: luName, Body: luBody };
        lu.push(luIntent);
      }
    }
    return false;
  };
  JsonWalk('$', dialog, visitor);

  return {
    lg,
    lu,
  };
}

interface IResourceChanges {
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
}

export function DialogResourceChanges(dialog1, dialog2): IResourceChanges {
  const changes = {
    lg: {
      adds: [],
      deletes: [],
      updates: [],
    },
    lu: {
      adds: [],
      deletes: [],
      updates: [],
    },
  } as IResourceChanges;
  // find all in dialog1, treat as `adds`
  if (!dialog2) {
    const { lg, lu } = VirtualDialogResource(dialog1);
    changes.lg.adds === lg;
    changes.lu.adds === lu;
    return changes;
  }

  const { adds, deletes, updates } = DialogDiff(dialog1, dialog2);
  for (const item of updates) {
    const { lg, lu } = VirtualDialogResource(item.value);
    changes.lg.updates.push(...lg);
    changes.lu.updates.push(...lu);
  }

  for (const item of deletes) {
    const { lg, lu } = VirtualDialogResource(item.value);
    changes.lg.deletes.push(...lg.map(({ name }) => name));
    changes.lu.deletes.push(...lu.map(({ Name }) => Name));
  }

  for (const item of adds) {
    const { lg, lu } = VirtualDialogResource(item.value);
    changes.lg.adds.push(...lg);
    changes.lu.adds.push(...lu);
  }

  return changes;
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
        setVirtualLuis(value, luName, luBody);
      }
    }
    return false;
  };
  JsonWalk('$', deDialog, visitor);

  return deDialog;
}

export function DialogConverterReverse(dialog: {
  [key: string]: any;
}): {
  [key: string]: any;
} {
  const deDialog = cloneDeep(dialog);

  const visitor: VisitorFunc = (_path: string, value: any): boolean => {
    if (typeof value === 'object' && !Array.isArray(value)) {
      Object.keys(value).forEach(key => {
        if (LGTemplateFields.includes(key)) {
          unsetVPropsByField(value, key);
        } else if ([VLUPropName, VLUPropBody].includes(key)) {
          delete value[key];
        }
      });
      serilizeLgRefByDesignerId(value); // TODO: double check
    }
    return false;
  };
  JsonWalk('$', deDialog, visitor);

  return deDialog;
}
