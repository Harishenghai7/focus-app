import React from 'react';
import styles from './Preview.module.css';
import Button from '../shared/Button';
import { Heart, MessageCircle, Send } from 'lucide-react';

const Preview = ({ mode, media, caption, tags, music, onEdit, onPublish }) => {
    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Preview</h2>

            <div className={styles.preview}>
                {mode === 'post' && (
                    <div className={styles.postPreview}>
                        {media.map((file, i) => (
                            <img
                                key={i}
                                src={URL.createObjectURL(file)}
                                alt=""
                                className={styles.image}
                            />
                        ))}
                    </div>
                )}

                {mode === 'boltz' && media[0] && (
                    <div className={styles.boltzPreview}>
                        <video
                            src={URL.createObjectURL(media[0])}
                            className={styles.video}
                            controls
                        />
                    </div>
                )}

                {mode === 'flash' && (
                    <div className={styles.flashPreview}>
                        {media.map((file, i) => (
                            file.type.startsWith('image') ? (
                                <img
                                    key={i}
                                    src={URL.createObjectURL(file)}
                                    alt=""
                                    className={styles.storyImage}
                                />
                            ) : (
                                <video
                                    key={i}
                                    src={URL.createObjectURL(file)}
                                    className={styles.storyVideo}
                                />
                            )
                        ))}
                    </div>
                )}

                <div className={styles.details}>
                    {caption && <p className={styles.caption}>{caption}</p>}
                    {tags.length > 0 && (
                        <div className={styles.tags}>
                            {tags.map((tag, i) => (
                                <span key={i} className={styles.tag}>#{tag}</span>
                            ))}
                        </div>
                    )}
                    {music && (
                        <div className={styles.music}>
                            🎵 {music.name} - {music.artist_name}
                        </div>
                    )}
                </div>

                <div className={styles.actions}>
                    <button className={styles.actionBtn}><Heart size={20} /></button>
                    <button className={styles.actionBtn}><MessageCircle size={20} /></button>
                    <button className={styles.actionBtn}><Send size={20} /></button>
                </div>
            </div>

            <div className={styles.buttons}>
                <Button variant="secondary" onClick={onEdit}>Edit</Button>
                <Button onClick={onPublish}>Publish</Button>
            </div>
        </div>
    );
};

export default Preview;
