import React from 'react';
import { useNavigate } from 'react-router-dom';
import ActionSheet from '../ui/ActionSheet';
import { Shield, Filter, Heart, Users, Star } from 'lucide-react';

const PillarMenu = ({ isOpen, onClose }) => {
    const navigate = useNavigate();

    const pillarOptions = [
        { 
            id: 'trust-shield', 
            label: 'Focus Trust Shield', 
            icon: Shield, 
            onClick: () => navigate('/trust-shield') 
        },
        { 
            id: 'moderation', 
            label: 'Content Filter & Moderator', 
            icon: Filter, 
            onClick: () => navigate('/moderation') 
        },
        { 
            id: 'support', 
            label: 'Report & Support System', 
            icon: Heart, 
            onClick: () => navigate('/support') 
        },
        { 
            id: 'teen-care', 
            label: 'Focus Teen Care', 
            icon: Users, 
            onClick: () => navigate('/teen-care') 
        },
        { 
            id: 'focusly-ai', 
            label: 'Focusly AI', 
            icon: Star, 
            onClick: () => navigate('/focusly-ai') 
        },
    ];

    return (
        <ActionSheet 
            isOpen={isOpen} 
            onClose={onClose} 
            options={pillarOptions} 
            mode="sheet"
        />
    );
};

export default PillarMenu;
