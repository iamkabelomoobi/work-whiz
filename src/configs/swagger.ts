import swaggerJSDoc from 'swagger-jsdoc';

export const swaggerOptions: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Work Whiz API',
      version: '1.0.0',
      description:
        'API documentation for Work Whiz authentication, GraphQL profile management, and other modules',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'better-auth.session_token',
          description:
            'Better Auth session cookie returned by /api/auth/sign-in/email.',
        },
      },
      schemas: {
        AuthUser: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Candidate User' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string', example: '+27821234567' },
            role: {
              type: 'string',
              enum: ['candidate', 'employer', 'admin'],
              example: 'candidate',
            },
            emailVerified: { type: 'boolean' },
            isVerified: { type: 'boolean' },
            isActive: { type: 'boolean' },
            isLocked: { type: 'boolean' },
          },
        },
        CandidateProfile: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string', example: 'Mr' },
            skills: {
              type: 'array',
              items: { type: 'string' },
              example: ['typescript', 'graphql'],
            },
            isEmployed: { type: 'boolean', example: true },
            userId: { type: 'string', format: 'uuid' },
            user: { $ref: '#/components/schemas/AuthUser' },
          },
        },
        EmployerProfile: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            industry: { type: 'string', example: 'Technology' },
            websiteUrl: {
              type: 'string',
              format: 'uri',
              example: 'https://example.com',
            },
            location: { type: 'string', example: 'Remote' },
            description: { type: 'string', example: 'Test employer' },
            size: { type: 'integer', example: 25 },
            foundedIn: { type: 'integer', example: 2020 },
            isVerified: { type: 'boolean' },
            userId: { type: 'string', format: 'uuid' },
            user: { $ref: '#/components/schemas/AuthUser' },
          },
        },
        AdminProfile: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            permissions: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['READ', 'WRITE', 'DELETE'],
              },
            },
            userId: { type: 'string', format: 'uuid' },
            user: { $ref: '#/components/schemas/AuthUser' },
          },
        },
        GraphQLRequest: {
          type: 'object',
          required: ['query'],
          properties: {
            query: {
              type: 'string',
              description: 'GraphQL operation document.',
            },
            variables: {
              type: 'object',
              additionalProperties: true,
            },
          },
        },
        GraphQLResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              nullable: true,
              additionalProperties: true,
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  message: { type: 'string' },
                  extensions: {
                    type: 'object',
                    additionalProperties: true,
                  },
                },
              },
            },
          },
        },
        MessageResponse: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
        SignUpEmailRequest: {
          type: 'object',
          required: ['name', 'email', 'password', 'phone', 'role'],
          properties: {
            name: { type: 'string', example: 'Candidate User' },
            email: {
              type: 'string',
              format: 'email',
              example: 'candidate@example.com',
            },
            password: {
              type: 'string',
              format: 'password',
              example: 'AuthTest!12345',
            },
            phone: { type: 'string', example: '+27821234567' },
            role: {
              type: 'string',
              enum: ['candidate', 'employer'],
              example: 'candidate',
              description:
                'Admin users cannot be created through public sign up.',
            },
            title: {
              type: 'string',
              example: 'Mr',
              description: 'Candidate profile field.',
            },
            industry: {
              type: 'string',
              example: 'Technology',
              description: 'Employer profile field.',
            },
            websiteUrl: {
              type: 'string',
              format: 'uri',
              example: 'https://example.com',
            },
            location: { type: 'string', example: 'Remote' },
            description: { type: 'string', example: 'Test employer' },
            size: { type: 'integer', example: 25 },
            foundedIn: { type: 'integer', example: 2020 },
          },
        },
        SignInEmailRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'candidate@example.com',
            },
            password: {
              type: 'string',
              format: 'password',
              example: 'AuthTest!12345',
            },
          },
        },
        RequestPasswordResetRequest: {
          type: 'object',
          required: ['email'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'candidate@example.com',
            },
            redirectTo: {
              type: 'string',
              format: 'uri',
              example: 'http://localhost:4200/reset-password',
            },
          },
        },
        ResetPasswordRequest: {
          type: 'object',
          required: ['token', 'newPassword'],
          properties: {
            token: { type: 'string' },
            newPassword: {
              type: 'string',
              format: 'password',
              example: 'AuthTest!67890',
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      {
        name: 'Authentication',
        description:
          'Better Auth HTTP endpoints. These remain REST-style because Better Auth owns the auth protocol.',
      },
      {
        name: 'GraphQL Profile Management',
        description:
          'GraphQL profile operations for candidate, employer, admin, and shared user account management.',
      },
    ],
    paths: {
      '/api/auth/sign-up/email': {
        post: {
          tags: ['Authentication'],
          summary: 'Sign up with email and password',
          description:
            'Creates a Better Auth user and creates a candidate or employer profile from the role-specific fields.',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SignUpEmailRequest' },
                examples: {
                  candidate: {
                    summary: 'Candidate sign up',
                    value: {
                      name: 'Candidate User',
                      email: 'candidate@example.com',
                      password: 'AuthTest!12345',
                      phone: '+27821234567',
                      role: 'candidate',
                      title: 'Mr',
                    },
                  },
                  employer: {
                    summary: 'Employer sign up',
                    value: {
                      name: 'Employer User',
                      email: 'employer@example.com',
                      password: 'AuthTest!12345',
                      phone: '+27821234568',
                      role: 'employer',
                      industry: 'Technology',
                      websiteUrl: 'https://example.com',
                      location: 'Remote',
                      description: 'Hiring software engineers',
                      size: 25,
                      foundedIn: 2020,
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description:
                'Sign up accepted. Email verification is required before sign in.',
            },
            '400': { description: 'Invalid request body.' },
          },
        },
      },
      '/api/auth/sign-in/email': {
        post: {
          tags: ['Authentication'],
          summary: 'Sign in with email and password',
          description:
            'Returns Better Auth session cookies used by authenticated GraphQL profile operations.',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SignInEmailRequest' },
              },
            },
          },
          responses: {
            '200': {
              description:
                'Signed in. The response sets the Better Auth session cookie.',
              headers: {
                'Set-Cookie': {
                  description: 'Better Auth session cookie.',
                  schema: { type: 'string' },
                },
              },
            },
            '401': { description: 'Invalid credentials or unverified email.' },
          },
        },
      },
      '/api/auth/sign-out': {
        post: {
          tags: ['Authentication'],
          summary: 'Sign out current session',
          security: [{ cookieAuth: [] }],
          responses: {
            '200': { description: 'Signed out.' },
            '401': { description: 'No active session.' },
          },
        },
      },
      '/api/auth/verify-email': {
        get: {
          tags: ['Authentication'],
          summary: 'Verify email address',
          security: [],
          parameters: [
            {
              in: 'query',
              name: 'token',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': { description: 'Email verified.' },
            '400': { description: 'Invalid or expired token.' },
          },
        },
      },
      '/api/auth/request-password-reset': {
        post: {
          tags: ['Authentication'],
          summary: 'Request a password reset email',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/RequestPasswordResetRequest',
                },
              },
            },
          },
          responses: {
            '200': { description: 'Password reset email requested.' },
          },
        },
      },
      '/api/auth/reset-password': {
        post: {
          tags: ['Authentication'],
          summary: 'Reset password with token',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ResetPasswordRequest' },
              },
            },
          },
          responses: {
            '200': { description: 'Password reset successfully.' },
            '400': { description: 'Invalid or expired token.' },
          },
        },
      },
      '/api/auth/get-session': {
        get: {
          tags: ['Authentication'],
          summary: 'Get current Better Auth session',
          security: [{ cookieAuth: [] }],
          responses: {
            '200': { description: 'Current session, or null when signed out.' },
          },
        },
      },
      '/graphql': {
        post: {
          tags: ['GraphQL Profile Management'],
          summary: 'Execute GraphQL operations',
          description:
            'Use this endpoint for profile management. Authentication is provided by the Better Auth session cookie. The examples below cover profile management for candidate, employer, admin, and shared user account operations.',
          security: [{ cookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/GraphQLRequest' },
                examples: {
                  me: {
                    summary: 'Current authenticated user',
                    value: {
                      query:
                        'query Me { me { id name email phone role emailVerified isVerified isActive isLocked } }',
                    },
                  },
                  candidateProfile: {
                    summary: 'Read current candidate profile',
                    value: {
                      query:
                        'query CandidateProfile { candidateProfile { id title skills isEmployed userId user { id name email role } } }',
                    },
                  },
                  updateCandidateProfile: {
                    summary: 'Update current candidate profile',
                    value: {
                      query:
                        'mutation UpdateCandidateProfile($input: CandidateProfileInput!) { updateCandidateProfile(input: $input) { message } }',
                      variables: {
                        input: {
                          title: 'Dr',
                          skills: ['typescript', 'graphql'],
                          isEmployed: true,
                        },
                      },
                    },
                  },
                  employerProfile: {
                    summary: 'Read current employer profile',
                    value: {
                      query:
                        'query EmployerProfile { employerProfile { id industry websiteUrl location description size foundedIn isVerified userId user { id name email role } } }',
                    },
                  },
                  updateEmployerProfile: {
                    summary: 'Update current employer profile',
                    value: {
                      query:
                        'mutation UpdateEmployerProfile($input: EmployerProfileInput!) { updateEmployerProfile(input: $input) { message } }',
                      variables: {
                        input: {
                          industry: 'Technology',
                          websiteUrl: 'https://example.com',
                          location: 'Remote',
                          description: 'Hiring software engineers',
                          size: 25,
                          foundedIn: 2020,
                        },
                      },
                    },
                  },
                  adminProfile: {
                    summary: 'Read current admin profile',
                    value: {
                      query:
                        'query AdminProfile { adminProfile { id permissions userId user { id name email role } } }',
                    },
                  },
                  updateAdminProfile: {
                    summary: 'Update current admin profile',
                    value: {
                      query:
                        'mutation UpdateAdminProfile($input: AdminProfileInput!) { updateAdminProfile(input: $input) { message } }',
                      variables: {
                        input: {
                          permissions: ['READ', 'WRITE'],
                        },
                      },
                    },
                  },
                  updateContact: {
                    summary: 'Update shared user contact fields',
                    value: {
                      query:
                        'mutation UpdateContact($input: ContactInput!) { updateContact(input: $input) { message } }',
                      variables: {
                        input: {
                          email: 'new@example.com',
                          phone: '+27821234567',
                        },
                      },
                    },
                  },
                  deleteAccount: {
                    summary: 'Delete authenticated user account',
                    value: {
                      query:
                        'mutation DeleteAccount { deleteAccount { message } }',
                    },
                  },
                  listCandidates: {
                    summary: 'List candidate profiles',
                    value: {
                      query:
                        'query Candidates($page: Int, $limit: Int) { candidates(page: $page, limit: $limit) { candidates { id title skills user { id email role } } pagination { page limit total } } }',
                      variables: { page: 1, limit: 10 },
                    },
                  },
                  listEmployers: {
                    summary: 'List employer profiles',
                    value: {
                      query:
                        'query Employers($page: Int, $limit: Int) { employers(page: $page, limit: $limit) { employers { id industry location user { id email role } } pagination { page limit total } } }',
                      variables: { page: 1, limit: 10 },
                    },
                  },
                  listAdmins: {
                    summary: 'List admin profiles',
                    value: {
                      query:
                        'query Admins($page: Int, $limit: Int) { admins(page: $page, limit: $limit) { admins { id permissions user { id email role } } pagination { page limit total } } }',
                      variables: { page: 1, limit: 10 },
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description:
                'GraphQL execution result. Profile authorization failures are returned in the errors array.',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/GraphQLResponse' },
                },
              },
            },
            '400': { description: 'Malformed GraphQL request.' },
          },
        },
      },
    },
  },
  apis: ['./src/controllers/*.ts', './src/routes/*.ts'],
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions);
