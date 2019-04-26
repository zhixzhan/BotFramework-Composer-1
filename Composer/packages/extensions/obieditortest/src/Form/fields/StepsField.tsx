import React from 'react';
import formatMessage from 'format-message';
import { FieldProps } from 'react-jsonschema-form';

import { TableField } from './TableField';

const renderTitle = item => item.$type || formatMessage('New Step');

export const StepsField: React.FC<FieldProps> = props => {
  return (
    <TableField
      {...props}
      defaultItem={{ $type: 'Microsoft.SendActivity' }}
      filterNewOptions={item => !item.includes('Rule')}
      label={formatMessage('Add New Step')}
      navPrefix="steps"
      renderTitle={renderTitle}
    />
  );
};