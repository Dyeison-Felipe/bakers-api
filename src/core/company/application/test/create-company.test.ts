import { CreateCompanyUseCase } from '../usecase/create-company.usecase';
import { ConflictError } from '@/shared/application/errors/conflict-error';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import { makeCompany, makeCity, makePlan } from './fixtures';
import type { CompanyRepository } from '../../domain/repositories/company.repository';
import type { PlanRepository } from '@/core/plan/domain/repositories/plan.repository';
import type { AddressRepository } from '@/core/address/domain/repositories/address.repository';
import type { UserRepository } from '@/core/user/domain/repositories/user.repository';
import type { CityRepository } from '@/core/city/domain/repositories/city.repository';
import type { RoleRepository } from '@/core/role/domain/repositories/role.repository';
import type { HashService } from '@/shared/application/hash/hash.service';
import type { UserPermissionRepository } from '@/core/user-permission/domain/repositories/user-permission.repository';
import type { JwtService } from '@/shared/application/jwt/jwt.service';
import type { EnvConfig } from '@/shared/application/env-config/env-config';
import type { MailService } from '@/shared/application/mail/mail.service';
import type { MercadoPagoService } from '@/shared/application/mercado-pago/mercado-pago.service';
import type { CompanySubscriptionRepository } from '@/core/subscription/domain/repositories/company-subscription.repository';

describe('CreateCompanyUseCase', () => {
  let companyRepository: jest.Mocked<Pick<CompanyRepository, 'findByCnpj' | 'save'>>;
  let planRepository: jest.Mocked<Pick<PlanRepository, 'findById'>>;
  let addressRepository: jest.Mocked<Pick<AddressRepository, 'save'>>;
  let userRepository: jest.Mocked<Pick<UserRepository, 'save'>>;
  let cityRepository: jest.Mocked<Pick<CityRepository, 'findById'>>;
  let roleRepository: jest.Mocked<Pick<RoleRepository, 'save'>>;
  let hashService: jest.Mocked<HashService>;
  let userPermissionRepository: jest.Mocked<Pick<UserPermissionRepository, 'saveMany'>>;
  let jwtService: jest.Mocked<JwtService>;
  let envConfigService: jest.Mocked<Pick<EnvConfig, 'getJwtSecretEmailVerification' | 'getExpiresInSecondsEmailVerification' | 'getFrontendUrl'>>;
  let mailService: jest.Mocked<MailService>;
  let mercadoPagoService: jest.Mocked<Pick<MercadoPagoService, 'createSubscription'>>;
  let companySubscriptionRepository: jest.Mocked<Pick<CompanySubscriptionRepository, 'save'>>;
  let sut: CreateCompanyUseCase;

  const baseInput = {
    cnpj: '12345678000190',
    stateRegistration: '123456',
    fantasyName: 'Padaria X',
    socialReazon: 'Padaria X LTDA',
    phoneNumber: '42999998888',
    email: 'contato@padaria.com',
    address: {
      cep: '80000000',
      street: 'Rua X',
      number: '100',
      neighborhood: 'Centro',
      cityId: '11111111-1111-4111-8111-111111111111',
    },
    plan: 'plan-1',
    user: {
      username: 'admin',
      name: 'Admin User',
      password: 'supersecret',
      email: 'admin@padaria.com',
    },
  };

  beforeEach(() => {
    companyRepository = {
      findByCnpj: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockImplementation((c) => Promise.resolve(c)),
    };
    planRepository = {
      findById: jest.fn().mockResolvedValue(
        makePlan({ permissions: [{ id: 'perm-1', action: 'reader', subject: 'sale' }] }),
      ),
    };
    addressRepository = {
      save: jest.fn().mockImplementation((a) => Promise.resolve(a)),
    };
    userRepository = {
      save: jest.fn().mockImplementation((u) => Promise.resolve(u)),
    };
    cityRepository = { findById: jest.fn().mockResolvedValue(makeCity()) };
    roleRepository = {
      save: jest.fn().mockImplementation((r) => Promise.resolve(r)),
    };
    hashService = {
      hash: jest.fn().mockResolvedValue('hashed-password'),
      compareHash: jest.fn(),
    };
    userPermissionRepository = {
      saveMany: jest.fn().mockImplementation((entities) => Promise.resolve(entities)),
    };
    jwtService = {
      generateJwt: jest.fn().mockResolvedValue({ token: 'verify-token' }),
      decodeJwt: jest.fn(),
      verifyJwt: jest.fn(),
    };
    envConfigService = {
      getJwtSecretEmailVerification: jest.fn().mockReturnValue('secret'),
      getExpiresInSecondsEmailVerification: jest.fn().mockReturnValue(3600),
      getFrontendUrl: jest.fn().mockReturnValue('http://localhost:5173'),
    };
    mailService = { sendMail: jest.fn().mockResolvedValue(undefined) };
    mercadoPagoService = {
      createSubscription: jest
        .fn()
        .mockResolvedValue({ id: 'mp-subscription-1', status: 'authorized' }),
    };
    companySubscriptionRepository = {
      save: jest.fn().mockImplementation((s) => Promise.resolve(s)),
    };

    sut = new CreateCompanyUseCase(
      companyRepository as unknown as CompanyRepository,
      planRepository as unknown as PlanRepository,
      addressRepository as unknown as AddressRepository,
      userRepository as unknown as UserRepository,
      cityRepository as unknown as CityRepository,
      roleRepository as unknown as RoleRepository,
      hashService,
      userPermissionRepository as unknown as UserPermissionRepository,
      jwtService,
      envConfigService as unknown as EnvConfig,
      mailService,
      mercadoPagoService as unknown as MercadoPagoService,
      companySubscriptionRepository as unknown as CompanySubscriptionRepository,
    );
  });

  it('should throw ConflictError when the CNPJ is already registered', async () => {
    companyRepository.findByCnpj.mockResolvedValue(makeCompany());

    await expect(sut.execute(baseInput)).rejects.toThrow(ConflictError);
    expect(companyRepository.save).not.toHaveBeenCalled();
  });

  it('should throw NotFoundError when the plan does not exist', async () => {
    planRepository.findById.mockResolvedValue(null);

    await expect(sut.execute(baseInput)).rejects.toThrow(NotFoundError);
  });

  it('should throw NotFoundError when the city does not exist', async () => {
    cityRepository.findById.mockResolvedValue(null);

    await expect(sut.execute(baseInput)).rejects.toThrow(NotFoundError);
  });

  it('should throw BadRequestError when the plan has no permissions to grant the first user', async () => {
    planRepository.findById.mockResolvedValue(makePlan({ permissions: [] }));

    await expect(sut.execute(baseInput)).rejects.toThrow(BadRequestError);
  });

  it('should create both an Admin and a Funcionário role for the new company', async () => {
    planRepository.findById.mockResolvedValue(
      makePlan({ permissions: [{ id: 'perm-1', action: 'reader', subject: 'sale' }] }),
    );

    await sut.execute(baseInput);

    expect(roleRepository.save).toHaveBeenCalledTimes(2);
    const roleNames = roleRepository.save.mock.calls.map((call) => call[0].name);
    expect(roleNames).toEqual(['Admin', 'Funcionário']);
  });

  it('should hash the password, create the first user with the Admin role, and grant it every plan permission', async () => {
    const permissions = [
      { id: 'perm-1', action: 'reader', subject: 'sale' },
      { id: 'perm-2', action: 'create', subject: 'sale' },
    ];
    planRepository.findById.mockResolvedValue(makePlan({ permissions }));

    await sut.execute(baseInput);

    expect(hashService.hash).toHaveBeenCalledWith('supersecret');
    const savedUser = userRepository.save.mock.calls[0][0];
    expect(savedUser.password).toBe('hashed-password');
    expect(savedUser.role.name).toBe('Admin');

    expect(userPermissionRepository.saveMany).toHaveBeenCalledTimes(1);
    expect(userPermissionRepository.saveMany.mock.calls[0][0]).toHaveLength(2);
  });

  it('should send the verification email to the new admin user', async () => {
    await sut.execute(baseInput);

    expect(mailService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'admin@padaria.com',
        template: 'email-verification',
      }),
    );
  });

  it('should not fail the whole operation when sending the verification email fails', async () => {
    mailService.sendMail.mockRejectedValue(new Error('smtp down'));

    await expect(sut.execute(baseInput)).resolves.toBeDefined();
  });

  it('should return the created company output', async () => {
    const output = await sut.execute(baseInput);

    expect(output).toMatchObject({
      fantasyName: 'Padaria X',
      cnpj: '12345678000190',
      active: true,
      paymentPending: false,
    });
    expect(output.id).toEqual(expect.any(String));
  });

  describe('when the plan has a price (requires payment)', () => {
    const paidInput = { ...baseInput, cardTokenId: 'card-token-123' };

    beforeEach(() => {
      planRepository.findById.mockResolvedValue(
        makePlan({
          price: 100,
          duration: 30,
          permissions: [{ id: 'perm-1', action: 'reader', subject: 'sale' }],
        }),
      );
    });

    it('should throw BadRequestError when no card token is provided', async () => {
      await expect(sut.execute(baseInput)).rejects.toThrow(BadRequestError);
      expect(companyRepository.save).not.toHaveBeenCalled();
    });

    it('should create a Mercado Pago subscription with the amount/duration from the plan (never from input)', async () => {
      await sut.execute(paidInput);

      expect(mercadoPagoService.createSubscription).toHaveBeenCalledWith(
        expect.objectContaining({
          cardTokenId: 'card-token-123',
          transactionAmount: 100,
          frequency: 1,
          frequencyType: 'months',
          payerEmail: 'admin@padaria.com',
        }),
      );
    });

    it('should create the company inactive and pending confirmation', async () => {
      const output = await sut.execute(paidInput);

      expect(output.active).toBe(false);
      expect(output.paymentPending).toBe(true);
    });

    it('should not send the verification email (confirmation happens via webhook instead)', async () => {
      await sut.execute(paidInput);

      expect(mailService.sendMail).not.toHaveBeenCalled();
    });

    it('should persist a pending CompanySubscription with the id returned by Mercado Pago', async () => {
      await sut.execute(paidInput);

      expect(companySubscriptionRepository.save).toHaveBeenCalledTimes(1);
      const saved = companySubscriptionRepository.save.mock.calls[0][0];
      expect(saved.mercadoPagoSubscriptionId).toBe('mp-subscription-1');
      expect(saved.status).toBe('pending');
      expect(saved.payerEmail).toBe('admin@padaria.com');
    });

    it('should not create anything when Mercado Pago rejects the subscription', async () => {
      mercadoPagoService.createSubscription.mockRejectedValue(
        new Error('cc_rejected_insufficient_amount'),
      );

      await expect(sut.execute(paidInput)).rejects.toThrow();
      expect(companyRepository.save).not.toHaveBeenCalled();
    });
  });
});
