import { Expose, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUUID,
} from 'class-validator';
import { Role } from '@work-whiz/types';

export class UserDTO {
  @Expose()
  @IsUUID()
  readonly id: string;

  @Expose()
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @Expose()
  @IsEmail()
  email: string;

  @Expose()
  @IsPhoneNumber('ZA')
  phone: string;

  @Expose({ toClassOnly: true })
  @IsString()
  @IsOptional()
  password?: string;

  @Expose()
  @IsEnum(Role)
  role: Role;

  @Expose()
  @IsBoolean()
  @Transform(({ value }) => value ?? false)
  isVerified: boolean;

  @Expose()
  @IsBoolean()
  @Transform(({ value }) => value ?? false)
  isActive: boolean;

  @Expose()
  @IsBoolean()
  @Transform(({ value }) => value ?? false)
  isLocked: boolean;

  @Expose()
  @IsDate()
  @Transform(({ value }) => (value ? new Date(value) : new Date()))
  readonly createdAt: Date;

  @Expose()
  @IsDate()
  @Transform(({ value }) => (value ? new Date(value) : new Date()))
  readonly updatedAt: Date;
}

export class UserResponseDTO extends UserDTO {
  @Expose()
  get status() {
    return this.isActive ? 'active' : 'inactive';
  }

  @Expose({ toPlainOnly: false })
  password?: never;
}
