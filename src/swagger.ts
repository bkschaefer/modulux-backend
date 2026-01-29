import swaggerJsdoc from 'swagger-jsdoc'

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Modulux CMS API Documentation',
      version: '1.0.0',
      description: 'API documentation for the Modulux CMS backend service',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Application: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              format: 'mongoId',
            },
            url: {
              type: 'string',
              format: 'uri',
            },
            name: {
              type: 'string',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        AssignRolesRequest: {
          type: 'object',
          required: ['roles'],
          properties: {
            roles: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['users', 'collections', 'invites'],
              },
            },
          },
        },
        AuthLoginRequest: {
          type: 'object',
          required: ['password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
            },
            userName: {
              type: 'string',
            },
            password: {
              type: 'string',
              format: 'password',
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
            },
            user: {
              $ref: '#/components/schemas/User',
            },
          },
        },
        ChangePasswordRequest: {
          type: 'object',
          required: ['currentPassword', 'newPassword'],
          properties: {
            currentPassword: {
              type: 'string',
            },
            newPassword: {
              type: 'string',
              format: 'password',
            },
          },
        },
        CreateInviteRequest: {
          type: 'object',
          required: ['email', 'id'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
            },
            id: {
              type: 'string',
              format: 'mongoId',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
            },
          },
        },
        InviteResponse: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              format: 'email',
            },
            token: {
              type: 'string',
              format: 'uuid',
            },
            createdBy: {
              type: 'string',
            },
            expiresAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
            },
            password: {
              type: 'string',
              format: 'password',
            },
          },
        },
        PasswordChangeRequest: {
          type: 'object',
          required: ['token', 'newPassword'],
          properties: {
            token: {
              type: 'string',
              format: 'uuid',
            },
            newPassword: {
              type: 'string',
              format: 'password',
              minLength: 5,
              maxLength: 50,
            },
          },
        },
        PasswordResetRequest: {
          type: 'object',
          required: ['userNameOrEmail'],
          properties: {
            userNameOrEmail: {
              type: 'string',
            },
          },
        },
        PasswordResetResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
            },
            data: {
              type: 'object',
            },
          },
        },
        PasswordResetVerifyResponse: {
          type: 'object',
          properties: {
            isValid: {
              type: 'boolean',
            },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
            },
            password: {
              type: 'string',
              format: 'password',
            },
          },
        },
        UpdateUserRequest: {
          type: 'object',
          properties: {
            userName: {
              type: 'string',
              minLength: 2,
              maxLength: 50,
            },
            email: {
              type: 'string',
              format: 'email',
              minLength: 2,
              maxLength: 75,
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            password: {
              type: 'string',
              format: 'password',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        UserResponse: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              format: 'uuid',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            userName: {
              type: 'string',
            },
            admin: {
              type: 'boolean',
            },
            roles: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['users', 'collections', 'invites'],
              },
            },
            exp: {
              type: 'number',
            },
          },
        },
        TCollectionResource: {
          type: 'object',
          required: ['schema', 'entries'],
          properties: {
            schema: {
              $ref: '#/components/schemas/TSchemaResource',
            },
            entries: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/TEntryResource',
              },
            },
          },
        },
        TEntryResource: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              format: 'mongoId',
              description: 'Unique identifier for the entry',
            },
          },
          additionalProperties: true,
          description: 'Dynamic entry object with fields based on schema',
        },
        TField: {
          type: 'object',
          required: ['name', 'label', 'fieldType', 'settings'],
          properties: {
            name: {
              type: 'string',
              description: 'Field identifier',
            },
            label: {
              type: 'string',
              description: 'Display label for the field',
            },
            fieldType: {
              type: 'string',
              enum: [
                'TextField',
                'NumberField',
                'BooleanField',
                'OptionField',
                'FieldArray',
                'ImageField',
                'CompositeField',
                'RichTextField',
              ],
            },
            settings: {
              type: 'object',
              properties: {
                dataTable: {
                  type: 'object',
                  properties: {
                    visible: {
                      type: 'boolean',
                      description: 'Whether the field is visible in data table',
                    },
                    columnWidth: {
                      type: 'number',
                      description: 'Width of the column in data table',
                    },
                  },
                },
              },
            },
            required: {
              type: 'boolean',
              description: 'Whether the field is required',
            },
          },
        },
        TImageObject: {
          type: 'object',
          required: ['originalName', 'key', 'size'],
          properties: {
            originalName: {
              type: 'string',
              description: 'Original filename of the image',
            },
            key: {
              type: 'string',
              description: 'Storage key of the image',
            },
            size: {
              type: 'number',
              description: 'Size of the image in bytes',
            },
          },
        },
        TSchemaResource: {
          type: 'object',
          required: ['name', 'title', 'fields'],
          properties: {
            name: {
              type: 'string',
              description: 'Unique identifier for the collection',
            },
            title: {
              type: 'string',
              description: 'Display title for the collection',
            },
            settings: {
              type: 'object',
              properties: {
                dataTable: {
                  type: 'object',
                  properties: {
                    entriesPerPage: {
                      type: 'number',
                      description: 'Number of entries to display per page',
                    },
                  },
                },
              },
            },
            fields: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/TField',
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Auth',
        description: 'Authentication endpoints',
      },
      {
        name: 'Users',
        description: 'User management endpoints',
      },
      {
        name: 'Collections',
        description: 'Collection management endpoints',
      },
      {
        name: 'Entries',
        description: 'Entry management within collections',
      },
      {
        name: 'Schema',
        description: 'Schema management for collections',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/routes/**/*.ts'],
}

const swaggerSpec = swaggerJsdoc(options)

export default swaggerSpec
