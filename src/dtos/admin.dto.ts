import { Expose, Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsOptional,
  IsString,
  IsUUID,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { UserResponseDTO } from './user.dto';
import { Permissions, PERMISSIONS } from '@work-whiz/types';

export class AdminDTO {
  @Expose()
  @IsUUID()
  id: string;

  @Expose()
  @IsOptional()
  @IsString()
  firstName?: string;

  @Expose()
  @IsOptional()
  @IsString()
  lastName?: string;

  @Expose()
  @IsArray()
  @IsEnum(PERMISSIONS, { each: true })
  permissions: Permissions[] = [];

  @Expose()
  @Type(() => UserResponseDTO)
  @ValidateNested()
  @IsOptional()
  user?: UserResponseDTO;

  @Expose()
  @IsDate()
  @Transform(({ value }) => (value ? new Date(value) : new Date(0)))
  createdAt: Date;

  @Expose()
  @IsDate()
  @Transform(({ value }) => (value ? new Date(value) : new Date(0)))
  updatedAt: Date;
}

export class AdminResponseDTO extends AdminDTO {
  @Expose()
  get fullName() {
    return (
      [this.firstName, this.lastName].filter(Boolean).join(' ') || undefined
    );
  }
}
