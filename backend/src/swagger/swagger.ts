import swaggerJSDoc from 'swagger-jsdoc'
import { version } from '../../package.json'

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PRD Tool API',
      version,
      description: 'AI-powered Product Requirements Document collaboration platform API',
      contact: {
        name: 'PRD Tool Team',
        email: 'support@prdtool.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server'
      },
      {
        url: 'https://api.prdtool.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for authentication'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique user identifier'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            name: {
              type: 'string',
              description: 'User full name'
            },
            avatarUrl: {
              type: 'string',
              format: 'uri',
              nullable: true,
              description: 'User avatar image URL'
            },
            isActive: {
              type: 'boolean',
              description: 'Whether user account is active'
            },
            lastLoginAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Last login timestamp'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp'
            }
          }
        },
        UserWithStats: {
          allOf: [
            { $ref: '#/components/schemas/User' },
            {
              type: 'object',
              properties: {
                stats: {
                  type: 'object',
                  properties: {
                    prdsCreated: {
                      type: 'integer',
                      description: 'Number of PRDs created by user'
                    },
                    collaborations: {
                      type: 'integer',
                      description: 'Number of PRDs user collaborated on'
                    },
                    aiInteractions: {
                      type: 'integer',
                      description: 'Number of AI interactions'
                    }
                  }
                }
              }
            }
          ]
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              properties: {
                user: {
                  $ref: '#/components/schemas/User'
                },
                token: {
                  type: 'string',
                  description: 'JWT authentication token'
                }
              }
            },
            message: {
              type: 'string',
              example: 'Authentication successful'
            }
          }
        },
        UserProfileResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              properties: {
                user: {
                  $ref: '#/components/schemas/UserWithStats'
                }
              }
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'Error code identifier'
                },
                message: {
                  type: 'string',
                  description: 'Human-readable error message'
                }
              }
            }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'name', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            name: {
              type: 'string',
              minLength: 2,
              description: 'User full name'
            },
            password: {
              type: 'string',
              minLength: 8,
              description: 'User password (minimum 8 characters)'
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            password: {
              type: 'string',
              description: 'User password'
            }
          }
        },
        PRD: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique PRD identifier'
            },
            title: {
              type: 'string',
              description: 'PRD title'
            },
            description: {
              type: 'string',
              nullable: true,
              description: 'PRD description'
            },
            content: {
              type: 'string',
              description: 'PRD content in markdown format'
            },
            status: {
              type: 'string',
              enum: ['DRAFT', 'REVIEW', 'APPROVED', 'ARCHIVED'],
              description: 'PRD status'
            },
            isPublic: {
              type: 'boolean',
              description: 'Whether PRD is publicly visible'
            },
            tags: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'PRD tags for categorization'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            },
            author: {
              $ref: '#/components/schemas/User'
            }
          }
        },
        CreatePRDRequest: {
          type: 'object',
          required: ['title'],
          properties: {
            title: {
              type: 'string',
              minLength: 1,
              maxLength: 200,
              description: 'PRD title'
            },
            description: {
              type: 'string',
              description: 'PRD description'
            },
            content: {
              type: 'string',
              description: 'PRD content in markdown format'
            },
            template: {
              type: 'string',
              description: 'Template to use for PRD creation'
            },
            isPublic: {
              type: 'boolean',
              default: false,
              description: 'Whether PRD should be publicly visible'
            },
            tags: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Tags for categorization'
            }
          }
        },
        UpdatePRDRequest: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              minLength: 1,
              maxLength: 200,
              description: 'PRD title'
            },
            description: {
              type: 'string',
              description: 'PRD description'
            },
            content: {
              type: 'string',
              description: 'PRD content in markdown format'
            },
            status: {
              type: 'string',
              enum: ['DRAFT', 'REVIEW', 'APPROVED', 'ARCHIVED'],
              description: 'PRD status'
            },
            isPublic: {
              type: 'boolean',
              description: 'Whether PRD should be publicly visible'
            },
            tags: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Tags for categorization'
            }
          }
        },
        PRDListResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              properties: {
                prds: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/PRD'
                  }
                },
                pagination: {
                  type: 'object',
                  properties: {
                    page: {
                      type: 'integer',
                      description: 'Current page number'
                    },
                    limit: {
                      type: 'integer',
                      description: 'Items per page'
                    },
                    total: {
                      type: 'integer',
                      description: 'Total number of PRDs'
                    },
                    totalPages: {
                      type: 'integer',
                      description: 'Total number of pages'
                    }
                  }
                },
                filters: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      description: 'Applied status filter'
                    },
                    search: {
                      type: 'string',
                      description: 'Applied search term'
                    },
                    tags: {
                      type: 'array',
                      items: {
                        type: 'string'
                      },
                      description: 'Applied tag filters'
                    }
                  }
                }
              }
            }
          }
        },
        PRDResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              properties: {
                prd: {
                  $ref: '#/components/schemas/PRD'
                }
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './src/routes/*.ts',
    './src/routes/**/*.ts'
  ]
}

export const specs = swaggerJSDoc(options)