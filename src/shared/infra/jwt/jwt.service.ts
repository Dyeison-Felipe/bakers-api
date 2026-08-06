
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';
import { GenerateJwtToken, JwtService, Options, Payload, UserGenerateToken, VerifyOptions } from '@/shared/application/jwt/jwt.service';
import { UserEntity } from '@/core/user/domain/entities/user.entity';

@Injectable()
export class JwtServiceImpl implements JwtService {
  constructor(private readonly jwtService: NestJwtService) {}

  async verifyJwt(jwt: string, options?: VerifyOptions): Promise<Payload | null> {
    try {
      return await this.jwtService.verifyAsync<Payload>(
        jwt,
        options?.secret ? { secret: options.secret } : undefined,
      );
    } catch (error) {
      return null;
    }
  }

  decodeJwt(jwt: string): Payload {
    return this.jwtService.decode<Payload>(jwt);
  }

  async generateJwt(
    user: UserGenerateToken,
    options : Options,
  ): Promise<GenerateJwtToken> {
    const payload = {
      sub: user.sub,
      username: user.username,
      email: user.email,
    };

    const token = await this.jwtService.signAsync(payload, { ...options });

    return { token };
  }
}
