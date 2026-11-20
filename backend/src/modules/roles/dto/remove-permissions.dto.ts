import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class RemovePermissionsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  permissionIds: string[];
}
