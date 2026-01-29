import { validator } from '@exodus/schemasafe'

export const schemaValidator = validator(
  {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    definitions: {
      IField: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          label: { type: 'string' },
          settings: {
            type: 'object',
            properties: {
              dataTable: {
                type: 'object',
                properties: {
                  visible: { type: 'boolean' },
                  columnWidth: { type: 'number' },
                },
                additionalProperties: false,
              },
              upload: {
                type: 'object',
                properties: {
                  maxSize: { type: 'number' },
                  allowedTypes: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                  maxFiles: { type: 'number' },
                },
                additionalProperties: false,
              },
            },
            additionalProperties: false,
          },
          fieldType: {
            type: 'string',
            enum: [
              'TextField',
              'NumberField',
              'BooleanField',
              'OptionField',
              'FieldArray',
              'CompositeField',
              'ImageField',
              'RichTextField',
            ],
          },
          required: { type: 'boolean' },
          readOnly: { type: 'boolean' },
        },
        required: ['name', 'label', 'fieldType'],
      },
      ITextField: {
        unevaluatedProperties: false,
        allOf: [
          { $ref: '#/definitions/IField' },
          {
            type: 'object',
            properties: {
              fieldType: { const: 'TextField' },
              defaultValue: { type: 'string' },
              pattern: { type: 'string' },
              maxLength: { type: 'integer' },
              minLength: { type: 'integer' },
            },
          },
        ],
      },
      INumberField: {
        unevaluatedProperties: false,
        allOf: [
          { $ref: '#/definitions/IField' },
          {
            type: 'object',
            properties: {
              fieldType: { const: 'NumberField' },
              defaultValue: { type: 'number' },
              min: { type: 'number' },
              max: { type: 'number' },
            },
          },
        ],
      },
      IBooleanField: {
        unevaluatedProperties: false,
        allOf: [
          { $ref: '#/definitions/IField' },
          {
            type: 'object',
            properties: {
              fieldType: { const: 'BooleanField' },
              defaultValue: { type: 'boolean' },
            },
          },
        ],
      },
      IOptionField: {
        unevaluatedProperties: false,
        allOf: [
          { $ref: '#/definitions/IField' },
          {
            type: 'object',
            properties: {
              fieldType: { const: 'OptionField' },
              options: {
                type: 'array',
                items: { type: 'string' },
              },
              defaultSelected: { type: 'integer' },
            },
            required: ['options'],
          },
        ],
      },
      ICompositeField: {
        unevaluatedProperties: false,
        allOf: [
          { $ref: '#/definitions/IField' },
          {
            type: 'object',
            properties: {
              fieldType: { const: 'CompositeField' },
              fields: {
                type: 'array',
                items: {
                  oneOf: [
                    { $ref: '#/definitions/ITextField' },
                    { $ref: '#/definitions/INumberField' },
                    { $ref: '#/definitions/IBooleanField' },
                    { $ref: '#/definitions/IOptionField' },
                    { $ref: '#/definitions/IImageField' },
                    { $ref: '#/definitions/IRichTextField' },
                  ],
                },
              },
            },
            required: ['fields'],
          },
        ],
      },
      IFieldArray: {
        unevaluatedProperties: false,
        allOf: [
          { $ref: '#/definitions/IField' },
          {
            type: 'object',
            properties: {
              fieldType: { const: 'FieldArray' },
              field: {
                oneOf: [
                  { $ref: '#/definitions/ITextField' },
                  { $ref: '#/definitions/INumberField' },
                  { $ref: '#/definitions/IBooleanField' },
                  { $ref: '#/definitions/IOptionField' },
                  { $ref: '#/definitions/ICompositeField' },
                  { $ref: '#/definitions/IImageField' },
                  { $ref: '#/definitions/IRichTextField' },
                ],
              },
            },
            // required: ["field"],
          },
        ],
      },
      IImageField: {
        unevaluatedProperties: false,
        allOf: [
          { $ref: '#/definitions/IField' },
          {
            type: 'object',
            properties: {
              fieldType: { const: 'ImageField' },
              //defaultValue: { type: "string" },
              minLength: { type: 'integer' },
              maxLength: { type: 'integer' },
            },
          },
        ],
      },
      IRichTextField: {
        unevaluatedProperties: false,
        allOf: [
          { $ref: '#/definitions/IField' },
          {
            type: 'object',
            properties: {
              fieldType: { const: 'RichTextField' },
              //defaultValue: { type: "string" },
            },
          },
        ],
      },
    },
    type: 'object',
    properties: {
      title: { type: 'string' },
      name: { type: 'string' },
      description: { type: 'string' },
      creator: { type: 'string' },
      settings: {
        type: 'object',
        properties: {
          dataTable: {
            type: 'object',
            properties: {
              entriesPerPage: { type: 'integer' },
            },
            additionalProperties: false,
          },
        },
        additionalProperties: false,
      },
      fields: {
        type: 'array',
        minItems: 0,
        items: {
          oneOf: [
            { $ref: '#/definitions/ITextField' },
            { $ref: '#/definitions/INumberField' },
            { $ref: '#/definitions/IBooleanField' },
            { $ref: '#/definitions/IOptionField' },
            { $ref: '#/definitions/ICompositeField' },
            { $ref: '#/definitions/IFieldArray' },
            { $ref: '#/definitions/IRichTextField' },
            { $ref: '#/definitions/IImageField' },
          ],
        },
      },
    },
    required: ['name', 'fields'],
    additionalProperties: false,
  },
  { includeErrors: true, allErrors: true },
)
