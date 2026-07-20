// core/category/infra/database/typeorm/category-persistence.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { CategorySchema } from './database/typeorm/schema/category.schema';
import { CategoryRepositoryImpl } from './database/typeorm/repositories/category.repository';

@Module({
  imports: [TypeOrmModule.forFeature([CategorySchema])],
  providers: [
    {
      provide: PROVIDERS.CATEGORY_REPOSITORY,
      useClass: CategoryRepositoryImpl,
    },
  ],
  exports: [PROVIDERS.CATEGORY_REPOSITORY],
})
export class CategoryPersistenceModule {}
