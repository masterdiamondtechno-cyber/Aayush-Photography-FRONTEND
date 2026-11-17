import { getAuthValue } from './auth';

export const isSubscriptionExpired = () => {
  return getAuthValue('isSubscriptionExpired') === true;
};

export const hasSubscriptionFeature = (feature) => {
  // If trial is expired, block everything
  if (isSubscriptionExpired()) {
    return false;
  }

  const role = (getAuthValue('userRole') || '').toLowerCase();
  if (role === 'superadmin' || role === 'owner') return true;

  const plan = (getAuthValue('subscriptionStatus') || '').toLowerCase();
  const isPremium = plan.includes('premium') || plan.includes('custom') || plan.includes('enterprise') || plan.includes('ultimate');
  
  if (feature === 'live-lectures' || feature === 'recorded-lectures' || feature === 'bus-tracking') {
    return isPremium;
  }
  return true;
};
