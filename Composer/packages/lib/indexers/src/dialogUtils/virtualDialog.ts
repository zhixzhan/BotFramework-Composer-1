// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import has from 'lodash/has';
import get from 'lodash/get';
import set from 'lodash/set';
import isEqual from 'lodash/isEqual';
import differenceWith from 'lodash/differenceWith';
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

export const VirtualLGPropName = '_virtual_lg';
export const VirtualLUPropName = '_virtual_lu';

const LGTemplateFields = ['prompt', 'unrecognizedPrompt', 'invalidPrompt', 'defaultValueResponse', 'activity']; // fields may contains lg
const LUIntentFields = ['intent']; // fields may contains lu
const LUSDKKinds = [
  SDKKinds.OnIntent,
  SDKKinds.ConfirmInput,
  SDKKinds.AttachmentInput,
  SDKKinds.ChoiceInput,
  SDKKinds.ConfirmInput,
  SDKKinds.DateTimeInput,
  SDKKinds.NumberInput,
  SDKKinds.TextInput,
];

export const getVirtualLuis = (data): LuIntentSection => {
  const { name: Name, body: Body } = get(data, VirtualLUPropName, {});
  return { Name, Body };
};

export const getVirtualLG = (data, field): string => {
  return get(data, [VirtualLGPropName, field]);
};

const setVirtualLG = (data, field, fieldValue) => {
  const virtualLGPropValue = data[VirtualLGPropName] || {};
  virtualLGPropValue[field] = fieldValue;
  data[VirtualLGPropName] = virtualLGPropValue;
};

const setVirtualLuis = (data, name, body) => {
  data[VirtualLUPropName] = {
    name,
    body,
  };
};

const unsetVirtualProps = data => {
  delete data[VirtualLGPropName];
  delete data[VirtualLUPropName];
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
  } else if (LUSDKKinds.includes($kind)) {
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
      const virtualLgItem = value[VirtualLGPropName];
      const virtualLuItem = value[VirtualLUPropName];
      if (virtualLgItem) {
        Object.keys(virtualLgItem).forEach(propName => {
          const propValue = virtualLgItem[propName];
          if (propValue) {
            if (LGTemplateFields.includes(propName)) {
              const lgName = getFeildLgRefName(dialogItem, propName); // TODO: double check with vPropValue
              const lgBody = propValue;
              const lgTemplate: LgTemplate = { name: lgName, body: lgBody, parameters: [] };
              lg.push(lgTemplate);
            }
          }
        });
      }

      if (virtualLuItem) {
        const luName = getContainsLuName(dialogItem);
        if (luName) {
          const { Body } = getVirtualLuis(dialogItem);
          const luIntent: LuIntentSection = { Name: luName, Body };
          lu.push(luIntent);
        }
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
    const { lg: prevLg, lu: prevLu } = VirtualDialogResource(item.preValue);
    const { lg: currLg, lu: currLu } = VirtualDialogResource(item.value);
    const lg = differenceWith(currLg, prevLg, isEqual);
    const lu = differenceWith(currLu, prevLu, isEqual);
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

  const vDialog = cloneDeep(dialog);
  const visitor: VisitorFunc = (_path: string, value: any): boolean => {
    // it's a valid schema dialog node.
    if (has(value, '$kind')) {
      const $kind = value.$kind;
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
            setVirtualLG(value, field, vPropValue);
          }
        });
      }

      if (luFile && LUSDKKinds.includes($kind)) {
        const luName = getContainsLuName(value);
        const luBody = luFile && luName && luFile.intents.find(t => t.Name === luName)?.Body; // else find in trigger
        setVirtualLuis(value, luName, luBody);
      }
    }
    return false;
  };
  JsonWalk('$', vDialog, visitor);

  return vDialog;
}

export function DialogConverterReverse(dialog: {
  [key: string]: any;
}): {
  [key: string]: any;
} {
  const vDialog = cloneDeep(dialog);

  const visitor: VisitorFunc = (_path: string, value: any): boolean => {
    if (typeof value === 'object' && !Array.isArray(value)) {
      Object.keys(value).forEach(key => {
        unsetVirtualProps(value);
      });
      serilizeLgRefByDesignerId(value); // TODO: double check
    }
    return false;
  };
  JsonWalk('$', vDialog, visitor);

  return vDialog;
}

const VirtualLG = {
  title: 'Virtual LG',
  description: '',
  $role: 'interface',
  type: 'object',
};

const VirtualLU = {
  title: 'Virtual LU',
  description: '',
  $role: 'interface',
  type: 'object',
};

export function VirtualSchemaConverter(schema: {
  [key: string]: any;
}): {
  [key: string]: any;
} {
  const vSchema = cloneDeep(schema);
  vSchema.definitions[SDKKinds.VirtualLG] = VirtualLG;
  vSchema.definitions[SDKKinds.VirtualLU] = VirtualLU;

  const vProperties: any[] = [];
  const visitor: VisitorFunc = (_path: string, value: any): boolean => {
    // extend sdk schema properties with virtual properties
    const properties = get(value, 'properties');
    if (properties && typeof properties === 'object') {
      const virtualLg: any = {};
      const virtualLu: any = {};
      const path = _path
        .replace(/^\$\.?/, '')
        .split(/[\[\]]/)
        .filter(p => !!p);
      for (const [propName, propValue] of Object.entries(properties)) {
        if (typeof propValue !== 'object') continue;

        if (LGTemplateFields.includes(propName)) {
          virtualLg[propName] = propValue;
        }

        if (LUIntentFields.includes(propName)) {
          virtualLu.name = { type: 'string', title: 'virtual lu name' };
          virtualLu.body = { type: 'string', title: 'virtual lu body' };
        }
      }

      if (Object.keys(virtualLg).length) {
        vProperties.push({
          path: [...path, 'properties', VirtualLGPropName],
          value: {
            properties: virtualLg,
            $kind: SDKKinds.VirtualLG,
            $ref: `#/definitions/${SDKKinds.VirtualLG}`,
          },
        });
      }
      if (Object.keys(virtualLu).length) {
        vProperties.push({
          path: [...path, 'properties', VirtualLUPropName],
          value: {
            properties: virtualLu,
            $kind: SDKKinds.VirtualLU,
            $ref: `#/definitions/${SDKKinds.VirtualLU}`,
          },
        });
      }

      // set(value, 'properties', properties);
    }
    return false;
  };
  JsonWalk('$', vSchema, visitor);

  for (const vProp of vProperties) {
    const { path, value } = vProp;
    set(vSchema, path, value);
  }

  return vSchema;
}
