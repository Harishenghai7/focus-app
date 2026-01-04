import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { useTextModeration } from '../../hooks/useTextModeration';
import { useImageModeration } from '../../hooks/useImageModeration';
import { logModerationAction } from '../../utils/moderationLogger';
import WarningModal from './WarningModal';
import AppealForm from './AppealForm';

const ContentFilter = forwardRef(({ userId, contentType = 'post', onPass, onBlock }, ref) => {
    const [modalState, setModalState] = useState({ isOpen: false, type: 'warning', reason: '', blockedId: null });
    const { checkText, isChecking: isTextChecking } = useTextModeration();
    const { checkImage, isChecking: isImageChecking } = useImageModeration();

    useImperativeHandle(ref, () => ({
        validate: async (text, images = []) => {
            // 1. Check Text
            if (text) {
                const textResult = await checkText(text);
                if (textResult.flagged) {
                    handleBlock(textResult, 'text');
                    return false;
                }
            }

            // 2. Check Images
            if (images.length > 0) {
                for (const img of images) {
                    let imageElement = img;
                    let objectUrl = null;

                    if (img instanceof File || img instanceof Blob) {
                        try {
                            objectUrl = URL.createObjectURL(img);
                            imageElement = await new Promise((resolve, reject) => {
                                const i = new Image();
                                i.onload = () => resolve(i);
                                i.onerror = reject;
                                i.src = objectUrl;
                            });
                        } catch (e) {
                            console.error('Error creating image from file:', e);
                            continue;
                        }
                    }

                    const imgResult = await checkImage(imageElement);

                    if (objectUrl) URL.revokeObjectURL(objectUrl);

                    if (imgResult.flagged) {
                        handleBlock(imgResult, 'image');
                        return false;
                    }
                }
            }

            // Passed
            if (onPass) onPass();
            return true;
        }
    }));

    const handleBlock = async (result, type) => {
        // Log to DB
        const logResult = await logModerationAction({
            userId,
            contentId: null, // We don't have content ID yet as it's not saved
            contentType,
            reason: result.reason,
            toxicScore: result.type === 'ai_toxicity' ? 0.9 : 0, // Simplified
            nsfwScore: result.type === 'ai_nsfw' ? 0.9 : 0,
            blockType: 'soft', // Default to soft block for now
            status: 'blocked'
        });

        const blockedId = logResult && logResult[0] ? logResult[0].id : null;

        setModalState({
            isOpen: true,
            type: 'warning',
            reason: result.reason,
            blockedId
        });

        if (onBlock) onBlock(result);
    };

    const handleClose = () => {
        setModalState({ ...modalState, isOpen: false });
    };

    const handleAppeal = () => {
        setModalState({ ...modalState, type: 'appeal' });
    };

    const handleAppealSuccess = () => {
        // Maybe close after a delay or show success message
        setTimeout(() => {
            setModalState({ ...modalState, isOpen: false });
        }, 2000);
    };

    return (
        <>
            {modalState.type === 'warning' && (
                <WarningModal
                    isOpen={modalState.isOpen}
                    onClose={handleClose}
                    reason={modalState.reason}
                    onEdit={handleClose}
                    onAppeal={modalState.blockedId ? handleAppeal : null}
                />
            )}

            {modalState.type === 'appeal' && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(0,0,0,0.7)' }}>
                    <AppealForm
                        blockedContentId={modalState.blockedId}
                        userId={userId}
                        onCancel={handleClose}
                        onSuccess={handleAppealSuccess}
                    />
                </div>
            )}
        </>
    );
});

export default ContentFilter;
