// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@bull-board/express';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { getQueueToken } from '@nestjs/bull';
import { Queue } from 'bull';
import * as express from 'express';
import { AllExceptionsFilter } from './common/all-exceptions.filter';
import { ResponseInterceptor } from './common/response.interceptor';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets('/Users/kimminchan/Desktop/topGuardImage', {
    prefix: '/topGuardImage/', // URL 경로
  });

  app.enableCors({
    origin: '*', // 모든 출처 허용
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Cats example')
    .setDescription('The cats API description')
    .setVersion('1.0')
    .addTag('cats')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      showCommonExtensions: true,
      supportedSubmitMethods: ['get', 'post', 'patch', 'put', 'delete'],
      syntaxHighlight: {
        activate: true,
        theme: 'monokai',
      },
      deepLinking: true,
    },
  });

  // const config = new DocumentBuilder()
  //   .setTitle('neuralCGA API Docs')
  //   .setDescription('neuralCGA API description')
  //   .setVersion('1.0')
  //   .addTag('neuralCGA')
  //   .build();

  // const documentFactory = () => SwaggerModule.createDocument(app, config);
  // SwaggerModule.setup('api', app, documentFactory, {
  //   swaggerOptions: {
  //     persistAuthorization: true, // 인증 정보 유지
  //     docExpansion: 'none', // 기본적으로 문서 접힘 상태
  //     showCommonExtensions: true, // 공통 확장 정보 표시
  //     supportedSubmitMethods: ['get', 'post', 'patch', 'put', 'delete'], // 활성화할 HTTP 메서드
  //     syntaxHighlight: {
  //       activate: true,
  //       theme: 'monokai',
  //     },
  //     deepLinking: true, // URL로 직접 이동 가능
  //   },
  // });

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  // BullMQ 큐 인스턴스 가져오기
  const userQueue = app.get<Queue>(getQueueToken('userQueue'));

  // Bull Board 설정
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  const { setQueues } = createBullBoard({
    queues: [],
    serverAdapter,
  });

  setQueues([new BullAdapter(userQueue)]);

  // Express에 bull-board router 연결
  const bullApp = express();
  bullApp.use('/admin/queues', serverAdapter.getRouter());
  app.use(bullApp);

  await app.listen(4002);
  console.log('✅ 서버 실행 완료: http://localhost:4002/admin/queues');
}
bootstrap();
