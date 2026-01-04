import React from 'react';
import { useTeenCare } from '../context/TeenCareContext';
import EmergencyPanicButtonMain from '../components/teen/EmergencyPanicButtonMain';

const EmergencyPanicButton = () => {
  const { isTeen } = useTeenCare();
  if (!isTeen) return <div>Only teens can use the panic button.</div>;
  return <EmergencyPanicButtonMain />;
};

export default EmergencyPanicButton;
