import React, { useState } from 'react';
import styles from './StoryEditor.module.css';
import PhotoEditor from './PhotoEditor';
import VideoEditor from './VideoEditor';

const StoryEditor = ({ files: initialFiles, onSave, onCancel }) => {
    const [files, setFiles] = useState(initialFiles);
    const [currentIndex, setCurrentIndex] = useState(0);
    const currentFile = files[currentIndex];
    const isVideo = currentFile.type.startsWith('video');

    const handleSaveCurrent = (editedData) => {
        // Create a new array with the updated file
        const updatedFiles = [...files];

        // If it's a video, we get an object with file and metadata
        // If it's a photo, we might just get the file or similar object
        const newFile = editedData.file || editedData;

        updatedFiles[currentIndex] = newFile;
        setFiles(updatedFiles);

        // Logic to update the file in the list
        if (currentIndex < files.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            onSave(updatedFiles); // Save all
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <span>Editing {currentIndex + 1} of {files.length}</span>
            </div>

            <div className={styles.editorWrapper}>
                {isVideo ? (
                    <VideoEditor
                        key={currentIndex} // Force re-mount on index change
                        file={currentFile}
                        onSave={handleSaveCurrent}
                        onCancel={onCancel}
                    />
                ) : (
                    <PhotoEditor
                        key={currentIndex} // Force re-mount on index change
                        file={currentFile}
                        onSave={handleSaveCurrent}
                        onCancel={onCancel}
                    />
                )}
            </div>
        </div>
    );
};

export default StoryEditor;
