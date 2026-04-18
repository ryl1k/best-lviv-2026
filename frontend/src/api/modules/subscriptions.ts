import { apiEndpoints } from '@/api/endpoints';
import { httpClient } from '@/api/http-client';
import type { Subscription, UserSubscription } from '@/api/models';

export const subscriptionsApi = {
  list() {
    return httpClient.get<Subscription[]>(apiEndpoints.subscriptions.list);
  },

  mine() {
    return httpClient.get<UserSubscription>(apiEndpoints.subscriptions.mine, { auth: true });
  },

  purchase(id: number) {
    return httpClient.post<UserSubscription>(apiEndpoints.subscriptions.purchase(id), undefined, { auth: true });
  },
};

