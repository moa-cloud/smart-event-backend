import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CHECK_OWNERSHIP_KEY } from '../decorator/check-ownership.decorator';
import { UserService } from 'src/user/user.service';
import { EventService } from 'src/event/event.service';

@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private eventService: EventService,
    private userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const resourceType = this.reflector.get<string>(
      CHECK_OWNERSHIP_KEY,
      context.getHandler(),
    );

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const id = request.params.id;

    let resource: any;

    switch (resourceType) {
      case 'event':
        resource = await this.eventService.findEventByIdForGuard(id);
        break;
      case 'user':
        resource = await this.userService.findUserById(id);
        break;
      default:
        throw new NotFoundException('Unsupported resource type');
    }

    if (!resource) throw new NotFoundException(`${resourceType} not found`);

    const ownerId = resource.createdBy?.toString() || resource._id?.toString();
    if (ownerId !== user.id) {
      throw new ForbiddenException(`You do not own this ${resourceType}`);
    }

    return true;
  }
}
