import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { Inject, Logger, LoggerService } from '@nestjs/common';
import { CompanyRepository } from '../../domain/repositories/company.repository';
import { CreateAddressInput } from '@/shared/application/input/address/create-address.input';
import { PlanRepository } from '@/core/plan/domain/repositories/plan.repository';
import { AddressRepository } from '@/core/address/domain/repositories/address.repository';
import { ConflictError } from '@/shared/application/errors/conflict-error';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { UserRepository } from '@/core/user/domain/repositories/user.repository';
import { Address } from '@/core/address/domain/entities/address.entity';
import { ID_USER_DEFAULT } from '@/shared/application/constants/id-user-default';
import { Company } from '../../domain/entities/company.entity';
import { Transactional } from '@/shared/infra/database/typeorm/decorators/transactional.decorator';
import { RoleRepository } from '@/core/role/domain/repositories/role.repository';
import { Role } from '@/core/role/domain/entities/role.entity';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import { UserEntity } from '@/core/user/domain/entities/user.entity';
import { HashService } from '@/shared/application/hash/hash.service';
import { getErrorStack } from '@/shared/application/helpers/error.helper';
import { CreateCompanyOutput } from '@/shared/application/output/company/create-company-output';
import { CityRepository } from '@/core/city/domain/repositories/city.repository';
import { UserPermissionRepository } from '@/core/user-permission/domain/repositories/user-permission.repository';
import { UserPermissionEntity } from '@/core/user-permission/domain/entities/user-permission.entity';
import { JwtService } from '@/shared/application/jwt/jwt.service';
import { EnvConfig } from '@/shared/application/env-config/env-config';
import { MailService } from '@/shared/application/mail/mail.service';
import { MercadoPagoService } from '@/shared/application/mercado-pago/mercado-pago.service';
import { CompanySubscriptionRepository } from '@/core/subscription/domain/repositories/company-subscription.repository';
import { CompanySubscription } from '@/core/subscription/domain/entities/company-subscription.entity';
import { daysToMercadoPagoFrequency } from '@/core/subscription/application/helpers/frequency.helper';

type UserInput = {
  username: string;
  name: string;
  password: string;
  email: string;
};

type Input = {
  cnpj: string;
  stateRegistration: string;
  fantasyName: string;
  socialReazon: string;
  phoneNumber: string;
  email: string;
  address: CreateAddressInput;
  plan: string;
  user: UserInput;
  // Token do cartão gerado no navegador (Mercado Pago SDK.js) — obrigatório
  // só quando o plano escolhido tem preço > 0. Nunca recebemos dados de
  // cartão em texto puro aqui.
  cardTokenId?: string;
};

type Output = CreateCompanyOutput;

export class CreateCompanyUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.COMPANY_REPOSITORY)
    private readonly companyRepository: CompanyRepository,
    @Inject(PROVIDERS.PLAN_REPOSITORY)
    private readonly planRepository: PlanRepository,
    @Inject(PROVIDERS.ADDRESS_REPOSITORY)
    private readonly addressRepository: AddressRepository,
    @Inject(PROVIDERS.USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(PROVIDERS.CITY_REPOSITORY)
    private readonly cityRepository: CityRepository,
    @Inject(PROVIDERS.ROLE_REPOSITORY)
    private readonly roleRepository: RoleRepository,
    @Inject(PROVIDERS.HASH_SERVICE) private readonly hashService: HashService,
    @Inject(PROVIDERS.USER_PERMISSION_REPOSITORY)
    private readonly userPermissionRepository: UserPermissionRepository,
    @Inject(PROVIDERS.JWT_SERVICE) private readonly jwtService: JwtService,
    @Inject(PROVIDERS.ENV_CONFIG_SERVICE)
    private readonly envConfigService: EnvConfig,
    @Inject(PROVIDERS.MAIL_SERVICE) private readonly mailService: MailService,
    @Inject(PROVIDERS.MERCADO_PAGO_SERVICE)
    private readonly mercadoPagoService: MercadoPagoService,
    @Inject(PROVIDERS.COMPANY_SUBSCRIPTION_REPOSITORY)
    private readonly companySubscriptionRepository: CompanySubscriptionRepository,
  ) {}

  private readonly logger = new Logger(CreateCompanyUseCase.name);

  @Transactional()
  async execute(input: Input): Promise<Output> {
    const existCompany = await this.companyRepository.findByCnpj(input.cnpj);

    if (existCompany) {
      throw new ConflictError(`O ${input.cnpj} cnpj já está cadastrado`);
    }

    const plan = await this.planRepository.findById(input.plan);

    if (!plan) {
      throw new NotFoundError(`Plano não encontrado`);
    }

    const requiresPayment = plan.price > 0;

    if (requiresPayment && !input.cardTokenId) {
      throw new BadRequestError(
        `Este plano exige informar os dados do cartão de crédito`,
      );
    }

    const city = await this.cityRepository.findById(input.address.cityId);

    if (!city) {
      throw new NotFoundError(`Cidade não encontrada`);
    }

    const address = Address.create({
      cep: input.address?.cep,
      city,
      street: input.address.street,
      number: input.address.number,
      neighborhood: input.address.neighborhood,
      complement: input.address.complement,
      latitude: input.address.latitude ?? null,
      longitude: input.address.longitude ?? null,
      createdBy: ID_USER_DEFAULT,
      updatedBy: ID_USER_DEFAULT,
    });

    const savedAddress = await this.addressRepository.save(address);

    // Autoriza a cobrança ANTES de criar qualquer registro — se o Mercado
    // Pago recusar o cartão aqui, nada é persistido (aborta o método antes
    // do primeiro save). Assinaturas novas só confirmam a 1ª cobrança de
    // forma assíncrona, então isto só autoriza o mandato; a confirmação de
    // verdade chega depois via webhook (ConfirmSubscriptionPaymentUseCase).
    let mercadoPagoSubscriptionId: string | null = null;

    if (requiresPayment) {
      const { frequency, frequencyType } = daysToMercadoPagoFrequency(
        plan.duration,
      );

      const subscription = await this.mercadoPagoService.createSubscription({
        cardTokenId: input.cardTokenId as string,
        payerEmail: input.user.email,
        transactionAmount: plan.price,
        frequency,
        frequencyType,
        externalReference: crypto.randomUUID(),
        reason: `Assinatura ${plan.name} - Baker's Bill`,
        backUrl: `${this.envConfigService.getFrontendUrl()}/access?mode=login`,
      });

      mercadoPagoSubscriptionId = subscription.id;
    }

    const company = Company.create({
      fantasyName: input.fantasyName,
      socialReazon: input.socialReazon,
      cnpj: input.cnpj,
      email: input.email,
      phoneNumber: input.phoneNumber,
      stateRegistration: input.stateRegistration,
      address: savedAddress,
      plan,
      // Plano pago: nasce bloqueada até o webhook do Mercado Pago confirmar
      // a 1ª cobrança. Plano gratuito: segue liberada como sempre.
      active: !requiresPayment,
      createdBy: ID_USER_DEFAULT,
      updatedBy: ID_USER_DEFAULT,
    });

    const savedCompany = await this.companyRepository.save(company);

    // company.repository's save/toEntity round-trip não carrega
    // plan.permissions (PlanMapper.toSchema não inclui planPermission) —
    // reatribui o plan já carregado com permissões, buscado no início deste
    // método, pra createUser conseguir montar as UserPermissionEntity.
    savedCompany.plan = plan;

    const role = await this.createRole(savedCompany, 'Admin');
    // Cargo base pra funcionários — os packs de permissão da tela de Usuários só
    // têm efeito prático em um usuário que não seja Admin (Admin ignora as
    // permissões individuais e usa tudo que o plano da empresa permitir).
    await this.createRole(savedCompany, 'Funcionário');

    await this.createUser(input.user, savedCompany, role, requiresPayment);

    if (requiresPayment && mercadoPagoSubscriptionId) {
      const companySubscription = CompanySubscription.create({
        company: savedCompany,
        plan,
        mercadoPagoSubscriptionId,
        payerEmail: input.user.email,
      });

      await this.companySubscriptionRepository.save(companySubscription);
    }

    return this.output(savedCompany, requiresPayment);
  }

  private output(company: Company, paymentPending: boolean): Output {
    const output: Output = {
      id: company.id,
      fantasyName: company.fantasyName,
      socialReazon: company.socialReazon,
      cnpj: company.cnpj,
      email: company.email,
      phoneNumber: company.phoneNumber,
      active: company.active,
      stateRegistration: company.stateRegistration,
      plan: company.plan!,
      address: company.address!,
      planStartedAt: company.planStartedAt,
      planExpiresAt: company.planExpiresAt,
      createdBy: company.createdBy,
      updatedBy: company.updatedBy,
      deletedBy: company.deletedBy,
      paymentPending,
    };

    return output;
  }

  private async createRole(company: Company, name: string): Promise<Role> {
    try {
      const role = Role.create({
        name,
        company,
        createdBy: ID_USER_DEFAULT,
        updatedBy: ID_USER_DEFAULT,
      });

      const savedRole = await this.roleRepository.save(role);

      return savedRole;
    } catch (error) {
      this.logger.error(
        'Erro ao criar cargo para empresa',
        getErrorStack(error),
      );
      throw new BadRequestError(`Ocorreu um erro ao criar o cargo`);
    }
  }

  private async createUser(
    userInput: UserInput,
    company: Company,
    role: Role,
    requiresPaymentConfirmation: boolean,
  ): Promise<void> {
    try {
      const passwordHased = await this.hashService.hash(userInput.password);

      const user = UserEntity.create({
        email: userInput.email,
        username: userInput.username,
        name: userInput.name,
        password: passwordHased,
        role,
        company,
        createdBy: ID_USER_DEFAULT,
        updatedBy: ID_USER_DEFAULT,
      });

      const saveUser = await this.userRepository.save(user);

      const userPermissions = company.plan?.permissions?.map(
        (permission) => {
          return UserPermissionEntity.create({
            user: saveUser,
            permission: permission,
          });
        },
      );

      if (!userPermissions || userPermissions.length === 0) {
        this.logger.error(
          'Ocorreu um erro ao criar o usuário da empresa, pois não há permissões associadas ao plano',
        );
        throw new BadRequestError(`Ocorreu um erro ao criar o usuário`);
      }

      await this.userPermissionRepository.saveMany(userPermissions);

      // Cadastro com pagamento pendente: o login do usuário fica bloqueado
      // (emailVerified=false, igual ao fluxo de hoje até o clique no link)
      // até a confirmação da cobrança liberar via
      // ConfirmSubscriptionPaymentUseCase — não manda o e-mail de
      // verificação de hoje, que seria redundante/confuso nesse fluxo.
      if (!requiresPaymentConfirmation) {
        await this.sendVerificationEmail(saveUser, role);
      }
    } catch (error) {
      this.logger.error(
        'Ocorreu um erro ao criar o usuário da empresa',
        getErrorStack(error),
      );
      throw new BadRequestError(`Ocorreu um erro ao criar o usuário`);
    }
  }

  private async sendVerificationEmail(
    user: UserEntity,
    role: Role,
  ): Promise<void> {
    try {
      const { token } = await this.jwtService.generateJwt(
        {
          sub: user.id,
          email: user.email,
          username: user.username,
          role: role.name,
        },
        {
          secret: this.envConfigService.getJwtSecretEmailVerification(),
          expiresIn: this.envConfigService.getExpiresInSecondsEmailVerification(),
        },
      );

      const verificationLink = `${this.envConfigService.getFrontendUrl()}/verify-email?token=${token}`;

      await this.mailService.sendMail({
        to: user.email,
        template: 'email-verification',
        subject: 'Confirme seu e-mail',
        context: {
          name: user.username,
          verificationLink,
          year: new Date().getFullYear(),
        },
      });
    } catch (error) {
      this.logger.error(
        'Falha ao enviar o e-mail de verificação do usuário',
        getErrorStack(error),
      );
    }
  }
}
