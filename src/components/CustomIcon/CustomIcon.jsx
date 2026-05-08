import React from 'react';
import './CustomIcon.css';

const CustomIcon = ({
    name,
    size = 24,
    active = false,
    color = 'currentColor',
    strokeWidth = 2,
    className = '',
    ...props
}) => {
    const icons = {
        // NAVIGATION ICONS
        home: {
            outline: (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <path
                        d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V9.5Z"
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M9 21V12H15V21"
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            ),
            filled: (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <path
                        d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V9.5Z"
                        fill="url(#lavenderGradient)"
                    />
                    <path
                        d="M9 21V12H15V21"
                        fill="#1a1a1a"
                        stroke="url(#lavenderGradient)"
                        strokeWidth={1.5}
                    />
                    <defs>
                        <linearGradient id="lavenderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#9b87f5" />
                            <stop offset="100%" stopColor="#7c3aed" />
                        </linearGradient>
                    </defs>
                </svg>
            ),
        },

        explore: {
            outline: (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <circle
                        cx="11" cy="11" r="8"
                        stroke={color}
                        strokeWidth={strokeWidth}
                    />
                    <path
                        d="M21 21L16.65 16.65"
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                    />
                    <circle cx="11" cy="11" r="3" stroke={color} strokeWidth={strokeWidth} />
                </svg>
            ),
            filled: (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="8" fill="url(#lavenderGradient)" opacity="0.2" />
                    <circle cx="11" cy="11" r="8" stroke="url(#lavenderGradient)" strokeWidth={2} />
                    <path
                        d="M21 21L16.65 16.65"
                        stroke="url(#lavenderGradient)"
                        strokeWidth={2.5}
                        strokeLinecap="round"
                    />
                    <circle cx="11" cy="11" r="3" fill="url(#lavenderGradient)" />
                    <defs>
                        <linearGradient id="lavenderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#9b87f5" />
                            <stop offset="100%" stopColor="#7c3aed" />
                        </linearGradient>
                    </defs>
                </svg>
            ),
        },

        create: {
            outline: (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <rect
                        x="3" y="3" width="18" height="18" rx="4"
                        stroke={color}
                        strokeWidth={strokeWidth}
                    />
                    <path
                        d="M12 8V16M8 12H16"
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                    />
                </svg>
            ),
            filled: (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <rect
                        x="3" y="3" width="18" height="18" rx="4"
                        fill="url(#lavenderGradient)"
                    />
                    <path
                        d="M12 8V16M8 12H16"
                        stroke="#1a1a1a"
                        strokeWidth={2.5}
                        strokeLinecap="round"
                    />
                    <defs>
                        <linearGradient id="lavenderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#9b87f5" />
                            <stop offset="100%" stopColor="#7c3aed" />
                        </linearGradient>
                    </defs>
                </svg>
            ),
        },

        boltz: {
            outline: (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <path
                        d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            ),
            filled: (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <path
                        d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
                        fill="url(#lavenderGradient)"
                    />
                    <defs>
                        <linearGradient id="lavenderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#9b87f5" />
                            <stop offset="100%" stopColor="#7c3aed" />
                        </linearGradient>
                    </defs>
                </svg>
            ),
        },

        video: {
            outline: (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <path d="M23 7L16 12L23 17V7Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
                    <rect x="1" y="5" width="15" height="14" rx="2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            ),
            filled: (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <path d="M23 7L16 12L23 17V7Z" fill="url(#lavenderGradient)"/>
                    <rect x="1" y="5" width="15" height="14" rx="2" fill="url(#lavenderGradient)"/>
                    <defs>
                        <linearGradient id="lavenderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#9b87f5" />
                            <stop offset="100%" stopColor="#7c3aed" />
                        </linearGradient>
                    </defs>
                </svg>
            ),
        },

        profile: {
            outline: (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <circle
                        cx="12" cy="8" r="4"
                        stroke={color}
                        strokeWidth={strokeWidth}
                    />
                    <path
                        d="M4 20C4 16.6863 6.68629 14 10 14H14C17.3137 14 20 16.6863 20 20"
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                    />
                </svg>
            ),
            filled: (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="8" r="4" fill="url(#lavenderGradient)" />
                    <path
                        d="M4 20C4 16.6863 6.68629 14 10 14H14C17.3137 14 20 16.6863 20 20"
                        fill="url(#lavenderGradient)"
                    />
                    <defs>
                        <linearGradient id="lavenderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#9b87f5" />
                            <stop offset="100%" stopColor="#7c3aed" />
                        </linearGradient>
                    </defs>
                </svg>
            ),
        },
        user: {
            outline: (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="8" r="4" stroke={color} strokeWidth={strokeWidth}/>
                    <path d="M4 20C4 16.6863 6.68629 14 10 14H14C17.3137 14 20 16.6863 20 20" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
                </svg>
            ),
            filled: (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="8" r="4" fill="url(#lavenderGradient)"/>
                    <path d="M4 20C4 16.6863 6.68629 14 10 14H14C17.3137 14 20 16.6863 20 20" fill="url(#lavenderGradient)"/>
                    <defs>
                        <linearGradient id="lavenderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#9b87f5" />
                            <stop offset="100%" stopColor="#7c3aed" />
                        </linearGradient>
                    </defs>
                </svg>
            ),
        },

        shield: {
            outline: (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            ),
            filled: (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="url(#lavenderGradient)"/>
                    <defs>
                        <linearGradient id="lavenderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#9b87f5" />
                            <stop offset="100%" stopColor="#7c3aed" />
                        </linearGradient>
                    </defs>
                </svg>
            ),
        },

        notifications: {
            outline: (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <path
                        d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21"
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                    />
                </svg>
            ),
            filled: (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <path
                        d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"
                        fill="url(#lavenderGradient)"
                    />
                    <path
                        d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21"
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                    />
                    <defs>
                        <linearGradient id="lavenderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#9b87f5" />
                            <stop offset="100%" stopColor="#7c3aed" />
                        </linearGradient>
                    </defs>
                </svg>
            ),
        },

        messages: {
            outline: (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <path
                        d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            ),
            filled: (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <path
                        d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"
                        fill="url(#lavenderGradient)"
                    />
                    <defs>
                        <linearGradient id="lavenderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#9b87f5" />
                            <stop offset="100%" stopColor="#7c3aed" />
                        </linearGradient>
                    </defs>
                </svg>
            ),
        },

        // ACTION ICONS
        heart: {
            outline: (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <path
                        d="M20.84 4.61C20.3292 4.09944 19.7228 3.69676 19.0554 3.42544C18.3879 3.15412 17.6725 3.01953 16.95 3.01953C16.2275 3.01953 15.5121 3.15412 14.8446 3.42544C14.1772 3.69676 13.5708 4.09944 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.57831 8.50903 3.01918 7.05 3.01918C5.59096 3.01918 4.19169 3.57831 3.16 4.61C2.1283 5.64169 1.56917 7.04097 1.56917 8.5C1.56917 9.95903 2.1283 11.3583 3.16 12.39L4.22 13.45L12 21.23L19.78 13.45L20.84 12.39C21.3506 11.8792 21.7532 11.2728 22.0246 10.6053C22.2959 9.93789 22.4305 9.22248 22.4305 8.5C22.4305 7.77752 22.2959 7.06211 22.0246 6.39469C21.7532 5.72726 21.3506 5.12087 20.84 4.61Z"
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            ),
            filled: (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <path
                        d="M20.84 4.61C20.3292 4.09944 19.7228 3.69676 19.0554 3.42544C18.3879 3.15412 17.6725 3.01953 16.95 3.01953C16.2275 3.01953 15.5121 3.15412 14.8446 3.42544C14.1772 3.69676 13.5708 4.09944 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.57831 8.50903 3.01918 7.05 3.01918C5.59096 3.01918 4.19169 3.57831 3.16 4.61C2.1283 5.64169 1.56917 7.04097 1.56917 8.5C1.56917 9.95903 2.1283 11.3583 3.16 12.39L4.22 13.45L12 21.23L19.78 13.45L20.84 12.39C21.3506 11.8792 21.7532 11.2728 22.0246 10.6053C22.2959 9.93789 22.4305 9.22248 22.4305 8.5C22.4305 7.77752 22.2959 7.06211 22.0246 6.39469C21.7532 5.72726 21.3506 5.12087 20.84 4.61Z"
                        fill="#ef4444"
                    />
                </svg>
            ),
        },

        comment: {
            outline: (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <path
                        d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z"
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            ),
            filled: (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <path
                        d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z"
                        fill="url(#lavenderGradient)"
                    />
                    <defs>
                        <linearGradient id="lavenderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#9b87f5" />
                            <stop offset="100%" stopColor="#7c3aed" />
                        </linearGradient>
                    </defs>
                </svg>
            ),
        },

        share: {
            outline: (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <path
                        d="M4 12V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V12"
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M16 6L12 2L8 6"
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M12 2V15"
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                    />
                </svg>
            ),
            filled: (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <path
                        d="M4 12V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V12"
                        stroke="url(#lavenderGradient)"
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M16 6L12 2L8 6L12 2V15Z"
                        fill="url(#lavenderGradient)"
                    />
                    <defs>
                        <linearGradient id="lavenderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#9b87f5" />
                            <stop offset="100%" stopColor="#7c3aed" />
                        </linearGradient>
                    </defs>
                </svg>
            ),
        },

        bookmark: {
            outline: (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <path
                        d="M19 21L12 16L5 21V5C5 4.46957 5.21071 3.96086 5.58579 3.58579C5.96086 3.21071 6.46957 3 7 3H17C17.5304 3 18.0391 3.21071 18.4142 3.58579C18.7893 3.96086 19 4.46957 19 5V21Z"
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            ),
            filled: (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <path
                        d="M19 21L12 16L5 21V5C5 4.46957 5.21071 3.96086 5.58579 3.58579C5.96086 3.21071 6.46957 3 7 3H17C17.5304 3 18.0391 3.21071 18.4142 3.58579C18.7893 3.96086 19 4.46957 19 5V21Z"
                        fill="url(#lavenderGradient)"
                    />
                    <defs>
                        <linearGradient id="lavenderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#9b87f5" />
                            <stop offset="100%" stopColor="#7c3aed" />
                        </linearGradient>
                    </defs>
                </svg>
            ),
        },

        // UTILITY ICONS
        settings: {
            outline: (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="3" stroke={color} strokeWidth={strokeWidth} />
                    <path
                        d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22"
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                    />
                </svg>
            ),
            filled: (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="3" fill="url(#lavenderGradient)" />
                    <path
                        d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22"
                        stroke="url(#lavenderGradient)"
                        strokeWidth={2.5}
                        strokeLinecap="round"
                    />
                    <defs>
                        <linearGradient id="lavenderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#9b87f5" />
                            <stop offset="100%" stopColor="#7c3aed" />
                        </linearGradient>
                    </defs>
                </svg>
            ),
        },

        more: {
            outline: (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="5" r="1.5" fill={color} />
                    <circle cx="12" cy="12" r="1.5" fill={color} />
                    <circle cx="12" cy="19" r="1.5" fill={color} />
                </svg>
            ),
            filled: (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="5" r="2" fill="url(#lavenderGradient)" />
                    <circle cx="12" cy="12" r="2" fill="url(#lavenderGradient)" />
                    <circle cx="12" cy="19" r="2" fill="url(#lavenderGradient)" />
                    <defs>
                        <linearGradient id="lavenderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#9b87f5" />
                            <stop offset="100%" stopColor="#7c3aed" />
                        </linearGradient>
                    </defs>
                </svg>
            ),
        },

        close: {
            outline: (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <path
                        d="M18 6L6 18M6 6L18 18"
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                    />
                </svg>
            ),
            filled: (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <path
                        d="M18 6L6 18M6 6L18 18"
                        stroke="url(#lavenderGradient)"
                        strokeWidth={2.5}
                        strokeLinecap="round"
                    />
                    <defs>
                        <linearGradient id="lavenderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#9b87f5" />
                            <stop offset="100%" stopColor="#7c3aed" />
                        </linearGradient>
                    </defs>
                </svg>
            ),
        },

        back: {
            outline: (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <path
                        d="M19 12H5M5 12L12 19M5 12L12 5"
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            ),
            filled: (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <path
                        d="M19 12H5M5 12L12 19M5 12L12 5"
                        stroke="url(#lavenderGradient)"
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <defs>
                        <linearGradient id="lavenderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#9b87f5" />
                            <stop offset="100%" stopColor="#7c3aed" />
                        </linearGradient>
                    </defs>
                </svg>
            ),
        },

        flash: {
            outline: (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth={strokeWidth} />
                    <circle cx="12" cy="12" r="4" fill={color} />
                </svg>
            ),
            filled: (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" fill="url(#lavenderGradient)" opacity="0.2" />
                    <circle cx="12" cy="12" r="10" stroke="url(#lavenderGradient)" strokeWidth={2} />
                    <circle cx="12" cy="12" r="4" fill="url(#lavenderGradient)" />
                    <defs>
                        <linearGradient id="lavenderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#9b87f5" />
                            <stop offset="100%" stopColor="#7c3aed" />
                        </linearGradient>
                    </defs>
                </svg>
            ),
        },
    };

    const icon = icons[name];
    if (!icon) {
        console.warn(`Icon "${name}" not found`);
        return null;
    }

    return (
        <span className={`custom-icon ${active ? 'active' : ''} ${className}`} {...props}>
            {active ? icon.filled : icon.outline}
        </span>
    );
};

export default CustomIcon;
