import { builder } from '@work-whiz/app/builder';
import type {
  IAdmin,
  ICandidate,
  IEmployer,
  IUser,
} from '@work-whiz/interfaces';

export type MessagePayload = {
  message: string;
};

export type PaginationPayload = {
  page?: number;
  limit?: number;
  total?: number;
};

export type CandidateConnectionPayload = {
  candidates: ICandidate[];
  pagination: PaginationPayload;
};

export type EmployerConnectionPayload = {
  employers: IEmployer[];
  pagination: PaginationPayload;
};

export type AdminConnectionPayload = {
  admins: IAdmin[];
  pagination: PaginationPayload;
};

export const MessageObject = builder.simpleObject('Message', {
  fields: t => ({
    message: t.string({ nullable: false }),
  }),
});

export const PaginationObject = builder.simpleObject('Pagination', {
  fields: t => ({
    page: t.int(),
    limit: t.int(),
    total: t.int(),
  }),
});

export const UserObject = builder.objectRef<Partial<IUser>>('User').implement({
  fields: t => ({
    id: t.exposeID('id', { nullable: true }),
    name: t.exposeString('name', { nullable: true }),
    email: t.exposeString('email', { nullable: true }),
    phone: t.exposeString('phone', { nullable: true }),
    image: t.exposeString('image', { nullable: true }),
    role: t.exposeString('role', { nullable: true }),
    emailVerified: t.exposeBoolean('emailVerified', { nullable: true }),
    isVerified: t.exposeBoolean('isVerified', { nullable: true }),
    isActive: t.exposeBoolean('isActive', { nullable: true }),
    isLocked: t.exposeBoolean('isLocked', { nullable: true }),
  }),
});

export const CandidateProfileObject = builder
  .objectRef<ICandidate>('CandidateProfile')
  .implement({
    fields: t => ({
      id: t.exposeID('id', { nullable: true }),
      title: t.exposeString('title', { nullable: true }),
      skills: t.stringList({
        nullable: false,
        resolve: profile => profile.skills ?? [],
      }),
      isEmployed: t.exposeBoolean('isEmployed', { nullable: true }),
      userId: t.exposeString('userId', { nullable: true }),
      user: t.field({
        type: UserObject,
        nullable: true,
        resolve: profile => profile.user ?? null,
      }),
    }),
  });

export const EmployerProfileObject = builder
  .objectRef<IEmployer>('EmployerProfile')
  .implement({
    fields: t => ({
      id: t.exposeID('id', { nullable: true }),
      industry: t.exposeString('industry', { nullable: true }),
      websiteUrl: t.exposeString('websiteUrl', { nullable: true }),
      location: t.exposeString('location', { nullable: true }),
      description: t.exposeString('description', { nullable: true }),
      size: t.exposeInt('size', { nullable: true }),
      foundedIn: t.exposeInt('foundedIn', { nullable: true }),
      isVerified: t.exposeBoolean('isVerified', { nullable: true }),
      userId: t.exposeString('userId', { nullable: true }),
      user: t.field({
        type: UserObject,
        nullable: true,
        resolve: profile => profile.user ?? null,
      }),
    }),
  });

export const AdminProfileObject = builder
  .objectRef<IAdmin>('AdminProfile')
  .implement({
    fields: t => ({
      id: t.exposeID('id', { nullable: true }),
      permissions: t.stringList({
        nullable: false,
        resolve: profile => profile.permissions ?? [],
      }),
      userId: t.exposeString('userId', { nullable: true }),
      user: t.field({
        type: UserObject,
        nullable: true,
        resolve: profile => profile.user ?? null,
      }),
    }),
  });

export const CandidateConnectionObject = builder.simpleObject(
  'CandidateProfileConnection',
  {
    fields: t => ({
      candidates: t.field({
        type: [CandidateProfileObject],
        nullable: false,
      }),
      pagination: t.field({
        type: PaginationObject,
        nullable: false,
      }),
    }),
  },
);

export const EmployerConnectionObject = builder.simpleObject(
  'EmployerProfileConnection',
  {
    fields: t => ({
      employers: t.field({
        type: [EmployerProfileObject],
        nullable: false,
      }),
      pagination: t.field({
        type: PaginationObject,
        nullable: false,
      }),
    }),
  },
);

export const AdminConnectionObject = builder.simpleObject(
  'AdminProfileConnection',
  {
    fields: t => ({
      admins: t.field({
        type: [AdminProfileObject],
        nullable: false,
      }),
      pagination: t.field({
        type: PaginationObject,
        nullable: false,
      }),
    }),
  },
);
