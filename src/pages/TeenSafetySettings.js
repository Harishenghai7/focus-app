import React from 'react';
import { useTeenCare } from '../context/TeenCareContext';
import TeenSafetySettingsMain from '../components/teen/TeenSafetySettingsMain';

const TeenSafetySettings = () => {
  const { isTeen, safetySettings } = useTeenCare();
  if (!isTeen) return <div>Teen mode is not enabled for your account.</div>;
  return <TeenSafetySettingsMain settings={safetySettings} />;
};

export default TeenSafetySettings;
