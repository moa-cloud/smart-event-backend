import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Role } from './schemas/role.schema';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';

// a function to momentarly run the app enter the initial values and close the app hence a seeder. only run it once during development or deployment
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule); // starts the app not the server too seed the roles

  const roleModel = app.get<Model<Role>>(getModelToken(Role.name)); // gets the mongo model of the role schema to manupilate it

  const roles = [{ name: 'user' }, { name: 'organizer' }, { name: 'admin' }]; // inserts the initial roles we want to seed

  // checkes if each roles exsists and add them to the mongo role db if not
  for (const role of roles) {
    const exists = await roleModel.findOne({ name: role.name });
    if (!exists) {
      await roleModel.create(role);
      console.log(`Created role: ${role.name}`);
    } else {
      console.log(`Role already exists: ${role.name}`);
    }
  }

  await app.close(); // closes the app
}

bootstrap();
