import React from 'react';
import { useGlobalCallListener } from '../../hooks/useGlobalCallListener';
import IncomingCallModal from './IncomingCallModal';

const GlobalCallManager = () => {
    const callData = useGlobalCallListener();

    if (!callData?.incomingCall) return null;

    return (
        <IncomingCallModal
            caller={callData.incomingCall.caller}
            callType={callData.incomingCall.call_type}
            onAccept={callData.acceptCall}
            onReject={callData.declineCall}
        />
    );
};

export default GlobalCallManager;
