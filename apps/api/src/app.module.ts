import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { JwtAuthGuard } from './common/jwt-auth.guard';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CoursesModule } from './courses/courses.module';
import { AnalysisModule } from './analysis/analysis.module';
import { AiModule } from './ai/ai.module';
import { StoriesModule } from './stories/stories.module';
import { RadioModule } from './radio/radio.module';
import { AdminModule } from './admin/admin.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env'] }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CoursesModule,
    AiModule,
    AnalysisModule,
    StoriesModule,
    RadioModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    // 全局 JWT 守卫：默认要求登录，@Public() 标记的接口放行
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
