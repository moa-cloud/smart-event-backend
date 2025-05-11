import { SetMetadata } from '@nestjs/common';

export const CHECK_OWNERSHIP_KEY = 'resourceType';

export const CheckOwnership = (resourceType: 'event' | 'user' | 'booking') =>
  SetMetadata(CHECK_OWNERSHIP_KEY, resourceType);
