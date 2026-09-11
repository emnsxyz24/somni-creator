import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'email must be a valid email address' })
  email!: string;

  @IsString({ message: 'password must be a string' })
  @IsNotEmpty({ message: 'password cannot be empty' })
  password!: string;
}
