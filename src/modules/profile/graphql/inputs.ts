import { builder } from '@work-whiz/app/builder';

export const ContactInput = builder.inputType('ContactInput', {
  fields: t => ({
    email: t.string({ required: false }),
    phone: t.string({ required: false }),
  }),
});

export type ContactInput = typeof ContactInput.$inferInput;

export const CandidateProfileInput = builder.inputType(
  'CandidateProfileInput',
  {
    fields: t => ({
      title: t.string({ required: false }),
      skills: t.stringList({ required: false }),
      isEmployed: t.boolean({ required: false }),
    }),
  },
);

export type CandidateProfileInput = typeof CandidateProfileInput.$inferInput;

export const EmployerProfileInput = builder.inputType('EmployerProfileInput', {
  fields: t => ({
    industry: t.string({ required: false }),
    websiteUrl: t.string({ required: false }),
    location: t.string({ required: false }),
    description: t.string({ required: false }),
    size: t.int({ required: false }),
    foundedIn: t.int({ required: false }),
    isVerified: t.boolean({ required: false }),
  }),
});

export type EmployerProfileInput = typeof EmployerProfileInput.$inferInput;

export const AdminProfileInput = builder.inputType('AdminProfileInput', {
  fields: t => ({
    permissions: t.stringList({ required: false }),
  }),
});

export type AdminProfileInput = typeof AdminProfileInput.$inferInput;
