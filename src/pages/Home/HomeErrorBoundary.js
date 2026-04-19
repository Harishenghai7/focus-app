import React from 'react';
import MainLayout from '../../components/layout/MainLayout';
import Button from '../../components/ui/Button';
import styles from './HomeErrorBoundary.module.css';

export default class HomeErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('[HomeErrorBoundary]', error, info?.componentStack);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <MainLayout>
                    <div className={styles.wrap}>
                        <h1 className={styles.title}>Something went wrong</h1>
                        <p className={styles.text}>
                            The feed hit an unexpected error. You can try again — your session is
                            unchanged.
                        </p>
                        {process.env.NODE_ENV === 'development' && this.state.error?.message && (
                            <pre className={styles.pre}>{this.state.error.message}</pre>
                        )}
                        <Button variant="primary" onClick={this.handleRetry}>
                            Reload feed
                        </Button>
                    </div>
                </MainLayout>
            );
        }
        return this.props.children;
    }
}
