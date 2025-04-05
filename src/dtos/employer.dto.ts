import { Expose, Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { UserResponseDTO } from './user.dto';

export class EmployerDTO {
  @Expose()
  @IsString()
  id: string;

  @Expose()
  @IsString()
  name: string;

  @Expose()
  @IsString()
  industry: string;

  @Expose()
  @IsOptional()
  @IsUrl()
  websiteUrl?: string;

  @Expose()
  @IsString()
  location: string;

  @Expose()
  @IsOptional()
  @IsString()
  description?: string;

  @Expose()
  @IsNumber()
  size: number;

  @Expose()
  @IsNumber()
  foundedIn: number;

  @Expose()
  @IsBoolean()
  isVerified: boolean;

  @Expose()
  @Type(() => UserResponseDTO)
  @ValidateNested()
  @IsOptional()
  user?: UserResponseDTO;

  @Expose()
  @IsDate()
  @Transform(({ value }) => (value ? new Date(value) : new Date()))
  createdAt: Date;

  @Expose()
  @IsDate()
  @Transform(({ value }) => (value ? new Date(value) : new Date()))
  updatedAt: Date;
}

// For responses (adds computed fields)
export class EmployerResponseDTO extends EmployerDTO {
  @Expose()
  get companyInfo() {
    return {
      name: this.name,
      industry: this.industry,
      size: this.size,
      founded: this.foundedIn,
    };
  }
}
