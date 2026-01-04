import React from 'react';
import { useTeenCare } from '../context/TeenCareContext';
import GuardianDashboardMain from '../components/guardian/GuardianDashboardMain';

const GuardianDashboard = () => {
  const { isGuardian, linkedTeens } = useTeenCare();
  if (!isGuardian) return <div>You must be a guardian to access this page.</div>;
  return <GuardianDashboardMain teens={linkedTeens} />;
};

export default GuardianDashboard;
