type Permissions = 'READ' | 'WRITE' | 'DELETE';
const PERMISSIONS = ['READ', 'WRITE', 'DELETE'] as const;

export { Permissions, PERMISSIONS };
