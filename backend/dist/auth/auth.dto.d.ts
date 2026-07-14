import { Role } from '@prisma/client';
export declare class RegisterDto {
    email: string;
    password: string;
    name: string;
    role: Role;
}
export declare class LoginDto {
    email: string;
    password: string;
}
